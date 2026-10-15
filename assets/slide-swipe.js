(function () {
  'use strict';

  window.installSlideSwipes = function (stage, { canSwipe, next, previous }) {
    let gesture = null;
    let suppressClickUntil = 0;

    stage.addEventListener('touchstart', event => {
      gesture = null;
      if (event.touches.length !== 1 || !canSwipe()) return;
      const touch = event.touches[0];
      gesture = { x: touch.clientX, y: touch.clientY, started: Date.now() };
    }, { passive: true });

    stage.addEventListener('touchmove', event => {
      if (!gesture) return;
      if (event.touches.length !== 1 || !canSwipe()) { gesture = null; return; }
      const touch = event.touches[0];
      const dx = Math.abs(touch.clientX - gesture.x);
      const dy = Math.abs(touch.clientY - gesture.y);
      // Once vertical scrolling starts, never turn it into slide navigation.
      if (dy > 12 && dy >= dx) { gesture = null; return; }
      if (dx > 12 && dx > dy * 1.5 && event.cancelable) event.preventDefault();
    }, { passive: false });

    stage.addEventListener('touchend', event => {
      const start = gesture;
      gesture = null;
      if (!start || !canSwipe() || event.changedTouches.length !== 1 || event.touches.length) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const threshold = Math.max(48, Math.min(96, stage.clientWidth * .14));
      if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy) * 1.5 || Date.now() - start.started > 900) return;
      if (event.cancelable) event.preventDefault();
      suppressClickUntil = Date.now() + 400;
      if (dx < 0) next(); else previous();
    }, { passive: false });

    stage.addEventListener('touchcancel', () => { gesture = null; }, { passive: true });
    // A swipe across a linked graphic must not also open its source.
    stage.addEventListener('click', event => {
      if (Date.now() >= suppressClickUntil) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  };
})();
