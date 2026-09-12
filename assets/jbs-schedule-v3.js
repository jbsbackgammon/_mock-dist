/* サイドカード「大会・例会等の予定」— 週／月の切り替え・前後移動・日付選択（依存ライブラリなし）
   マークアップは inc/schedule.php。ルート [data-jbs-sched] にイベント委譲するので、
   REST で差し替えた HTML にもそのまま効く。 */
(function () {
  'use strict';

  var STORAGE_KEY = 'jbs-sched-view';

  function readPref() {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function writePref(v) {
    try { window.localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* 保存できなくても動作に影響なし */ }
  }

  function init(root) {
    var rest = root.getAttribute('data-jbs-rest') || '';
    var tabs = root.querySelectorAll('[role="tab"][data-jbs-view]');
    var panels = root.querySelectorAll('.jbs-sched__panel[data-jbs-view]');

    // --- タブ ---------------------------------------------------------------
    function showView(view) {
      Array.prototype.forEach.call(tabs, function (t) {
        var on = t.getAttribute('data-jbs-view') === view;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
      });
      Array.prototype.forEach.call(panels, function (p) {
        p.hidden = p.getAttribute('data-jbs-view') !== view;
      });
    }
    var pref = readPref();
    if (pref === 'week' || pref === 'month') { showView(pref); }

    // --- 日付の選択（月） ---------------------------------------------------------
    function selectDay(panel, btn) {
      Array.prototype.forEach.call(panel.querySelectorAll('.jbs-cal__day'), function (b) {
        var on = b === btn;
        b.classList.toggle('is-selected', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var date = btn.getAttribute('data-date');
      var found = false;
      Array.prototype.forEach.call(panel.querySelectorAll('.jbs-cal__daylist'), function (d) {
        var on = d.getAttribute('data-date') === date;
        d.hidden = !on;
        if (on) { found = true; }
      });
      var empty = panel.querySelector('[data-empty]');
      if (empty) { empty.hidden = found; }
    }

    // --- 前へ／次へ（REST） ----------------------------------------------------
    function load(panel, view, date) {
      if (!rest) { return; }
      var url = rest + (rest.indexOf('?') === -1 ? '?' : '&') + 'view=' + encodeURIComponent(view) + '&date=' + encodeURIComponent(date);
      panel.setAttribute('aria-busy', 'true');
      Array.prototype.forEach.call(panel.querySelectorAll('.jbs-sched__btn'), function (b) { b.disabled = true; });

      fetch(url, { credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.json(); })
        .then(function (json) {
          panel.innerHTML = json.html;
        })
        .catch(function () {
          var msg = panel.querySelector('.jbs-embed__msg[data-error]');
          if (!msg) {
            msg = document.createElement('p');
            msg.className = 'jbs-embed__msg';
            msg.setAttribute('data-error', '');
            panel.appendChild(msg);
          }
          msg.textContent = '予定を取得できませんでした。';
          Array.prototype.forEach.call(panel.querySelectorAll('.jbs-sched__btn'), function (b) { b.disabled = false; });
        })
        .then(function () { panel.removeAttribute('aria-busy'); });
    }

    // --- イベント委譲 -----------------------------------------------------------
    root.addEventListener('click', function (e) {
      var tab = e.target.closest('[role="tab"][data-jbs-view]');
      if (tab && root.contains(tab)) {
        var v = tab.getAttribute('data-jbs-view');
        showView(v);
        writePref(v);
        return;
      }
      var nav = e.target.closest('[data-jbs-nav]');
      if (nav && root.contains(nav)) {
        var panel = nav.closest('.jbs-sched__panel');
        if (panel) { load(panel, panel.getAttribute('data-jbs-view'), nav.getAttribute('data-date')); }
        return;
      }
      var day = e.target.closest('.jbs-cal__day');
      if (day && root.contains(day)) {
        var mp = day.closest('.jbs-sched__panel');
        if (mp) { selectDay(mp, day); }
      }
    });

    // タブの左右キー移動（WAI-ARIA tabs パターン）
    root.addEventListener('keydown', function (e) {
      var tab = e.target.closest('[role="tab"][data-jbs-view]');
      if (!tab || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) { return; }
      var list = Array.prototype.slice.call(tabs);
      var i = list.indexOf(tab);
      var next = list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
      if (next) { next.focus(); next.click(); }
      e.preventDefault();
    });
  }

  var roots = document.querySelectorAll('[data-jbs-sched]');
  Array.prototype.forEach.call(roots, init);
})();
