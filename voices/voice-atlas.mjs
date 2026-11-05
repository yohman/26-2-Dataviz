import { WORLD,hash,themeCenters,voiceTarget,sharedThreads } from './atlas-model.mjs';
import { reducedMotion } from './arrival-motion.mjs';

export function createVoiceAtlas(root,{themes,openVoice,language,onTourChange=()=>{}}) {
  const d3=window.d3;
  const viewport=document.createElement('div');viewport.className='atlas-viewport';
  viewport.tabIndex=0;
  viewport.setAttribute('aria-label','Drag to wander; select a voice / ドラッグで散策、声を選ぶと詳細');
  const world=document.createElement('div');world.className='atlas-world';world.style.width=WORLD.width+'px';world.style.height=WORLD.height+'px';
  const svg=d3.select(world).append('svg').attr('class','atlas-geography').attr('viewBox',`0 0 ${WORLD.width} ${WORLD.height}`).attr('aria-hidden','true');
  const terrain=svg.append('g').attr('class','atlas-terrain'),paths=svg.append('g').attr('class','atlas-threads'),labels=svg.append('g').attr('class','atlas-neighborhoods');
  const field=document.createElement('div');field.className='atlas-voices';world.append(field);viewport.append(world);
  const empty=document.createElement('div');empty.className='atlas-empty';
  const eyebrow=document.createElement('p'),headline=document.createElement('h2'),hint=document.createElement('p');
  eyebrow.className='atlas-empty-eyebrow';hint.className='atlas-empty-hint';empty.append(eyebrow,headline,hint);
  root.append(viewport,empty);
  let nodes=[],centers={},simulation=null,currentMode='wander',paused=false,focused=null,first=true,tour=false,tourIndex=0;
  const cache=new Map(),elements=new Map();
  let transform=d3.zoomIdentity.translate(root.clientWidth/2-WORLD.width/2*.72,root.clientHeight/2-WORLD.height/2*.72).scale(.72);
  const zoom=d3.zoom().scaleExtent([.3,1.55]).clickDistance(8)
    .filter(e=>e.type==='wheel'||!e.button)
    .wheelDelta(e=>-Math.max(-80,Math.min(80,e.deltaY*(e.deltaMode===1?16:1)))*.0012)
    .on('start',event=>{if(event.sourceEvent){stopTour();viewport.classList.add('is-grabbing');}})
    .on('end',()=>viewport.classList.remove('is-grabbing'))
    .on('zoom',event=>{transform=event.transform;world.style.transform=`translate(${transform.x}px,${transform.y}px) scale(${transform.k})`;});
  d3.select(viewport).call(zoom).on('dblclick.zoom',null).call(zoom.transform,transform);
  viewport.addEventListener('keydown',event=>{
    const moves={ArrowLeft:[110,0],ArrowRight:[-110,0],ArrowUp:[0,110],ArrowDown:[0,-110]};
    if(moves[event.key]){event.preventDefault();stopTour();const [x,y]=moves[event.key];d3.select(viewport).call(zoom.translateBy,x/transform.k,y/transform.k);}
    if(event.key==='Home'){event.preventDefault();fit();}
  });

  function stopTour(){if(tour){tour=false;onTourChange(false);}}
  function camera(x,y,scale=transform.k,duration=1800){
    const next=d3.zoomIdentity.translate(root.clientWidth/2-x*scale,root.clientHeight/2-y*scale).scale(scale);
    const target=d3.select(viewport);target.interrupt();
    if(reducedMotion()||!duration)target.call(zoom.transform,next);
    else target.transition().duration(duration).ease(d3.easeCubicInOut).call(zoom.transform,next);
  }
  function center(){
    if(!nodes.length){camera(WORLD.width/2,WORLD.height/2,.72);return;}
    const x=d3.mean(nodes,n=>n.x),y=d3.mean(nodes,n=>n.y);
    camera(x,y,Math.min(.9,Math.max(.5,root.clientWidth/1750)));
  }
  function fit(){
    if(!nodes.length)return center();
    const x0=d3.min(nodes,n=>n.x-n.w/2)-100,x1=d3.max(nodes,n=>n.x+n.w/2)+100;
    const y0=d3.min(nodes,n=>n.y-n.h/2)-100,y1=d3.max(nodes,n=>n.y+n.h/2)+100;
    camera((x0+x1)/2,(y0+y1)/2,Math.max(.3,Math.min(1,root.clientWidth/(x1-x0),root.clientHeight/(y1-y0))));
  }
  function curved(a,b){const bend=(hash(a.id+b.id)-.5)*130,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;return `M${a.x},${a.y} Q${mx+bend},${my-bend} ${b.x},${b.y}`;}
  function drawThreads(){
    const links=sharedThreads(nodes);
    paths.selectAll('path').data(links,d=>d.key).join(
      enter=>enter.append('path').attr('class','atlas-thread is-thread-new').attr('pathLength',1),
      update=>update.classed('is-thread-new',false),exit=>exit.remove())
      .attr('d',d=>curved(d.source,d.target)).attr('stroke',d=>themes[d.source.categories[0]][2])
      .classed('is-related',d=>focused&&(d.source.id===focused||d.target.id===focused));
  }
  function emphasis(id){
    focused=id;world.classList.toggle('has-focus',Boolean(id));
    const focus=nodes.find(n=>n.id===id);
    elements.forEach((el,key)=>{el.classList.toggle('is-focus',key===id);el.classList.toggle('is-related',Boolean(focus&&nodes.find(n=>n.id===key)?.categories.some(c=>focus.categories.includes(c))));});
    drawThreads();
  }
  function drawTerrain(){
    const active=Object.keys(centers).filter(k=>nodes.some(n=>n.categories.includes(k)));
    const loop=d3.line().curve(d3.curveLinearClosed);
    const rings=active.flatMap((key,index)=>[0,1,2].map(level=>({key:`${key}-${level}`,theme:key,index,level})));
    terrain.selectAll('path').data(rings,d=>d.key).join('path').attr('stroke',d=>themes[d.theme][2]).attr('d',d=>{
      const center=centers[d.theme],r=210+d.level*130;
      return loop(Array.from({length:12},(_,i)=>{const angle=i/12*Math.PI*2,offset=1+(hash(`${d.key}-${i}`)-.5)*.23;return [center.x+Math.cos(angle)*r*1.5*offset,center.y+Math.sin(angle)*r*.8*offset];}));
    });
    labels.selectAll('text').data(active,d=>d).join('text').attr('x',k=>centers[k].x-100).attr('y',k=>centers[k].y-190).attr('fill',k=>themes[k][2]).text(k=>themes[k][language()==='ja'?0:1]);
  }
  // Rectangular collision keeps the words legible rather than treating them as dots.
  function separate(){
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j],dx=b.x-a.x||.1,dy=b.y-a.y||.1;
      const overlapX=(a.w+b.w)/2+35-Math.abs(dx),overlapY=(a.h+b.h)/2+30-Math.abs(dy);
      if(overlapX>0&&overlapY>0){
        if(overlapX<overlapY){const push=Math.min(15,overlapX*.18)*Math.sign(dx);a.vx-=push;b.vx+=push;}
        else{const push=Math.min(15,overlapY*.18)*Math.sign(dy);a.vy-=push;b.vy+=push;}
      }
    }
  }
  function paint(){
    for(const node of nodes){node.x=Math.max(node.w/2+50,Math.min(WORLD.width-node.w/2-50,node.x));node.y=Math.max(node.h/2+50,Math.min(WORLD.height-node.h/2-50,node.y));cache.set(node.id,node);const el=elements.get(node.id);if(el)el.style.transform=`translate3d(${node.x-node.w/2}px,${node.y-node.h/2}px,0)`;}
    paths.selectAll('path').attr('d',d=>curved(d.source,d.target));
  }
  function measure(){
    nodes.forEach(n=>{const el=elements.get(n.id);n.w=el.offsetWidth;n.h=el.offsetHeight;});
  }
  function update(items,{arrivals=[],mode='wander',loading=false,failed=false,total=items.length}={}){
    currentMode=mode;root.dataset.atlasMode=mode;
    const incoming=new Set(arrivals),liveIds=new Set(items.map(e=>e.id));
    simulation?.stop();
    elements.forEach((el,id)=>{if(!liveIds.has(id)){el.remove();elements.delete(id);}});
    centers=themeCenters(Object.keys(themes),items.length);
    nodes=items.map((voice,index)=>{
      const target=voiceTarget(voice,centers,items.length,index),previous=cache.get(voice.id);
      const enter=incoming.has(voice.id)&&!reducedMotion();
      return {...previous,...voice,tx:target.x,ty:target.y,x:previous?.x??(enter?(root.clientWidth/2-transform.x)/transform.k+(hash(voice.id)-.5)*150:target.x),y:previous?.y??(enter?(root.clientHeight/2-transform.y)/transform.k-100:target.y),vx:0,vy:0,w:300,h:140};
    });
    for(const node of nodes){
      let button=elements.get(node.id);
      if(!button){
        button=document.createElement('button');button.type='button';button.className='voice-utterance';button.dataset.voiceId=node.id;
        const breath=document.createElement('div');breath.className='voice-breath';
        const h=document.createElement('h3');h.className='voice-headline';
        const meta=document.createElement('p');meta.className='voice-whisper';
        const dot=document.createElement('i'),theme=document.createElement('span'),echo=document.createElement('span');echo.className='voice-echo';meta.append(dot,theme,echo);breath.append(h,meta);button.append(breath);
        button.onclick=event=>{if(event.defaultPrevented)return;stopTour();const entry=nodes.find(n=>n.id===node.id);if(entry)openVoice(entry);};
        button.onpointerenter=()=>emphasis(node.id);button.onpointerleave=()=>emphasis(null);
        button.onfocus=()=>{emphasis(node.id);const n=nodes.find(n=>n.id===node.id);if(n){const x=n.x*transform.k+transform.x,y=n.y*transform.k+transform.y;if(x<80||x>root.clientWidth-80||y<100||y>root.clientHeight-100)camera(n.x,n.y,transform.k,700);}};button.onblur=()=>emphasis(null);
        field.append(button);elements.set(node.id,button);
      }
      button.classList.toggle('is-hidden',Boolean(node.hidden));button.classList.toggle('is-arriving',incoming.has(node.id));
      button.dataset.urgency=String(node.urgency);
      button.style.setProperty('--voice-tilt',`${(hash(node.id+'tilt')-.5)*5}deg`);
      button.style.setProperty('--tone',themes[node.categories[0]][2]);button.style.setProperty('--voice-size',`${23+node.urgency*3.6}px`);
      button.style.setProperty('--voice-width',`${245+node.urgency*19}px`);button.style.setProperty('--breath-time',`${17+hash(node.id)*15}s`);button.style.setProperty('--breath-delay',`${-hash(node.id)*15}s`);
      button.querySelector('h3').textContent=node.headline;
      button.querySelector('.voice-whisper>span').textContent=node.categories.map(k=>themes[k][language()==='ja'?0:1]).join(' / ');
      button.querySelector('.voice-echo').textContent=node.resonance?`${node.mine?'↗✓':'↗'} ${node.resonance}`:'';
      button.setAttribute('aria-label',node.headline);
    }
    measure();drawTerrain();drawThreads();
    empty.hidden=items.length>0;
    root.classList.toggle('is-empty',!items.length);root.classList.toggle('is-loading',loading);
    eyebrow.textContent=loading?'…':failed?(language()==='ja'?'接続を確かめています':'Reconnecting'):total?'':language()==='ja'?'小さな声も、黙らせない。':'NO VOICE TOO SMALL.';
    headline.textContent=failed?(language()==='ja'?'声への道を、つなぎ直しています。':'Finding our way back to the voices.'):loading?(language()==='ja'?'声を、待っています。':'Listening for voices.'):
      total?(language()==='ja'?'まだ、出会っていない声。':'No voices on this path.'):(language()==='ja'?'何が、不公平だと思う？':'What feels unfair?');
    hint.textContent=failed?(language()==='ja'?'接続が戻ると、声が届きます。':'Voices will return when the connection does.'):
      total?(language()==='ja'?'検索やテーマを変えると、別の道がひらきます。':'Try another search or theme.'):(language()==='ja'?'身近なことから、匿名でひとつ。':'Start close to home. Leave one anonymous voice.');
    if(!nodes.length){first=true;return;}
    simulation=d3.forceSimulation(nodes).velocityDecay(.62).alpha(incoming.size ? .65 : .38)
      .force('x',d3.forceX(n=>n.tx).strength(.045)).force('y',d3.forceY(n=>n.ty).strength(.045)).force('space',separate).on('tick',paint);
    if(first||reducedMotion()){
      simulation.stop();for(let i=0;i<130;i++)simulation.tick();paint();
      if(first){first=false;const x=d3.mean(nodes,n=>n.x),y=d3.mean(nodes,n=>n.y);camera(x,y,Math.min(.92,Math.max(.62,root.clientWidth/1500)),0);}
    }else if(paused)simulation.stop();
    paint();
  }
  const tourTimer=setInterval(()=>{
    if(!tour||paused||document.hidden||document.querySelector('dialog[open]')||!nodes.length)return;
    const node=nodes[tourIndex++%nodes.length];camera(node.x,node.y,Math.min(1.1,root.clientWidth/650),4500);
  },10000);
  const resizeObserver=new ResizeObserver(()=>{if(!nodes.length)camera(WORLD.width/2,WORLD.height/2,.72,0);});resizeObserver.observe(root);
  document.fonts?.ready.then(()=>{measure();if(nodes.length&&!paused&&!reducedMotion())simulation?.alpha(.3).restart();});
  return {
    update,
    pause(value){if(paused===value)return;paused=value;root.classList.toggle('motion-paused',value);if(value){simulation?.stop();stopTour();}else if(!reducedMotion())simulation?.alpha(.2).restart();},
    zoomBy(factor){stopTour();d3.select(viewport).transition().duration(reducedMotion()?0:450).call(zoom.scaleBy,factor);},
    home:fit,
    toggleTour(){if(reducedMotion())return; tour=!tour;onTourChange(tour);if(tour&&nodes.length){const node=nodes[tourIndex++%nodes.length];camera(node.x,node.y,Math.min(1.1,root.clientWidth/650),3000);}},
    destroy(){simulation?.stop();clearInterval(tourTimer);resizeObserver.disconnect();root.replaceChildren();}
  };
}
