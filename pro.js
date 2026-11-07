/* SHETOS STORE - PRO LAYER (standalone; does not touch script.js) */
(function () {
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var de = document.documentElement;
  de.classList.add('pro-js');

  /* bilingual text for the new sections (follows the site's language button) */
  function lang() { return document.body.classList.contains('lang-ar') ? 'ar' : 'en'; }
  function i18n() {
    var l = lang();
    document.querySelectorAll('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-' + l) || el.getAttribute('data-en'); });
  }
  i18n();
  new MutationObserver(i18n).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* hero headline: word by word */
  var h1 = document.querySelector('.pro-h1');
  function words() {
    if (!h1) return;
    var l = lang();
    var parts = (h1.getAttribute('data-' + l) || h1.getAttribute('data-en')).split(' ');
    var gFrom = parts.length - 2;
    h1.innerHTML = '';
    parts.forEach(function (p, i) {
      var s = document.createElement('span');
      s.className = 'w' + (i >= gFrom ? ' g' : '');
      s.style.setProperty('--k', i);
      s.textContent = p + ' ';
      h1.appendChild(s);
    });
  }
  words();
  new MutationObserver(words).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* hero buttons open the existing hub boxes */
  document.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = document.getElementById(b.getAttribute('data-go'));
      if (t) t.click();
    });
  });

  /* scroll reveal */
  var rev = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !RM) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    rev.forEach(function (el, i) { el.style.setProperty('--d', i % 4); io.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('in'); }); }

  /* counters */
  function count(el) {
    var to = parseFloat(el.getAttribute('data-count')), dur = 1600, t0 = null;
    if (RM) { el.textContent = to; return; }
    (function f(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(f);
    })(performance.now());
  }
  var cio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { count(e.target); cio.unobserve(e.target); } });
  }, { threshold: .6 }) : null;
  document.querySelectorAll('[data-count]').forEach(function (el) { cio ? cio.observe(el) : (el.textContent = el.getAttribute('data-count')); });

  /* marquee: duplicate the chips so the loop is seamless */
  var tr = document.querySelector('.pro-track');
  if (tr) tr.innerHTML += tr.innerHTML;

  /* magnetic buttons (desktop) */
  if (!RM && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.pro-btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .15).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .25).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* FAQ: one open at a time */
  document.querySelectorAll('.pro-faq details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) document.querySelectorAll('.pro-faq details').forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* compact top bar + back-to-top */
  var bar = document.querySelector('.top-bar'), up = document.getElementById('pro-top');
  function onS() {
    var y = window.scrollY || de.scrollTop;
    if (bar) bar.classList.toggle('is-scrolled', y > 40);
    if (up) up.classList.toggle('show', y > 600);
  }
  addEventListener('scroll', onS, { passive: true }); onS();
  if (up) up.addEventListener('click', function () { scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); });
})();
