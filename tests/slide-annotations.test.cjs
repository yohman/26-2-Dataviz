const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function fixture(saved={}){
  const storage=new Map(Object.entries(saved)),nodes=[],draws=[];
  class Node{
    constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.attrs={};this.dataset={};this.style={setProperty(){}};this.clientWidth=1000;this.clientHeight=562;this.hidden=false;nodes.push(this);}
    append(n){this.children.push(n);}
    after(n){this.afterNode=n;}
    setAttribute(k,v){this.attrs[k]=v;}
    removeAttribute(k){delete this.attrs[k];}
    addEventListener(k,fn){(this.handlers[k]||=[]).push(fn);}
    fire(k,event={}){for(const fn of this.handlers[k]||[])fn({isPrimary:true,button:0,pointerId:1,clientX:100,clientY:100,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){},target:{closest(){return false;}},...event});}
    click(){this.fire('click');}
    getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}
    setPointerCapture(p){this.captured=p;}
    hasPointerCapture(p){return this.captured===p;}
    releasePointerCapture(){this.captured=null;}
    getContext(){return this.ctx ||= {setTransform(){},beginPath(){},moveTo(){},lineTo(){},arc(){},fill(){draws.push({alpha:this.globalAlpha,op:this.globalCompositeOperation});},stroke(){draws.push({alpha:this.globalAlpha,op:this.globalCompositeOperation});}};}
  }
  const document=new Node('document');document.createElement=tag=>new Node(tag);
  const window=new Node('window');
  const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
  const context={window,document,localStorage,devicePixelRatio:1,ResizeObserver:class{observe(){}},setTimeout:()=>1,clearTimeout(){}};
  vm.runInNewContext(fs.readFileSync('assets/slide-annotations.js','utf8'),context);
  const surface=new Node('surface'),viewport=new Node('viewport'),toolbar=new Node('toolbar');
  const ink=window.bindSlideAnnotations({surface,viewport,toolbar,file:'lectures/w06_lores.pdf'});
  const button=name=>nodes.find(n=>n.attrs['aria-label']===name);
  const canvas=surface.children[0];
  return {ink,surface,viewport,toolbar,button,canvas,storage,draws,document};
}
const key='dataviz-slide-ink:lectures/w06_lores.pdf';
test('drawing saves by file and page, restores after reload and survives resizing',()=>{
  const f=fixture();f.ink.rendered(1);f.button('Drawing tools / 書き込みツール').click();
  assert.equal(f.viewport.dataset.slideDrawing,'true');
  f.canvas.fire('pointerdown');f.canvas.fire('pointermove',{clientX:400,clientY:250,getCoalescedEvents:()=>[]});f.canvas.fire('pointerup');
  const saved=JSON.parse(f.storage.get(key));assert.equal(saved[1].length,1);assert.equal(saved[1][0].points.length,2);
  assert.equal(saved[1][0].points[1][0],.4);
  f.ink.loading();f.ink.rendered(2);assert.equal(f.button('Undo / 戻す').disabled,true);
  f.ink.rendered(1);assert.equal(f.button('Undo / 戻す').disabled,false);
  f.surface.clientWidth=500;f.ink.rendered(1);assert.equal(f.canvas.width,500);
  const reloaded=fixture({[key]:f.storage.get(key)});reloaded.ink.rendered(1);assert.equal(reloaded.button('Undo / 戻す').disabled,false);
});
test('highlighter and eraser use transparency and erase only the ink layer',()=>{
  const f=fixture();f.ink.rendered(1);f.button('Highlighter / 蛍光ペン').click();
  f.canvas.fire('pointerdown');f.canvas.fire('pointerup');assert.ok(f.draws.some(d=>d.alpha===.25));
  f.button('Eraser / 消しゴム').click();f.canvas.fire('pointerdown');f.canvas.fire('pointerup');
  assert.ok(f.draws.some(d=>d.op==='destination-out'));
  f.button('Undo / 戻す').click();assert.equal(JSON.parse(f.storage.get(key))[1].length,1);
});
test('clear is inline-confirmed and affects only this page, with no browser dialog',()=>{
  const f=fixture();f.ink.rendered(1);f.button('Pen / ペン').click();f.canvas.fire('pointerdown');f.canvas.fire('pointerup');
  const clear=f.button('Clear page / このページを消す');clear.click();assert.equal(JSON.parse(f.storage.get(key))[1].length,1);
  assert.equal(clear.dataset.confirm,'true');clear.click();assert.equal(JSON.parse(f.storage.get(key))[1],undefined);
  assert.doesNotMatch(fs.readFileSync('assets/slide-annotations.js','utf8'),/window\.confirm|\balert\(/);
});
test('Escape finishes drawing without exiting fullscreen, and view mode permits links',()=>{
  const f=fixture();f.ink.rendered(1);f.button('Pen / ペン').click();let stopped=false;
  f.document.fire('keydown',{key:'Escape',stopImmediatePropagation(){stopped=true;}});
  assert.equal(stopped,true);assert.equal(f.viewport.dataset.slideDrawing,'false');assert.equal(f.canvas.style.pointerEvents,'none');
});
test('bad saved strokes cannot break rendering, and viewer guards swipes while drawing',()=>{
  const f=fixture({[key]:JSON.stringify({1:[{color:'bad',points:null}]})});f.ink.rendered(1);assert.equal(f.button('Undo / 戻す').disabled,true);
  const html=fs.readFileSync('viewer.html','utf8');
  assert.match(html,/ink\.loading\(\)/);assert.match(html,/ink\.rendered\(activePage\)/);
  assert.match(html,/stage\.dataset\.slideDrawing !== 'true'/);
  assert.match(html,/fullscreen\.before\(document\.querySelector\('\.slide-ink-toggle'\)\)/);
});
