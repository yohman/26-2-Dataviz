import test from 'node:test';
import assert from 'node:assert/strict';
import { createArrivalTracker, animateArrivals } from '../voices/arrival-motion.mjs';

test('the first voice after an empty baseline animates; initial history does not', () => {
  const empty = createArrivalTracker();
  assert.deepEqual(empty.update([]), []);
  assert.deepEqual(empty.update([{id:'first'}]), ['first']);
  const history = createArrivalTracker();
  assert.deepEqual(history.update([{id:'old'}]), []);
  assert.deepEqual(history.update([{id:'old'}, {id:'new'}]), ['new']);
});
test('reactions, repeat snapshots, restore and reconnect do not replay arrivals', () => {
  const tracker = createArrivalTracker();
  tracker.update([{id:'a'}, {id:'hidden',hidden:true}]);
  assert.deepEqual(tracker.update([{id:'a',resonance:5}, {id:'hidden',hidden:false}]), []);
  tracker.update([]);
  assert.deepEqual(tracker.update([{id:'a'}, {id:'hidden'}]), []);
  assert.deepEqual(tracker.update([{id:'a'}, {id:'b'}, {id:'c'}]), ['b','c']);
});
test('arrival layout motion respects reduced-motion preferences', () => {
  const before=globalThis.matchMedia;
  globalThis.matchMedia=()=>({matches:true});
  try { animateArrivals({querySelectorAll(){throw new Error('No motion should run');}},new Map(),['new']); }
  finally {globalThis.matchMedia=before;}
});
