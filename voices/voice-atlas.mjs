import {hash} from './atlas-model.mjs?v=uprising-20261107';
import {detectTopics,scatterVoices,resonanceLinks,resonanceTargets,threadNeighborhood} from './topic-model.mjs?v=uprising-20261107';
import {reducedMotion} from './arrival-motion.mjs';

export function createVoiceAtlas(root,{themes,openVoice,language,onTourChange=()=>{}}){
 const d3=window.d3,viewport=document.createElement('div'),world=document.createElement('div'),field=document.createElement('div');
 viewport.className='atlas-viewport';viewport.tabIndex=0;viewport.setAttribute('aria-label','Drag through the voices; pull a voice, select it to read / ドラッグで散策。声をつかんで動かし、選んで読む');world.className='atlas-world';field.className='atlas-voices';
 const svg=d3.select(world).append('svg').attr('class','atlas-geography').attr('aria-hidden','true'),paths=svg.append('g').attr('class','atlas-threads'),annotations=document.createElement('div');annotations.className='resonance-annotations';world.append(annotations,field);viewport.append(world);root.append(viewport);
 const trail=document.createElement('div');trail.className='thread-trail';trail.hidden=true;root.append(trail);
 const empty=document.createElement('div');empty.className='atlas-empty';root.append(empty);
 const gather=document.createElement('button');gather.type='button';gather.className='coalesce-toggle';root.append(gather);
 let nodes=[],groups=[],links=[],mode='wander',simulation,paused=false,tour=false,tourIndex=0,first=true,collected=true,selectedGroup=null,traceId=null,traceHistory=[],traceTargets=new Map(),gathering=null,dimensions={width:2500,height:1500},transform=d3.zoomIdentity;
 const elements=new Map(),cache=new Map(),pigments=['#ee695a','#eac65d','#7dc28a','#f1eddb'];
 const ja=()=>language()==='ja';
 const zoom=d3.zoom().scaleExtent([.04,2]).clickDistance(7).filter(e=>e.type==='wheel'||(!e.button&&!e.target.closest?.('.voice-utterance,.resonance-label'))).wheelDelta(e=>-Math.max(-80,Math.min(80,e.deltaY*(e.deltaMode===1?16:1)))*.0012).on('start',e=>{if(e.sourceEvent)stopTour();}).on('zoom',e=>{transform=e.transform;world.style.transform=`translate(${transform.x}px,${transform.y}px) scale(${transform.k})`;root.classList.toggle('is-overview',transform.k<.4);world.style.setProperty('--label-scale',Math.min(3,.7/transform.k));});
 d3.select(viewport).call(zoom).on('dblclick.zoom',null);
 function stopTour(){tour=false;onTourChange(false);}
 function camera(x,y,k=transform.k,duration=900){const t=d3.zoomIdentity.translate(root.clientWidth/2-x*k,root.clientHeight/2-y*k).scale(k),selection=d3.select(viewport);selection.interrupt();if(reducedMotion()||!duration)selection.call(zoom.transform,t);else selection.transition().duration(duration).ease(d3.easeCubicInOut).call(zoom.transform,t);}
 function bounds(){return {x0:d3.min(nodes,n=>n.x-n.w*.58)-50,x1:d3.max(nodes,n=>n.x+n.w*.58)+50,y0:d3.min(nodes,n=>n.y-n.h*.64)-50,y1:d3.max(nodes,n=>n.y+n.h*.64)+50};}
 function fit(duration=850,close=false){if(!nodes.length)return;const b=bounds(),scale=Math.min((root.clientWidth-45)/(b.x1-b.x0),(root.clientHeight-135)/(b.y1-b.y0));camera((b.x0+b.x1)/2,(b.y0+b.y1)/2,Math.min(1,scale*(close?1.75:1)),duration);}
 viewport.onkeydown=e=>{if(e.key==='Home'){e.preventDefault();fit();}const moves={ArrowLeft:[90,0],ArrowRight:[-90,0],ArrowUp:[0,90],ArrowDown:[0,-90]};if(moves[e.key]&&e.target===viewport){e.preventDefault();stopTour();const [x,y]=moves[e.key];d3.select(viewport).call(zoom.translateBy,x/transform.k,y/transform.k);}};
 function frame(points,duration=1100,focus=null){if(!points.length)return;const x0=d3.min(points,n=>n.x-(n.w||300)*.7),x1=d3.max(points,n=>n.x+(n.w||300)*.7),y0=d3.min(points,n=>n.y-(n.h||160)*.85),y1=d3.max(points,n=>n.y+(n.h||160)*.85);camera(focus?.x??(x0+x1)/2,focus?.y??(y0+y1)/2,Math.min(.95,(root.clientWidth-70)/(x1-x0),(root.clientHeight-235)/(y1-y0)),duration);}
 function illuminate(id=null){const set=new Set(),active=id||(mode==='threads'?traceId:null);if(active){set.add(active);links.forEach(l=>{if(l.a.id===active)set.add(l.b.id);if(l.b.id===active)set.add(l.a.id);});}else if(selectedGroup){groups.find(g=>g.id===selectedGroup)?.members.forEach(v=>set.add(v));}
  world.classList.toggle('has-focus',Boolean(active||selectedGroup));elements.forEach((el,key)=>{el.classList.toggle('is-related',set.has(key));el.classList.toggle('is-focus',key===active);el.classList.toggle('is-trace-source',mode==='threads'&&key===traceId);});paths.selectAll('path').classed('is-related',l=>active?(l.a.id===active||l.b.id===active):Boolean(selectedGroup&&l.common.includes(selectedGroup)));annotations.querySelectorAll('button').forEach(b=>b.classList.toggle('is-related',b.dataset.topic===selectedGroup||Boolean(active&&nodes.find(n=>n.id===active)?.topics.includes(b.dataset.topic))));}
 function chooseGroup(group){stopTour();selectedGroup=selectedGroup===group.id?null:group.id;illuminate();if(selectedGroup)frame(nodes.filter(n=>group.members.includes(n.id)));else fit();}
 function threadControls(){trail.replaceChildren();trail.hidden=mode!=='threads';if(trail.hidden)return;const current=nodes.find(n=>n.id===traceId);if(!current)return;
  const neighborhood=threadNeighborhood(traceId,links),back=document.createElement('button'),read=document.createElement('button'),another=document.createElement('button'),caption=document.createElement('p');
  back.textContent=ja()?'← 戻る':'← Back';back.disabled=!traceHistory.length;back.onclick=()=>follow(traceHistory.pop(),false);
  read.textContent=ja()?'この声を読む ↗':'Read this voice ↗';read.onclick=()=>openVoice(current);
  another.textContent=ja()?'別の糸へ ↗':'Another thread ↗';another.onclick=()=>{const candidates=nodes.filter(n=>n.id!==traceId&&links.some(l=>l.a.id===n.id||l.b.id===n.id));if(candidates.length)follow(candidates[(traceHistory.length*7)%candidates.length].id);};
  caption.textContent=neighborhood.neighbors.length?(ja()?'共通する言葉から、次の声へ':'A shared word leads to another voice'):(ja()?'まだ共通する言葉が見つからない声':'No shared words found for this voice yet');
  const choices=document.createElement('div');choices.className='thread-choices';for(const neighbor of neighborhood.neighbors.slice(0,3)){const n=nodes.find(n=>n.id===neighbor.id),b=document.createElement('button');b.type='button';b.textContent=neighbor.common.map(id=>groups.find(g=>g.id===id)?.[ja()?'ja':'en']).filter(Boolean).slice(0,2).join(' / ')+' ↗';const snippet=document.createElement('small');snippet.textContent=n.headline.slice(0,26)+(n.headline.length>26?'…':'');b.append(snippet);b.title=n.headline;b.setAttribute('aria-label',b.textContent+' · '+n.headline);b.onclick=()=>follow(n.id);choices.append(b);}
  trail.append(caption,choices,back,read,another);
 }
 function follow(id,remember=true){if(!nodes.some(n=>n.id===id))return;stopTour();if(remember&&traceId&&traceId!==id)traceHistory.push(traceId);traceId=id;selectedGroup=null;
  const local=threadNeighborhood(id,links),cx=dimensions.width/2,cy=dimensions.height/2;traceTargets=new Map([[id,{x:cx,y:cy}]]);
  const adjacent=local.neighbors.map(v=>({...nodes.find(n=>n.id===v.id)}));const box=scatterVoices(adjacent,1.6);
  const minX=d3.min(adjacent,n=>n.tx)||0,maxX=d3.max(adjacent,n=>n.tx)||1,minY=d3.min(adjacent,n=>n.ty)||0,maxY=d3.max(adjacent,n=>n.ty)||1;
  adjacent.forEach(n=>traceTargets.set(n.id,{x:cx+((n.tx-minX)/Math.max(1,maxX-minX)-.5)*1200,y:cy+((n.ty-minY)/Math.max(1,maxY-minY)-.5)*650}));
  illuminate();for(const n of nodes){const el=elements.get(n.id);n.w=el.offsetWidth;n.h=el.offsetHeight;}threadControls();forces();frame(nodes.filter(n=>traceTargets.has(n.id)).map(n=>({...n,...traceTargets.get(n.id)})),1000,{x:cx,y:cy});
 }
 // Elliptical, soft repulsion avoids both unreadable piles and the old grid snapping.
 function separate(){for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j];if(mode==='threads'&&(!traceTargets.has(a.id)||!traceTargets.has(b.id)))continue;const dx=b.x-a.x||.1,dy=b.y-a.y||.1,rx=(a.w+b.w)*.53+16,ry=(a.h+b.h)*.58+14,nx=dx/rx,ny=dy/ry,dist=Math.sqrt(nx*nx+ny*ny);if(dist<1){const force=(1-dist)*.36,sx=dx/Math.max(.1,dist)*force,sy=dy/Math.max(.1,dist)*force;if(a.fx==null){a.x-=sx;a.y-=sy;}if(b.fx==null){b.x+=sx;b.y+=sy;}}}}
 function path(l){const bend=(hash(l.key)-.5)*90;return `M${l.a.x},${l.a.y} Q${(l.a.x+l.b.x)/2+bend},${(l.a.y+l.b.y)/2-bend} ${l.b.x},${l.b.y}`;}
 let ticks=0;
 function paint(){for(const n of nodes){const el=elements.get(n.id);el.style.transform=`translate3d(${n.x-n.w/2}px,${n.y-n.h/2}px,0)`;cache.set(n.id,{x:n.x,y:n.y});}paths.selectAll('path').attr('d',path);
  if(++ticks%12===0)annotations.querySelectorAll('button').forEach(b=>{const g=groups.find(g=>g.id===b.dataset.topic),members=nodes.filter(n=>g.members.includes(n.id));if(members.length){b.style.left=d3.mean(members,n=>n.x)+g.offsetX+'px';b.style.top=(g.id===selectedGroup?d3.min(members,n=>n.y-n.h/2)-120:d3.mean(members,n=>n.y)+g.offsetY)+'px';}});
 }
 function forces(){if(!nodes.length)return;simulation?.stop();
  const connected=mode==='galaxy'&&collected,threading=mode==='threads',target=n=>threading&&traceTargets.has(n.id)?traceTargets.get(n.id):connected?gathering.targets.get(n.id):{x:n.tx,y:n.ty};
  simulation=d3.forceSimulation(nodes).velocityDecay(.62).alpha(.95).alphaDecay(.025).alphaTarget(reducedMotion()?0:.012)
   .force('x',d3.forceX(n=>target(n).x).strength(n=>threading?(traceTargets.has(n.id)?.10:.008):connected?.07:.013))
   .force('y',d3.forceY(n=>target(n).y).strength(n=>threading?(traceTargets.has(n.id)?.10:.008):connected?.07:.013))
   .force('charge',d3.forceManyBody().strength(connected?-90:-50).distanceMax(650))
   .force('space',separate).on('tick',paint);
  if(reducedMotion()||paused){simulation.stop();for(let i=0;i<180;i++)simulation.tick();paint();}else if(paused||document.hidden)simulation.stop();
 }
 function gatherLabel(){gather.hidden=mode!=='galaxy';gather.textContent=collected?(ja()?'共鳴をほどく ↗':'Release resonance ↗'):(ja()?'共鳴を集める ↗':'Gather resonance ↗');gather.setAttribute('aria-pressed',String(collected));root.classList.toggle('is-coalescing',mode==='galaxy'&&collected);}
 gather.onclick=()=>{stopTour();collected=!collected;selectedGroup=null;illuminate();gatherLabel();forces();frame(nodes.map(n=>({...n,...(collected?gathering.targets.get(n.id):{x:n.tx,y:n.ty})})));};
 function arrange({reset=false}={}){dimensions=scatterVoices(nodes,Math.max(.7,root.clientWidth/Math.max(240,root.clientHeight-140)));for(const n of nodes){const prior=cache.get(n.id);if(!prior||reset){n.x=n.tx;n.y=n.ty;}else{n.x=prior.x;n.y=prior.y;}}
  world.style.width=dimensions.width+'px';world.style.height=dimensions.height+'px';svg.attr('viewBox',`0 0 ${dimensions.width} ${dimensions.height}`);
  gathering=resonanceTargets(nodes,groups,Math.max(.7,root.clientWidth/root.clientHeight));
  links=resonanceLinks(nodes,groups,3);paths.selectAll('path').data(links,l=>l.key).join('path').attr('class','atlas-thread').attr('stroke',l=>pigments[Math.floor(hash(l.common[0])*3)]).attr('stroke-width',l=>.8+Math.min(2,l.weight*.3));
  annotations.replaceChildren();if(mode==='galaxy')groups.filter(g=>gathering.anchors.some(a=>a.id===g.id)&&g.members.length>=3).sort((a,b)=>b.members.length-a.members.length).slice(0,10).forEach((g,i)=>{g.offsetX=(hash(g.id+'x')-.5)*220;g.offsetY=(hash(g.id+'y')-.5)*180;const b=document.createElement('button');b.type='button';b.className='resonance-label';b.dataset.topic=g.id;b.style.setProperty('--tone',pigments[i%3]);b.style.setProperty('--annotation-tilt',`${(hash(g.id)-.5)*16}deg`);b.append(document.createTextNode(g[ja()?'ja':'en']));const count=document.createElement('small');count.textContent=String(g.members.length);b.append(count);b.setAttribute('aria-label',`${g[ja()?'ja':'en']} · ${g.members.length}`);b.onclick=()=>chooseGroup(g);annotations.append(b);});
  ticks=11;paint();gatherLabel();forces();threadControls();
 }
 function update(items,{mode:nextMode='wander',loading=false,failed=false,arrivals=[]}={}){
  const priorMode=mode;mode=nextMode;root.dataset.atlasMode=mode;simulation?.stop();if(priorMode!==mode){selectedGroup=null;traceHistory=[];}const detected=detectTopics(items);groups=detected.groups;
  const live=new Set(items.map(e=>e.id));elements.forEach((el,id)=>{if(!live.has(id)){el.remove();elements.delete(id);cache.delete(id);}});
  nodes=items.map(e=>({...e,topics:detected.membership.get(e.id)||[],w:300,h:180,vx:0,vy:0}));
  for(const n of nodes){let button=elements.get(n.id);if(!button){button=document.createElement('button');button.type='button';button.className='voice-utterance';button.dataset.voiceId=n.id;const breath=document.createElement('div'),headline=document.createElement('h3'),meta=document.createElement('p');breath.className='voice-breath';headline.className='voice-headline';meta.className='voice-whisper';breath.append(headline,meta);button.append(breath);field.append(button);elements.set(n.id,button);
    button.onclick=e=>{if(!e.defaultPrevented){stopTour();if(mode==='threads'&&traceId!==n.id)follow(n.id);else openVoice(nodes.find(v=>v.id===n.id));}};button.onpointerenter=()=>illuminate(n.id);button.onpointerleave=()=>illuminate();button.onfocus=()=>{illuminate(n.id);const v=nodes.find(v=>v.id===n.id);if(v){const x=v.x*transform.k+transform.x,y=v.y*transform.k+transform.y;if(x<40||x>root.clientWidth-40||y<80||y>root.clientHeight-75)camera(v.x,v.y,Math.max(.6,transform.k));}};button.onblur=()=>illuminate();
    d3.select(button).call(d3.drag().clickDistance(6).on('start',e=>{stopTour();const v=nodes.find(v=>v.id===n.id);v.fx=v.x;v.fy=v.y;button.classList.add('is-pulled');simulation?.alphaTarget(.08).restart();}).on('drag',e=>{const v=nodes.find(v=>v.id===n.id);v.fx+=e.dx/transform.k;v.fy+=e.dy/transform.k;v.x=v.fx;v.y=v.fy;paint();}).on('end',()=>{const v=nodes.find(v=>v.id===n.id);v.fx=v.fy=null;button.classList.remove('is-pulled');simulation?.alphaTarget(.012);}));
   }
   const seed=hash(n.id+'type'),shout=seed>.86;button.classList.toggle('is-shout',shout);button.classList.toggle('is-isolated',!n.topics.length);button.classList.toggle('is-arriving',arrivals.includes(n.id));button.dataset.urgency=n.urgency||'';
   button.style.setProperty('--voice-width',`${shout?360:255+hash(n.id+'width')*105}px`);button.style.setProperty('--voice-size',`${shout?49:26+seed*13}px`);button.style.setProperty('--voice-tilt',`${(hash(n.id+'tilt')-.5)*13}deg`);button.style.setProperty('--breath-time',`${17+hash(n.id)*18}s`);button.style.setProperty('--breath-delay',`${-hash(n.id)*17}s`);button.style.setProperty('--tone',pigments[Math.floor(hash(n.id+'ink')*3)]);
   button.querySelector('h3').textContent=n.headline;button.querySelector('p').textContent=n.resonance?`↗ ${n.resonance}`:'';button.setAttribute('aria-label',n.headline);n.w=button.offsetWidth;n.h=button.offsetHeight;
  }
  empty.hidden=Boolean(nodes.length);world.hidden=!nodes.length;trail.hidden=mode!=='threads'||!nodes.length;root.classList.toggle('is-empty',!nodes.length);if(!nodes.length){empty.textContent=loading?'…':failed?(ja()?'接続を確かめています':'Reconnecting'):(ja()?'まだ、声を待っています。':'Waiting for a voice.');gather.hidden=true;first=true;return;}
  if(priorMode!==mode)collected=true;arrange();illuminate();
  if(mode==='threads'){if(!nodes.some(n=>n.id===traceId))traceId=null;if(priorMode!==mode||!traceId){const ranked=[...nodes].sort((a,b)=>links.filter(l=>l.a.id===b.id||l.b.id===b.id).length-links.filter(l=>l.a.id===a.id||l.b.id===a.id).length);follow(ranked[0].id,false);}else{illuminate();threadControls();}}
  if(priorMode!==mode&&mode==='galaxy')frame(nodes.map(n=>({...n,...gathering.targets.get(n.id)})));
  if(first){first=false;simulation.stop();for(let i=0;i<70;i++)simulation.tick();paint();fit(0,true);if(!paused&&!reducedMotion())simulation.restart();}
  else if(priorMode!==mode){gatherLabel();if(mode==='wander')fit(1100,true);}
 }
 let resizeTimer;const resizeObserver=new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(nodes.length){arrange();if(mode==='threads'&&traceId)follow(traceId,false);}},180);});resizeObserver.observe(root);
 document.fonts?.ready.then(()=>{nodes.forEach(n=>{n.w=elements.get(n.id).offsetWidth;n.h=elements.get(n.id).offsetHeight;});if(nodes.length){arrange();if(mode==='threads'&&traceId)follow(traceId,false);else if(mode==='galaxy')frame(nodes.map(n=>({...n,...gathering.targets.get(n.id)})),0);else fit(0,true);}});
 const visibility=()=>{if(document.hidden)simulation?.stop();else if(!paused&&!reducedMotion())simulation?.alpha(.08).restart();};document.addEventListener('visibilitychange',visibility);
 const timer=setInterval(()=>{if(tour&&!paused&&!document.hidden&&nodes.length&&!document.querySelector('dialog[open]')){const n=nodes[tourIndex++%nodes.length];camera(n.x,n.y,Math.min(1.05,root.clientWidth/650),3800);}},8500);
 return {update,follow,home(){selectedGroup=null;if(mode==='threads'&&traceId){follow(traceId,false);return;}illuminate();fit();},pause(v){paused=v;root.classList.toggle('motion-paused',v);if(v){simulation?.stop();stopTour();}else if(!reducedMotion())simulation?.alpha(Math.max(simulation.alpha(),.15)).restart();},zoomBy(f){stopTour();d3.select(viewport).transition().duration(reducedMotion()?0:350).call(zoom.scaleBy,f);},toggleTour(){if(reducedMotion())return;tour=!tour;onTourChange(tour);if(tour&&nodes.length)camera(nodes[0].x,nodes[0].y,.85,2200);},destroy(){simulation?.stop();clearInterval(timer);clearTimeout(resizeTimer);resizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);root.replaceChildren();}};
}
