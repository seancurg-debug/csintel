/* CSINTEL — main.js · bootstrap & shared helpers */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  // single source of truth for motion preference
  window.CSI = {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    touch: window.matchMedia('(hover: none)').matches
  };

  // title-block date stamps
  var d = new Date();
  var stamp = d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
  document.querySelectorAll('[data-tb-date]').forEach(function (el) {
    el.textContent = stamp;
  });

  // cursor-tracking glow — a torch over the drawing
  var glow = document.querySelector('.cursor-glow');
  if (glow && !CSI.reducedMotion && !CSI.touch) {
    var mx = innerWidth / 2, my = innerHeight / 2;
    var tx = mx, ty = my, raf = null;

    function frame() {
      mx += (tx - mx) * 0.12;
      my += (ty - my) * 0.12;
      glow.style.setProperty('--mx', mx + 'px');
      glow.style.setProperty('--my', my + 'px');
      if (Math.abs(tx - mx) > 0.5 || Math.abs(ty - my) > 0.5) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = null;
      }
    }

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      glow.classList.add('on');
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
  }
})();
