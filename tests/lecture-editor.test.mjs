import test from 'node:test';
import assert from 'node:assert/strict';
import {moveSlide} from '../assets/lecture-editor.mjs';

test('thumbnail reorder inserts before or after without changing slide IDs or mutating the draft',()=>{
 const slides=[{id:'a'},{id:'b'},{id:'c'},{id:'d'}],ids=rows=>rows.map(s=>s.id);
 assert.deepEqual(ids(moveSlide(slides,'a','c','after')),['b','c','a','d']);
 assert.deepEqual(ids(moveSlide(slides,'d','b','before')),['a','d','b','c']);
 assert.deepEqual(ids(slides),['a','b','c','d']);
 assert.strictEqual(moveSlide(slides,'a','b','before'),slides);
 assert.strictEqual(moveSlide(slides,'a','a','after'),slides);
 assert.strictEqual(moveSlide(slides,'a','missing','after'),slides);
});
