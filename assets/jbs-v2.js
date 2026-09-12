/* JBS v2 共通スクリプト（依存ライブラリなし）
   1. ドロワーナビ（≤900px）  2. サブメニュー開閉  3. ヒーロー写真の回転
   4. コンテンツ一覧 <details> の open 同期  5. sticky ヘッダーの影            */
(function () {
  'use strict';

  var body = document.body;
  var burger = document.querySelector('.jbs-burger');
  var gnav = document.getElementById('jbs-gnav');
  var closeBtn = gnav ? gnav.querySelector('.jbs-gnav__close') : null;
  var bg = document.querySelector('.jbs-gnav__bg');
  var mqSp = window.matchMedia('(max-width:900px)');

  // --- 1. ドロワー ---------------------------------------------------------
  function openNav() {
    body.classList.add('jbs-nav-open');
    if (burger) { burger.setAttribute('aria-expanded', 'true'); }
    if (closeBtn) { closeBtn.focus(); }
  }
  function closeNav(returnFocus) {
    if (!body.classList.contains('jbs-nav-open')) { return; }
    body.classList.remove('jbs-nav-open');
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      if (returnFocus) { burger.focus(); }
    }
  }
  if (burger && gnav) {
    burger.addEventListener('click', function () {
      if (body.classList.contains('jbs-nav-open')) { closeNav(true); } else { openNav(); }
    });
    if (closeBtn) { closeBtn.addEventListener('click', function () { closeNav(true); }); }
    if (bg) { bg.addEventListener('click', function () { closeNav(true); }); }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeNav(true); }
    });
    // PC幅に戻ったら閉じる
    mqSp.addEventListener ? mqSp.addEventListener('change', function (e) { if (!e.matches) { closeNav(false); } })
                          : mqSp.addListener(function (e) { if (!e.matches) { closeNav(false); } });
  }

  // --- 2. サブメニュー（SPはボタンで開閉。PCはCSSの :hover / :focus-within） ---
  var parents = gnav ? gnav.querySelectorAll('.jbs-gnav__list > li') : [];
  Array.prototype.forEach.call(parents, function (li) {
    var sub = li.querySelector(':scope > ul');
    var tgl = li.querySelector(':scope > .jbs-gnav__tgl');
    if (!sub) { return; }
    li.classList.add('jbs-has-sub');
    if (!tgl) { return; }
    tgl.addEventListener('click', function () {
      var open = li.classList.toggle('is-open');
      tgl.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  // --- 4. コンテンツ一覧：SPではアコーディオン、PCでは常時展開 -------------
  var mqHub = window.matchMedia('(max-width:600px)');
  var hubs = document.querySelectorAll('details.jbs-hub__col');
  function syncHub(e) {
    var sp = e ? e.matches : mqHub.matches;
    Array.prototype.forEach.call(hubs, function (d) { d.open = !sp; });
  }
  if (hubs.length) {
    syncHub();
    mqHub.addEventListener ? mqHub.addEventListener('change', syncHub) : mqHub.addListener(syncHub);
  }

  // --- 5. sticky ヘッダーの影 ---------------------------------------------
  var hd = document.querySelector('.jbs-hd');
  var sentinel = document.querySelector('.jbs-hd-sentinel');
  if (hd && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      hd.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
  }
})();

/* --- 3. ヒーロー写真のローテーション（v1 jbs.js から流用） ------------------ */
(function () {
  'use strict';
  var box = document.querySelector('[data-jbs-rotate]');
  if (!box) { return; }

  var slides = box.querySelectorAll('figure');
  var dots = box.querySelectorAll('.jbs-hero__dots button');
  if (slides.length < 2) { return; }

  var wait = parseInt(box.getAttribute('data-interval'), 10) || 6000;
  var cur = 0;
  var timer = null;

  function show(i) {
    cur = (i + slides.length) % slides.length;
    for (var n = 0; n < slides.length; n++) {
      if (n === cur) { slides[n].classList.add('is-active'); }
      else { slides[n].classList.remove('is-active'); }
      if (dots[n]) { dots[n].setAttribute('aria-selected', n === cur ? 'true' : 'false'); }
    }
  }
  function start() { stop(); timer = setInterval(function () { show(cur + 1); }, wait); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  for (var i = 0; i < dots.length; i++) {
    (function (n) {
      dots[n].addEventListener('click', function () { show(n); start(); });
    })(i);
  }

  box.addEventListener('mouseenter', stop);
  box.addEventListener('mouseleave', start);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stop(); } else { start(); }
  });

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) { start(); }
})();
