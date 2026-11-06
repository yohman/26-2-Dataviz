const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync('assets/dubois-guide.js','utf8'),{window});
test('additional activity tables preserve printed values and occupation totals',()=>{
 assert.deepEqual(Array.from(window.DUBOIS_DATA.land,row=>Array.from(row)),[[1875,1263902],[1880,1522173],[1885,2362889],[1890,3485176],[1895,4158960],[1899,4220120]]);
 for(const column of [2,3])assert.equal(window.DUBOIS_DATA.occupations.reduce((sum,row)=>sum+row[column],0),100);
 assert.equal(window.DUBOIS_DATA.freedom[1][0],1800);assert.equal(window.DUBOIS_DATA.freedom.at(-1)[1],100);
});
test('five source choices render bilingually and Activity 1 has no Colab link',()=>{
 for(const language of [true,false]){
  const html=window.renderDuBoisGuide(language);for(const name of ['city-rural','illiteracy','land-value','occupations','freedom'])assert.ok(html.includes(name+'.jpg'));
  assert.match(html,/1,263,902/);assert.match(html,/13\.5/);
 }
 const week=fs.readFileSync('content/weeks/06-dubois-public-argument.md','utf8');const materials=week.split('## Activity 1 Materials')[1].split('## In Class Activities')[0];assert.doesNotMatch(materials,/colab/i);
});
