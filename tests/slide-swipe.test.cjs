const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/slide-swipe.js'), 'utf8');
function setup() {
  const handlers = {};
  let now = 1000, allowed = true, page = 5;
  const window = {};
  const stage = { clientWidth: 390, addEventListener(name, fn) { handlers[name] = fn; } };
  vm.runInNewContext(source, { window, Date: { now: () => now } });
  window.installSlideSwipes(stage, { canSwipe: () => allowed, next: () => page++, previous: () => page-- });
  function fire(name, x, y, count = 1) {
    const touches = Array.from({ length: count }, () => ({ clientX: x, clientY: y }));
    const event = { touches: name === 'touchend' ? [] : touches, changedTouches: touches, cancelable: true, prevented: false,
      preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; } };
    handlers[name](event);
    return event;
  }
  return { fire, handlers, page: () => page, allow: v => { allowed = v; }, advance: ms => { now += ms; } };
}

test('left swipes advance and right swipes go back exactly once', () => {
  const s = setup();
  s.fire('touchstart', 300, 100); s.fire('touchmove', 150, 105);
  assert(s.fire('touchend', 100, 110).prevented); assert.equal(s.page(), 6);
  s.fire('touchend', 100, 110); assert.equal(s.page(), 6);
  s.fire('touchstart', 50, 100); s.fire('touchend', 220, 105); assert.equal(s.page(), 5);
});

test('vertical scroll stays native, even if the finger later moves sideways', () => {
  const s = setup(); s.fire('touchstart', 200, 100);
  assert(!s.fire('touchmove', 202, 140).prevented);
  s.fire('touchend', 20, 180); assert.equal(s.page(), 5);
});

test('taps, short drags, diagonal drags and long gestures do not navigate', () => {
  const s = setup();
  for (const [x, y] of [[200, 100], [170, 100], [100, 190]]) {
    s.fire('touchstart', 200, 100); s.fire('touchend', x, y); assert.equal(s.page(), 5);
  }
  s.fire('touchstart', 300, 100); s.advance(1000); s.fire('touchend', 50, 100); assert.equal(s.page(), 5);
});

test('zoomed slides remain available for panning rather than swipe navigation', () => {
  const s = setup(); s.allow(false); s.fire('touchstart', 300, 100);
  assert(!s.fire('touchmove', 100, 100).prevented);
  s.fire('touchend', 50, 100); assert.equal(s.page(), 5);
  s.allow(true); s.fire('touchstart', 300, 100); s.allow(false);
  s.fire('touchend', 50, 100); assert.equal(s.page(), 5);
});

test('pinch gestures and cancelled touches never become swipes', () => {
  const s = setup(); s.fire('touchstart', 300, 100);
  assert(!s.fire('touchmove', 200, 100, 2).prevented);
  s.fire('touchend', 50, 100); assert.equal(s.page(), 5);
  s.fire('touchstart', 300, 100); s.fire('touchcancel', 200, 100);
  s.fire('touchend', 50, 100); assert.equal(s.page(), 5);
});

test('swipes suppress accidental source-link clicks, while taps still open links', () => {
  const s = setup(); s.fire('touchstart', 300, 100); s.fire('touchend', 50, 100);
  assert(s.fire('click', 50, 100).prevented);
  s.advance(401); s.fire('touchstart', 200, 100); s.fire('touchend', 200, 100);
  assert(!s.fire('click', 200, 100).prevented);
});
