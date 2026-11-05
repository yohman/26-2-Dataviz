(function(global){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function constrain(state,width,height,vw,vh){
    const w=width*state.scale,h=height*state.scale;
    return {...state,x:w<=vw?(vw-w)/2:clamp(state.x,vw-w-8,8),y:h<=vh?(vh-h)/2:clamp(state.y,vh-h-8,8)};
  }
  function zoomAt(state,scale,anchor){
    const next=clamp(scale,1,4),ratio=next/state.scale;
    return {scale:next,x:anchor.x-(anchor.x-state.x)*ratio,y:anchor.y-(anchor.y-state.y)*ratio};
  }
  function wheelFactor(delta,mode=0){return Math.exp(-clamp(delta*(mode===1?16:mode===2?240:1),-60,60)*.002);}
  function createSlideViewport({viewport,surface,onChange=()=>{},onSettle=()=>{}}){
    let width=1,height=1,target={x:0,y:0,scale:1},shown={...target},frame=0,settleTimer,drag=null,pinch=null,suppressUntil=0;
    const reduced=()=>global.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const local=e=>{const r=viewport.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
    const bounded=s=>constrain(s,width,height,viewport.clientWidth,viewport.clientHeight);
    function draw(){
      frame=0;
      const d=Math.abs(target.x-shown.x)+Math.abs(target.y-shown.y)+Math.abs(target.scale-shown.scale)*100;
      const rate=reduced()||d<.15?1:.28;
      for(const key of ['x','y','scale'])shown[key]+=(target[key]-shown[key])*rate;
      surface.style.transform=`translate3d(${shown.x}px,${shown.y}px,0) scale(${shown.scale})`;
      if(rate<1)frame=requestAnimationFrame(draw);
    }
    function apply(next,{immediate=false,settle=true}={}){
      target=bounded(next);if(immediate)shown={...target};
      viewport.classList.toggle('is-zoomed',target.scale>1.01);
      viewport.style.touchAction=target.scale>1.01?'none':'pan-y';
      onChange(target.scale);
      if(!frame)frame=requestAnimationFrame(draw);
      if(settle){clearTimeout(settleTimer);settleTimer=setTimeout(onSettle,240);}
    }
    function zoomTo(scale,anchor={x:viewport.clientWidth/2,y:viewport.clientHeight/2}){
      apply(zoomAt(target,scale,anchor));
    }
    viewport.addEventListener('wheel',e=>{
      if((!e.ctrlKey&&!e.metaKey)||viewport.dataset.slideDrawing==='true')return;
      e.preventDefault();zoomTo(target.scale*wheelFactor(e.deltaY,e.deltaMode),local(e));
    },{passive:false});
    viewport.addEventListener('pointerdown',e=>{
      if(e.pointerType==='touch'||viewport.dataset.slideDrawing==='true'||target.scale<=1.01||e.button!==0)return;
      drag={id:e.pointerId,start:local(e),origin:{...target},moved:false};
    });
    viewport.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      const p=local(e),dx=p.x-drag.start.x,dy=p.y-drag.start.y;
      if(!drag.moved&&Math.hypot(dx,dy)<4)return;
      drag.moved=true;viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-panning');e.preventDefault();
      apply({...drag.origin,x:drag.origin.x+dx,y:drag.origin.y+dy},{immediate:true,settle:false});
    });
    function finish(){if(drag?.moved)suppressUntil=Date.now()+350;drag=null;viewport.classList.remove('is-panning');}
    for(const type of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,finish);
    viewport.addEventListener('touchstart',e=>{
      if(viewport.dataset.slideDrawing==='true')return;
      if(e.touches.length===2){
        const [a,b]=Array.from(e.touches).map(local),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
        pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),mid,origin:{...target}};
        drag=null;viewport.dataset.pinching='true';e.preventDefault();
      }else if(e.touches.length===1&&target.scale>1.01){drag={start:local(e.touches[0]),origin:{...target},moved:true};}
    },{passive:false});
    viewport.addEventListener('touchmove',e=>{
      if(viewport.dataset.slideDrawing==='true')return;
      if(pinch&&e.touches.length===2){
        e.preventDefault();const [a,b]=Array.from(e.touches).map(local),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
        const next=zoomAt(pinch.origin,pinch.origin.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance),pinch.mid);
        next.x+=mid.x-pinch.mid.x;next.y+=mid.y-pinch.mid.y;apply(next,{immediate:true});
      }else if(drag&&e.touches.length===1&&target.scale>1.01){
        e.preventDefault();const p=local(e.touches[0]);apply({...drag.origin,x:drag.origin.x+p.x-drag.start.x,y:drag.origin.y+p.y-drag.start.y},{immediate:true,settle:false});
      }
    },{passive:false});
    for(const type of ['touchend','touchcancel'])viewport.addEventListener(type,()=>{
      if(pinch||drag?.moved)suppressUntil=Date.now()+350;
      pinch=null;finish();setTimeout(()=>{viewport.dataset.pinching='false';},0);
    });
    viewport.addEventListener('click',e=>{if(Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
    viewport.addEventListener('dblclick',e=>{
      if(viewport.dataset.slideDrawing==='true')return;
      e.preventDefault();zoomTo(target.scale>1.01?1:2,local(e));
    });
    return {
      layout(w,h,{reset=false}={}){
        clearTimeout(settleTimer);
        const center={x:(viewport.clientWidth/2-target.x)/(width*target.scale),y:(viewport.clientHeight/2-target.y)/(height*target.scale)};
        width=w;height=h;
        const next=reset?{x:0,y:0,scale:1}:{scale:target.scale,x:viewport.clientWidth/2-center.x*w*target.scale,y:viewport.clientHeight/2-center.y*h*target.scale};
        apply(next,{immediate:true,settle:false});
      },
      zoomTo,
      fit(){zoomTo(1);},
      getState(){return {...target};}
    };
  }
  if(typeof module!=='undefined')module.exports={zoomAt,constrain,wheelFactor};
  global.createSlideViewport=createSlideViewport;
})(typeof window==='undefined'?globalThis:window);
