// トップページ：data/ の JSON から「次のイベント」「お知らせ」「最新成績」を出す
(function () {
  'use strict';

  var WEEK = ['日', '月', '火', '水', '木', '金', '土'];

  function fmtDate(s) {
    var p = s.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日（' + WEEK[d.getDay()] + '）';
  }
  function fmtShort(s) {
    return s.split('-').join('.');
  }
  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function linkOrText(item) {
    if (!item.url) return document.createTextNode(item.title);
    var a = el('a', null, item.title);
    a.href = item.url;
    if (/^https?:/.test(item.url)) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }
  function getJSON(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' ' + r.status);
      return r.json();
    });
  }
  function fail(box, isList) {
    box.innerHTML = '';
    box.appendChild(el(isList ? 'li' : 'p', 'muted', '読み込めませんでした。時間をおいて開き直してください。'));
  }

  // 次のイベント：今日以降でいちばん近いもの
  function showNext(events) {
    var box = document.getElementById('next-event');
    var today = todayStr();
    var next = events
      .filter(function (e) { return e.date >= today; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0];
    box.innerHTML = '';
    if (!next) { box.appendChild(el('p', 'muted', '次のイベントは準備中です。')); return; }
    box.appendChild(el('p', 'ne-date', fmtDate(next.date) + (next.time ? ' ' + next.time : '')));
    var t = el('p', 'ne-title');
    t.appendChild(linkOrText(next));
    box.appendChild(t);
    if (next.place) box.appendChild(el('p', 'ne-place', next.place));
  }

  // お知らせ・最新成績：新しい順に3件
  function showList(id, items) {
    var ul = document.getElementById(id);
    ul.innerHTML = '';
    items
      .slice()
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; })
      .slice(0, 3)
      .forEach(function (it) {
        var li = el('li');
        li.appendChild(el('time', null, fmtShort(it.date))).setAttribute('datetime', it.date);
        li.appendChild(linkOrText(it));
        ul.appendChild(li);
      });
    if (!ul.children.length) ul.appendChild(el('li', 'muted', 'まだありません。'));
  }

  getJSON('data/schedule.json').then(showNext).catch(function () { fail(document.getElementById('next-event')); });
  getJSON('data/news.json').then(function (d) { showList('news-list', d); }).catch(function () { fail(document.getElementById('news-list'), true); });
  getJSON('data/results.json').then(function (d) {
    showList('results-list', d.results.map(function (r) {
      return { date: r.date, title: r.title, url: 'results.html#r-' + r.id };
    }));
  }).catch(function () { fail(document.getElementById('results-list'), true); });

})();
