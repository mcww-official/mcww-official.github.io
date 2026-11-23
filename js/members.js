// 所属プロ・会員・ルール：所属プロを data/pros.json から出す。#rule-… で来たらそのルールを開く
(function () {
  'use strict';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  fetch('data/pros.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (pros) {
      var ul = document.getElementById('pro-list');
      ul.innerHTML = '';
      pros.forEach(function (p) {
        var li = el('li', 'pro');
        var ph = el('div', 'pro-photo');
        if (p.photo) {
          var img = el('img');
          img.src = p.photo; img.alt = p.name + 'の写真'; img.loading = 'lazy';
          ph.appendChild(img);
        } else {
          ph.appendChild(el('span', null, '写真は準備中'));
        }
        li.appendChild(ph);
        var body = el('div', 'pro-body');
        body.appendChild(el('span', 'pro-title', p.title));
        body.appendChild(el('p', 'pro-name', p.name));
        if (p.kana) body.appendChild(el('p', 'pro-kana', p.kana));
        if (p.profile) body.appendChild(el('p', 'pro-profile', p.profile));
        li.appendChild(body);
        ul.appendChild(li);
      });
    })
    .catch(function () {
      document.getElementById('pro-list').innerHTML = '<li class="muted">読み込めませんでした。時間をおいて開き直してください。</li>';
    });

  function openFromHash() {
    var id = location.hash.slice(1);
    var t = id && document.getElementById(id);
    if (t && t.tagName === 'DETAILS') { t.open = true; t.scrollIntoView(); }
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
})();
