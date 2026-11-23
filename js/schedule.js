// スケジュール・イベント：data/schedule.json と data/events.json から作る
(function () {
  'use strict';

  var WEEK = ['日', '月', '火', '水', '木', '金', '土'];
  var TODO = '【要確認】';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function getJSON(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' ' + r.status);
      return r.json();
    });
  }
  function extLink(a, url) {
    a.href = url;
    if (/^https?:/.test(url)) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }
  // 値があればそのまま、なければ【要確認】の印
  function valueOrTodo(dd, v) {
    if (v) dd.textContent = v;
    else dd.appendChild(el('span', 'todo-inline', TODO));
  }

  function showDojo(d) {
    if (!d) return;
    document.getElementById('dojo-name').textContent = d.name;
    document.getElementById('dojo-when').textContent = d.when;
    document.getElementById('dojo-place').textContent = d.place;
    document.getElementById('dojo-note').textContent = d.note || '';
  }

  function renderItems(ol, items, eventsById, today, nextDate) {
    var lastMonth = '';
    items.forEach(function (it) {
      var d = parse(it.date);
      var month = d.getFullYear() + '年' + (d.getMonth() + 1) + '月';
      if (month !== lastMonth) {
        ol.appendChild(el('li', 'sched-month', month));
        lastMonth = month;
      }
      var past = it.date < today;
      var isNext = it.date === nextDate;
      var li = el('li', 'sched-item' + (past ? ' is-past' : '') + (isNext ? ' is-next' : ''));
      if (isNext) li.setAttribute('aria-current', 'date');

      var day = el('div', 'sched-day');
      day.appendChild(el('span', 'sched-d', String(d.getDate())));
      day.appendChild(el('span', 'sched-w', WEEK[d.getDay()]));
      li.appendChild(day);

      var body = el('div', 'sched-body');
      if (isNext) body.appendChild(el('span', 'chip chip-next', '次の大会'));
      var t = el('p', 'sched-title');
      if (eventsById[it.event]) {
        var a = el('a', null, it.title);
        a.href = '#ev-' + it.event;
        t.appendChild(a);
      } else {
        t.textContent = it.title;
      }
      body.appendChild(t);

      var meta = [];
      if (it.time) meta.push(it.time);
      if (it.place) meta.push(it.place);
      if (meta.length) {
        body.appendChild(el('p', 'sched-meta', meta.join('・')));
      } else if (!past) {
        var m = el('p', 'sched-meta');
        m.appendChild(el('span', 'todo-inline', TODO + '会場・時間'));
        body.appendChild(m);
      }

      if (past) {
        if (it.result) body.appendChild(extLink(el('a', 'chip chip-result', '成績を見る' + (it.resultLabel ? '（' + it.resultLabel + '）' : '')), it.result));
        else body.appendChild(el('span', 'chip chip-done', '終了'));
      }
      li.appendChild(body);
      ol.appendChild(li);
    });
  }

  // 終わった大会は畳んで上に、これからの日程を先に見せる
  function showSchedule(items, eventsById) {
    var ol = document.getElementById('schedule-list');
    var pastBox = document.getElementById('past-box');
    ol.innerHTML = '';
    var today = todayStr();
    items = items.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var past = items.filter(function (it) { return it.date < today; });
    var coming = items.filter(function (it) { return it.date >= today; });
    var nextDate = coming.length ? coming[0].date : null;

    if (past.length) {
      pastBox.hidden = false;
      document.getElementById('past-count').textContent = past.length;
      var pol = document.getElementById('past-list');
      pol.innerHTML = '';
      renderItems(pol, past, eventsById, today, null);
    }
    if (coming.length) renderItems(ol, coming, eventsById, today, nextDate);
    else ol.appendChild(el('li', 'muted', 'これからの日程は準備中です。'));
  }

  function showEvents(events) {
    var box = document.getElementById('event-list');
    box.innerHTML = '';
    events.forEach(function (ev) {
      var art = el('article', 'event');
      art.id = 'ev-' + ev.id;
      art.appendChild(el('h3', null, ev.name));
      if (ev.about) art.appendChild(el('p', null, ev.about));
      var dl = el('dl', 'event-facts');
      [['会場', ev.place], ['時間', ev.time], ['参加費', ev.fee], ['参加方法', ev.join]].forEach(function (row) {
        if (row[0] === '時間' && !ev.time) return;
        if (row[1] === null) return;   // 現行HPに記載がなく、載せないと決まったもの
        var div = el('div');
        div.appendChild(el('dt', null, row[0]));
        var dd = el('dd');
        valueOrTodo(dd, row[1]);
        div.appendChild(dd);
        dl.appendChild(div);
      });
      art.appendChild(dl);
      if (ev.todo && ev.todo.length) {
        var todo = el('div', 'todo');
        todo.appendChild(el('p', 'todo-mark', TODO));
        todo.appendChild(el('p', null, ev.todo.join('、') + 'を書きます。'));
        art.appendChild(todo);
      }
      box.appendChild(art);
    });
  }

  Promise.all([getJSON('data/schedule.json'), getJSON('data/events.json')]).then(function (res) {
    var info = res[1];
    var byId = {};
    info.events.forEach(function (e) { byId[e.id] = e; });
    document.getElementById('season').textContent = info.season;
    showDojo(info.dojo);
    showSchedule(res[0], byId);
    showEvents(info.events);
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }).catch(function () {
    document.getElementById('schedule-list').innerHTML = '<li class="muted">読み込めませんでした。時間をおいて開き直してください。</li>';
    document.getElementById('event-list').innerHTML = '';
  });
})();
