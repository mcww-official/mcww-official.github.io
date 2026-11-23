// 全ページ共通：画面下の「メニュー」を開け閉めする
(function () {
  'use strict';
  // メニュー（画面下の「メニュー」）
  var menu = document.getElementById('site-menu');
  var btn = document.getElementById('menu-btn');
  var closeBtn = document.getElementById('menu-close');
  function openMenu(e) { e.preventDefault(); menu.hidden = false; closeBtn.focus(); }
  function closeMenu() { menu.hidden = true; btn.focus(); }
  btn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  menu.addEventListener('click', function (e) { if (e.target === menu) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) closeMenu(); });
})();
