(() => {
  window.bindSlideAnnotations = ({surface, viewport, toolbar, file}) => {
    const layer=document.createElement('canvas');
    layer.className='slide-ink';layer.setAttribute('aria-label','Slide drawing area / 書き込み領域');
    surface.append(layer);
    const controls=document.createElement('div');controls.className='slide-ink-tools';
    controls.setAttribute('role','group');controls.setAttribute('aria-label','Slide annotations / スライド書き込み');
    const button=(glyph,label,action,parent=controls)=>{
      const b=document.createElement('button');b.type='button';b.innerHTML=glyph;
      b.title=label;b.setAttribute('aria-label',label);b.addEventListener('click',action);parent.append(b);return b;
    };
    let mode='view',page=1,active=null,pointer=null,ready=false,penColor='#e04b35',penWidth=3;
    const key=`dataviz-slide-ink:${file}`;
    const validStroke=s=>s&&/^#[0-9a-f]{6}$/i.test(s.color)&&Number.isFinite(s.width)&&s.width>0&&s.width<=48&&Array.isArray(s.points)&&s.points.length>0&&s.points.length<=5000&&s.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1));
    let pages={};try{const saved=JSON.parse(localStorage.getItem(key)||'{}');for(const [n,list] of Object.entries(saved||{}))if(/^[1-9]\d*$/.test(n)&&Array.isArray(list)&&list.every(validStroke))pages[n]=list;}catch{}
    const save=()=>{try{localStorage.setItem(key,JSON.stringify(pages));}catch{status.textContent='このタブ内のみ保存 / Saved in this tab only';}};
    const setMode=value=>{disarmClear();finish();mode=value;viewport.dataset.slideDrawing=String(value!=='view');layer.style.pointerEvents=value==='view'?'none':'auto';layer.style.cursor=value==='erase'?'cell':'crosshair';pen.setAttribute('aria-pressed',String(value==='pen'));highlighter.setAttribute('aria-pressed',String(value==='highlight'));eraser.setAttribute('aria-pressed',String(value==='erase'));status.textContent=value==='view'?'閲覧 / View':value==='erase'?'消しゴム / Eraser':value==='highlight'?'蛍光ペン / Highlighter':'ペン / Pen';};
    const toggle=button('✎ <span aria-hidden="true">⌄</span>','Drawing tools / 書き込みツール',()=>{
      controls.hidden=!controls.hidden;toggle.setAttribute('aria-expanded',String(!controls.hidden));
      setMode(controls.hidden?'view':'pen');
    },toolbar);
    toggle.className='slide-ink-toggle';toggle.setAttribute('aria-expanded','false');
    controls.id='slide-ink-tools';toggle.setAttribute('aria-controls',controls.id);controls.hidden=true;
    const pen=button('✎','Pen / ペン',()=>setMode(mode==='pen'?'view':'pen'));pen.setAttribute('aria-pressed','false');
    const highlighter=button('▰','Highlighter / 蛍光ペン',()=>setMode(mode==='highlight'?'view':'highlight'));highlighter.setAttribute('aria-pressed','false');
    const group=label=>{const g=document.createElement('div');g.className='slide-ink-presets';g.setAttribute('role','group');g.setAttribute('aria-label',label);controls.append(g);return g;};
    const colors=group('Pen colors / ペンの色');
    for(const [value,label] of [['#e04b35','Red / 赤'],['#176dba','Blue / 青'],['#21816a','Green / 緑'],['#f2ae30','Yellow / 黄'],['#182f38','Black / 黒'],['#ffffff','White / 白']]){
      const b=button('<span aria-hidden="true"></span>',label,()=>{
        penColor=value;for(const child of colors.children)child.setAttribute('aria-pressed',String(child===b));setMode('pen');
      },colors);b.className='slide-ink-color';b.style.setProperty('--ink-color',value);b.setAttribute('aria-pressed',String(value===penColor));
    }
    const widths=group('Pen widths / ペンの太さ');
    for(const value of [2,3,5,8]){
      const b=button(`<svg viewBox="0 0 24 16" aria-hidden="true"><path d="M3 8H21" stroke="currentColor" stroke-width="${value}" stroke-linecap="round"/></svg>`,`Width ${value} / 太さ ${value}`,()=>{
        penWidth=value;for(const child of widths.children)child.setAttribute('aria-pressed',String(child===b));setMode('pen');
      },widths);b.className='slide-ink-width';b.setAttribute('aria-pressed',String(value===penWidth));
    }
    const eraser=button('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 14 9-10 8 7-9 10H9zM9 9l8 7M12 21h9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>','Eraser / 消しゴム',()=>setMode(mode==='erase'?'view':'erase'));eraser.setAttribute('aria-pressed','false');
    const undo=button('↶','Undo / 戻す',()=>{disarmClear();finish();(pages[page]||[]).pop();save();redraw();});
    let clearArmedPage=null,clearDeadline=0,clearTimer;
    const clearGlyph='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const clearLabel='Clear page / このページを消す';
    function disarmClear(){
      clearTimeout(clearTimer);clearArmedPage=null;clearDeadline=0;
      clear.removeAttribute('data-confirm');clear.innerHTML=clearGlyph;
      clear.title=clearLabel;clear.setAttribute('aria-label',clearLabel);clearHint.hidden=true;
    }
    const clear=button(clearGlyph,clearLabel,()=>{
      finish();if(!(pages[page]||[]).length)return;
      if(clearArmedPage===page&&Date.now()<clearDeadline){
        disarmClear();delete pages[page];save();redraw();status.textContent='Cleared / 書き込みを消しました';return;
      }
      disarmClear();clearArmedPage=page;clearDeadline=Date.now()+4000;
      clear.dataset.confirm='true';clear.innerHTML='✓';
      clear.title='Click again to clear / もう一度クリックして消す';clear.setAttribute('aria-label',clear.title);
      clearHint.hidden=false;status.textContent=clear.title;clearTimer=setTimeout(disarmClear,4000);
    });
    const clearHint=document.createElement('span');clearHint.className='slide-ink-clear-hint';clearHint.textContent='Click again / もう一度';clearHint.hidden=true;controls.append(clearHint);
    button('↖','Finish drawing / 描画を終了 (Esc)',()=>{setMode('view');controls.hidden=true;toggle.setAttribute('aria-expanded','false');});
    const status=document.createElement('span');status.className='slide-ink-status';status.setAttribute('role','status');status.textContent='閲覧 / View';controls.append(status);
    toolbar.after(controls);
    const redraw=()=>{
      if(!ready)return;
      const w=surface.clientWidth,h=surface.clientHeight,dpr=Math.min(devicePixelRatio||1,3);
      layer.width=Math.round(w*dpr);layer.height=Math.round(h*dpr);
      const ctx=layer.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineCap=ctx.lineJoin='round';
      for(const s of pages[page]||[]){ctx.globalCompositeOperation=s.erase?'destination-out':'source-over';ctx.globalAlpha=s.highlight ? .25 : 1;ctx.strokeStyle=ctx.fillStyle=s.color;ctx.lineWidth=s.width*w/1000;ctx.beginPath();s.points.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));if(s.points.length===1){const [x,y]=s.points[0];ctx.arc(x*w,y*h,ctx.lineWidth/2,0,2*Math.PI);ctx.fill();}else ctx.stroke();}
      undo.disabled=clear.disabled=!(pages[page]||[]).length;
    };
    const point=e=>{const r=layer.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];};
    function finish(){if(!active)return;const captured=pointer;active=null;pointer=null;if(layer.hasPointerCapture?.(captured))layer.releasePointerCapture(captured);save();}
    layer.addEventListener('pointerdown',e=>{if(mode==='view'||!ready||!e.isPrimary||e.button!==0||active)return;disarmClear();e.preventDefault();e.stopPropagation();pointer=e.pointerId;layer.setPointerCapture(pointer);active={color:penColor,width:mode==='erase'?24:mode==='highlight'?penWidth*6:penWidth,erase:mode==='erase',highlight:mode==='highlight',points:[point(e)]};(pages[page]||= []).push(active);redraw();});
    layer.addEventListener('pointermove',e=>{if(!active||e.pointerId!==pointer)return;e.preventDefault();e.stopPropagation();const samples=e.getCoalescedEvents?.();for(const p of samples?.length?samples:[e])if(active.points.length<5000)active.points.push(point(p));redraw();});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])layer.addEventListener(type,finish);
    layer.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
    document.addEventListener('keydown',e=>{
      if(e.target.closest?.('input,textarea,select,[contenteditable="true"]')||e.isComposing)return;
      if(e.key==='Escape'){disarmClear();if(mode!=='view'){setMode('view');e.preventDefault();e.stopImmediatePropagation();}return;}
      if(e.key.toLowerCase()==='p'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();const open=mode==='view';controls.hidden=!open;toggle.setAttribute('aria-expanded',String(open));setMode(open?'pen':'view');}
      if(e.key.toLowerCase()==='z'&&mode!=='view'&&!e.altKey&&!e.shiftKey){e.preventDefault();e.stopImmediatePropagation();undo.click();}
    },true);
    window.addEventListener('blur',finish);window.addEventListener('pagehide',finish);
    new ResizeObserver(redraw).observe(surface);
    return {show(n){if(n!==page)disarmClear();finish();page=n;ready=true;redraw();},loading(){finish();ready=false;layer.style.visibility='hidden';},rendered(n){layer.style.visibility='';this.show(n);}};
  };
})();
