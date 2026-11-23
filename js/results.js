// 成績・レポート：data/results.json から作る。種類・年度で絞り込める（?kind=…&year=…）
(function () {
  'use strict';

  var TODO = '【要確認】';
  var NO_YEAR = 'none';   // 現行HPに年度の表記がないもの

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function todo(text) { return el('span', 'todo-inline', TODO + (text || '')); }
  function fmtDate(s) {
    var p = s.split('-');
    return p.length === 3 ? p[0] + '年' + (+p[1]) + '月' + (+p[2]) + '日' : p[0] + '年' + (+p[1]) + '月';
  }
  function ext(a, url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; return a; }

  var params = new URLSearchParams(location.search);
  var state = { kind: params.get('kind') || 'all', year: params.get('year') || 'all' };
  var data;

  function card(r, kindName) {
    var art = el('article', 'result');
    art.id = 'r-' + r.id;

    var meta = el('p', 'result-meta');
    meta.appendChild(el('span', 'chip chip-kind', kindName));
    if (r.year) meta.appendChild(el('span', 'chip chip-year', r.year));
    else meta.appendChild(todo('年度'));
    art.appendChild(meta);

    art.appendChild(el('h3', null, r.title));
    var d = el('p', 'result-date');
    d.appendChild(document.createTextNode('開催：' + fmtDate(r.date) + (r.dateTodo ? 'ごろ ' : '')));
    if (r.dateTodo) d.appendChild(todo('開催日'));
    art.appendChild(d);

    if (r.top && r.top.length) {
      var dl = el('dl', 'result-top');
      r.top.forEach(function (t) {
        var div = el('div');
        div.appendChild(el('dt', null, t.rank));
        var dd = el('dd');
        if (t.name) dd.textContent = t.name; else dd.appendChild(todo());
        div.appendChild(dd);
        dl.appendChild(div);
      });
      art.appendChild(dl);
    }

    if (r.table) {
      var wrap = el('div', 'table-wrap');
      wrap.tabIndex = 0;
      var tb = el('table', 'score');
      var cap = el('caption', 'visually-hidden', r.title + ' 成績表');
      tb.appendChild(cap);
      var thead = el('thead'), tr = el('tr');
      tr.appendChild(el('th', null, '順位'));
      r.table.head.forEach(function (h) { var th = el('th', null, h); th.scope = 'col'; tr.appendChild(th); });
      thead.appendChild(tr); tb.appendChild(thead);
      var tbody = el('tbody');
      r.table.rows.forEach(function (row, i) {
        var tr2 = el('tr');
        tr2.appendChild(el('td', 'rank', (i + 1) + '位'));
        row.forEach(function (c, j) {
          var cell = el(j === 0 ? 'th' : 'td', null, c);
          if (j === 0) cell.scope = 'row';
          if (j > 0 && c.charAt(0) === '-') cell.className = 'minus';
          if (j === row.length - 1) cell.className = (cell.className + ' total').trim();
          tr2.appendChild(cell);
        });
        tbody.appendChild(tr2);
      });
      tb.appendChild(tbody);
      wrap.appendChild(tb);
      art.appendChild(wrap);
    }

    if (r.images && r.images.length) {
      var g = el('div', 'result-images');
      r.images.forEach(function (im) {
        var a = el('a');
        a.href = im.src;
        a.target = '_blank';
        var img = el('img');
        img.src = im.src; img.alt = im.alt; img.width = im.w; img.height = im.h;
        img.loading = 'lazy'; img.decoding = 'async';
        a.appendChild(img);
        g.appendChild(a);
      });
      art.appendChild(g);
    }

    if (r.note) art.appendChild(el('p', 'result-note', r.note));
    var links = el('p', 'result-links');
    if (r.external) links.appendChild(ext(el('a', null, r.external.label), r.external.url));
    if (r.source) links.appendChild(ext(el('a', null, '現行HPの記事'), r.source));
    if (links.children.length) art.appendChild(links);
    return art;
  }

  function render() {
    var kinds = {};
    data.kinds.forEach(function (k) { kinds[k.id] = k.name; });
    var list = data.results
      .filter(function (r) {
        if (state.kind !== 'all' && r.kind !== state.kind) return false;
        if (state.year === 'all') return true;
        if (state.year === NO_YEAR) return !r.year;
        return r.year === state.year;
      })
      .sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });

    var box = document.getElementById('result-list');
    box.innerHTML = '';
    document.getElementById('result-count').textContent = list.length + '件';
    if (!list.length) {
      var empty = el('div', 'todo');
      empty.appendChild(el('p', 'todo-mark', TODO));
      empty.appendChild(el('p', null, 'この条件の成績は、まだ載せていません（現行HPで2025・2026年度の成績が見つからなかったもの）。'));
      box.appendChild(empty);
    }
    list.forEach(function (r) { box.appendChild(card(r, kinds[r.kind] || r.kind)); });

    // ボタンの選択状態
    Array.prototype.forEach.call(document.querySelectorAll('#kind-filter button'), function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.kind === state.kind));
    });
    document.getElementById('year-filter').value = state.year;
  }

  function setState(k, v) {
    state[k] = v;
    var q = new URLSearchParams();
    if (state.kind !== 'all') q.set('kind', state.kind);
    if (state.year !== 'all') q.set('year', state.year);
    var qs = q.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    render();
  }

  function buildFilters() {
    var kf = document.getElementById('kind-filter');
    [{ id: 'all', name: 'すべて' }].concat(data.kinds).forEach(function (k) {
      var b = el('button', 'filter-btn', k.name);
      b.type = 'button';
      b.dataset.kind = k.id;
      b.addEventListener('click', function () { setState('kind', k.id); });
      kf.appendChild(b);
    });
    var yf = document.getElementById('year-filter');
    [['all', 'すべての年度']].concat(data.years.map(function (y) { return [y, y]; }), [[NO_YEAR, '年度の表記なし']]).forEach(function (o) {
      var op = el('option', null, o[1]); op.value = o[0]; yf.appendChild(op);
    });
    yf.addEventListener('change', function () { setState('year', yf.value); });

    var ul = document.getElementById('older-list');
    data.older.forEach(function (o) {
      var li = el('li');
      li.appendChild(ext(el('a', null, o.name), o.url));
      ul.appendChild(li);
    });
  }

  fetch('data/results.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      data = d;
      buildFilters();
      // 日程ページから #r-… で来たときは、絞り込みを外してその成績へ
      if (location.hash.indexOf('#r-') === 0) { state.kind = 'all'; state.year = 'all'; }
      render();
      if (location.hash) {
        var t = document.getElementById(location.hash.slice(1));
        if (t) { t.classList.add('is-target'); t.scrollIntoView(); }
      }
    })
    .catch(function () {
      document.getElementById('result-list').innerHTML = '<p class="muted">読み込めませんでした。時間をおいて開き直してください。</p>';
    });
})();
