import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {clampSlide,scatterMarks,lineSegments,safeDeckReturn} from '../assets/html-lecture-model.mjs';
const deck=JSON.parse(fs.readFileSync('content/slides/week07.json')),data=JSON.parse(fs.readFileSync('data/week07-examples.json'));
const context={document:{addEventListener(){}},window:{},URL,URLSearchParams};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/site.js','utf8'),context);context.source=fs.readFileSync('content/weeks/07-shared-dataset.md','utf8');const week=vm.runInContext("parseWeek(source,'07-shared-dataset.md')",context);
test('Week 7 uses a bilingual 20-minute HTML lecture followed by the same three activities and simple homework',()=>{
 assert.equal(deck.slides.length,16);assert.equal(deck.lectureSlides,12);assert.equal(deck.slides.reduce((n,s)=>n+s.minutes,0),20);
 deck.slides.forEach((s,i)=>{assert.equal(s.page,i+1);assert.ok(s.notes.ja&&s.notes.en&&s.title.ja&&s.title.en);assert.doesNotMatch(s.notes.en,/ask students|instructor should|original slide text/i);});
 assert.equal(week.materials[0].href,'lecture.html?week=7');assert.equal(week.activities.length,3);for(const a of week.activities){assert.equal(a.steps.length,3);assert.equal(a.steps_ja.length,3);}
 assert.match(week.schedule,/10:50–11:10/);assert.match(week.schedule,/11:10–11:25/);assert.match(week.schedule,/11:25–11:50/);assert.match(week.schedule,/11:50–12:10/);assert.match(week.schedule,/12:10–12:20/);
 assert.match(week.requirements,/one or two images/);assert.match(week.requirements_ja,/1〜2枚/);assert.match(week.homework,/2–3/);assert.match(deck.slides.at(-1).notes.en,/November 19, 2026, 23:59 JST/);
 assert.ok(week.activities[1].materials.some(m=>m.href==='data/gapminder.csv'));assert.equal(week.activities[0].materials.some(m=>m.href.endsWith('.csv')),false);
});
test('the chart snapshot records exact source hashes and never converts missing measures to zero',()=>{
 for(const entry of Object.values(data.sources)){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(entry.file)).digest('hex'),entry.sha256);}
 assert.equal(data.scatter.length,195);assert.equal(scatterMarks(data.scatter).length,184);assert.equal(data.missingCountryLatest,14);
 assert.deepEqual(scatterMarks([{income:100,life:null,population:20},{income:100,life:60,population:20}]),[{income:100,life:60,population:20}]);
 assert.deepEqual(lineSegments([[2000,60],[2001,null],[2002,65]]),[[[2000,60]],[[2002,65]]]);
 assert.equal(data.disasterRows[0]['Total Deaths'],'');assert.equal(data.disasterRows[3]['Total Deaths'],'15');assert.equal(data.row['Country'],'Japan');assert.equal(data.row['Life Expectancy'],'84.2');
});
test('HTML navigation clamps invalid pages, keeps safe preview returns, and rejects external returns',()=>{
 assert.equal(clampSlide(-1,16),1);assert.equal(clampSlide(999,16),16);assert.equal(clampSlide('bad',16),1);assert.equal(clampSlide(2.8,16),2);
 assert.equal(safeDeckReturn('agenda.html?p#week-7'),'agenda.html?p#week-7');assert.equal(safeDeckReturn('https://example.com'),'agenda.html#week-7');assert.equal(safeDeckReturn('javascript:alert(1)'),'agenda.html#week-7');
});
