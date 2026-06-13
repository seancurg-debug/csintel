/* CSINTEL — nav.js · mobile menu, page-wipe transitions, filters */
(function () {
  'use strict';

  // mobile menu
  var burger = document.getElementById('nav-burger');
  var mobileNav = document.getElementById('nav-mobile');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // scan-line wipe between internal pages
  var wipe = document.querySelector('.page-wipe');
  if (wipe && !window.CSI.reducedMotion) {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      var internal = href &&
        !href.startsWith('http') &&
        !href.startsWith('#') &&
        !href.startsWith('mailto:') &&
        href.endsWith('.html') &&
        a.target !== '_blank';
      if (!internal) return;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        wipe.classList.add('run');
        setTimeout(function () { location.href = href; }, 430);
      });
    });
    // restore when navigating back via bfcache
    window.addEventListener('pageshow', function () {
      wipe.classList.remove('run');
    });
  }

  // project filter (tools page)
  var filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length) {
    var cards = document.querySelectorAll('#projects-grid .spec-card');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        var f = btn.dataset.filter;
        cards.forEach(function (card) {
          card.classList.toggle('hidden', f !== 'all' && card.dataset.status !== f);
        });
      });
    });
  }
})();
