/* CSINTEL — animations.js
   GSAP + ScrollTrigger + anime.js choreography.
   Everything is additive: with JS disabled or reduced motion,
   the page renders fully static and complete. */
(function () {
  'use strict';

  var reduced = window.CSI.reducedMotion;
  var hasGsap = typeof gsap !== 'undefined';
  var hasAnime = typeof anime !== 'undefined';

  if (hasGsap && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ──────────────────────────────────────
     1 · HERO CANVAS — perspective grid floor
     a technical drawing plane, slowly advancing
     ────────────────────────────────────── */
  var canvas = document.getElementById('hero-canvas');
  if (canvas && !reduced) {
    var ctx = canvas.getContext('2d');
    var W, H, t = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      var r = canvas.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size);

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var horizon = H * 0.46;
      var vpx = W * 0.5;

      // converging verticals
      var n = 26;
      for (var i = -n; i <= n; i++) {
        var xb = vpx + i * (W / 16);
        var a = 0.05 * (1 - Math.abs(i) / (n + 4));
        ctx.strokeStyle = 'rgba(240,237,232,' + a.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(xb, H);
        ctx.lineTo(vpx, horizon);
        ctx.stroke();
      }

      // advancing horizontals
      var rows = 22;
      var offset = (t * 0.00009) % (1 / rows);
      for (var j = 0; j <= rows; j++) {
        var p = j / rows + offset;
        if (p > 1) continue;
        var y = horizon + (H - horizon) * Math.pow(p, 2.4);
        var alpha = 0.012 + p * 0.075;
        var accent = j % 6 === 0;
        ctx.strokeStyle = accent
          ? 'rgba(232,82,26,' + (alpha * 0.9).toFixed(3) + ')'
          : 'rgba(240,237,232,' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // horizon line
      ctx.strokeStyle = 'rgba(232,82,26,0.16)';
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(W, horizon);
      ctx.stroke();

      t += 16;
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ──────────────────────────────────────
     2 · HERO ENTRANCE — system boot sequence
     ────────────────────────────────────── */
  var heroTitle = document.querySelector('[data-typewriter]');
  if (heroTitle && !reduced && hasAnime) {
    // wrap every character so we can reveal them like keystrokes
    var nodes = Array.prototype.slice.call(heroTitle.childNodes);
    heroTitle.textContent = '';
    var spans = [];
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split('').forEach(function (ch) {
          var s = document.createElement('span');
          s.textContent = ch;
          s.style.opacity = '0';
          heroTitle.appendChild(s);
          spans.push(s);
        });
      } else if (node.nodeType === 1 && node.tagName === 'BR') {
        heroTitle.appendChild(document.createElement('br'));
      } else if (node.nodeType === 1) {
        var wrap = document.createElement(node.tagName.toLowerCase());
        wrap.className = node.className;
        node.textContent.split('').forEach(function (ch) {
          var s = document.createElement('span');
          s.textContent = ch;
          s.style.opacity = '0';
          wrap.appendChild(s);
          spans.push(s);
        });
        heroTitle.appendChild(wrap);
      }
    });
    var caret = document.createElement('span');
    caret.className = 'tw-caret';
    caret.setAttribute('aria-hidden', 'true');
    heroTitle.appendChild(caret);

    var metaItems = document.querySelectorAll('.hero-meta .hm');
    var rule = document.querySelector('.hero-rule');
    var sub = document.querySelector('.hero-sub');
    var actions = document.querySelector('.hero-actions');
    var readout = document.querySelector('.hero-readout');

    if (hasGsap) {
      gsap.set(metaItems, { opacity: 0, y: 10 });
      if (rule) gsap.set(rule, { scaleX: 0 });
      if (sub) gsap.set(sub, { opacity: 0, y: 14 });
      if (actions) gsap.set(actions, { opacity: 0, y: 14 });
      if (readout) gsap.set(readout, { opacity: 0 });
    }

    var tl = anime.timeline({ easing: 'linear' });
    tl.add({
      targets: spans,
      opacity: [0, 1],
      duration: 1,
      delay: anime.stagger(34, { start: 350 })
    });

    var typeDone = 350 + spans.length * 34;

    if (hasGsap) {
      var g = gsap.timeline({ delay: 0.15 });
      g.to(metaItems, { opacity: 1, y: 0, duration: 0.5, stagger: 0.09, ease: 'power2.out' });
      g.to(rule, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, typeDone / 1000 - 0.3);
      g.to(sub, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.45');
      g.to(actions, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.35');
      if (readout) g.to(readout, { opacity: 1, duration: 0.8 }, '-=0.3');
    }

    // caret keeps blinking for a few seconds, then fades
    setTimeout(function () {
      caret.style.transition = 'opacity 0.8s';
      caret.style.opacity = '0';
    }, typeDone + 4200);
  }

  /* ──────────────────────────────────────
     3 · SCROLL-DRIVEN SECTION REVEALS
     ────────────────────────────────────── */
  if (hasGsap && typeof ScrollTrigger !== 'undefined' && !reduced) {

    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      gsap.from(el, {
        opacity: 0,
        y: 26,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%' }
      });
    });

    document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
      gsap.from(group.children, {
        opacity: 0,
        y: 30,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: group, start: 'top 84%' }
      });
    });

    // section rules draw themselves across
    document.querySelectorAll('.hr-rule').forEach(function (el) {
      gsap.from(el, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.1,
        ease: 'power3.inOut',
        scrollTrigger: { trigger: el, start: 'top 92%' }
      });
    });
  }

  /* ──────────────────────────────────────
     4 · BUILD LOG — entries typed live, section pinned
     ────────────────────────────────────── */
  var logEntries = document.querySelectorAll('.log-entry');
  if (logEntries.length && !reduced && hasGsap && typeof ScrollTrigger !== 'undefined') {
    logEntries.forEach(function (entry, i) {
      var textEl = entry.querySelector('.log-text');
      var full = textEl.innerHTML;
      var plain = textEl.textContent;
      var others = entry.querySelectorAll('.log-id, .log-date, .log-status');

      gsap.set(entry, { opacity: 0 });

      ScrollTrigger.create({
        trigger: entry,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          gsap.to(entry, { opacity: 1, duration: 0.3, delay: i * 0.12 });
          gsap.from(others, { opacity: 0, duration: 0.4, delay: i * 0.12 });
          textEl.textContent = '';
          var k = 0;
          setTimeout(function type() {
            k += 2;
            if (k >= plain.length) {
              textEl.innerHTML = full; // restore markup (bold refs)
            } else {
              textEl.textContent = plain.slice(0, k);
              setTimeout(type, 11);
            }
          }, i * 120 + 250);
        }
      });
    });
  }

  /* ──────────────────────────────────────
     5 · STATS COUNTERS — count up w/ caret blink
     ────────────────────────────────────── */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var target = parseInt(el.dataset.count, 10);
    var suffix = el.dataset.suffix || '';
    if (reduced || !hasGsap || typeof ScrollTrigger === 'undefined') {
      el.textContent = target + suffix;
      return;
    }
    var obj = { v: 0 };
    el.textContent = '0' + suffix;
    gsap.to(obj, {
      v: target,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: function () {
        el.textContent = Math.round(obj.v) + suffix;
      },
      onComplete: function () {
        var c = el.parentElement.querySelector('.stat-cursor');
        if (c) setTimeout(function () { c.style.opacity = '0'; }, 3500);
      }
    });
  });

  /* ──────────────────────────────────────
     6 · SUBTLE PARALLAX on hero content
     ────────────────────────────────────── */
  if (hasGsap && typeof ScrollTrigger !== 'undefined' && !reduced) {
    var heroInner = document.querySelector('.hero .container');
    if (heroInner) {
      gsap.to(heroInner, {
        y: 90,
        opacity: 0.25,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }
  }
})();
