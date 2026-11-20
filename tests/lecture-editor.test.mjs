import test from 'node:test';
import assert from 'node:assert/strict';
import {imageFormat,moveSlide} from '../assets/lecture-editor.mjs';
import {renderWeek8,safeSlideImage} from '../assets/week08-visuals.mjs';

test('thumbnail reorder inserts before or after without changing slide IDs or mutating the draft',()=>{
 const slides=[{id:'a'},{id:'b'},{id:'c'},{id:'d'}],ids=rows=>rows.map(s=>s.id);
 assert.deepEqual(ids(moveSlide(slides,'a','c','after')),['b','c','a','d']);
 assert.deepEqual(ids(moveSlide(slides,'d','b','before')),['a','d','b','c']);
 assert.deepEqual(ids(slides),['a','b','c','d']);
 assert.strictEqual(moveSlide(slides,'a','b','before'),slides);
 assert.strictEqual(moveSlide(slides,'a','a','after'),slides);
 assert.strictEqual(moveSlide(slides,'a','missing','after'),slides);
});

test('image import sniffs local and clipboard files without relying on MIME metadata',()=>{
 assert.deepEqual(imageFormat(Buffer.from('89504e470d0a1a0a0000000d49484452','hex')),['png','image/png']);
 assert.deepEqual(imageFormat(Buffer.from('ffd8ff','hex')),['jpg','image/jpeg']);
 assert.deepEqual(imageFormat(Buffer.from('GIF89a')),['gif','image/gif']);
 assert.deepEqual(imageFormat(Buffer.from('RIFF0000WEBP')),['webp','image/webp']);
 assert.equal(imageFormat(Buffer.from('<svg onload="alert(1)">')),null);
});

test('authored content renders in the chosen language using the text and image layout',()=>{
 const s={kind:'editable',title:{ja:'図',en:'Figure'},content:{layout:'split',image:'assets/images/week06/city-rural.jpg',body:{ja:'本文',en:'A < B'},alt:{en:'Original plate',ja:'原図'}}};
 const en=renderWeek8(s,{ja:false}),jp=renderWeek8(s,{ja:true});
 assert.match(en,/is-split/);assert.match(en,/<h1>Figure<\/h1>.*<p>A &lt; B<\/p>/);assert.match(en,/alt="Original plate"/);
 assert.match(jp,/<h1>図<\/h1>.*<p>本文<\/p>/);assert.match(jp,/alt="原図"/);
 assert.equal(safeSlideImage('javascript:alert(1)'),'');
 assert.equal(safeSlideImage('assets/images/../../secrets.png'),'');
 assert.equal(safeSlideImage('https://user:key@example.org/a.jpg'),'');
 assert.equal(safeSlideImage('https://example.org/a.jpg'),'https://example.org/a.jpg');
});
