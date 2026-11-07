import {hash} from './atlas-model.mjs?v=unrest-20261107';
import {detectTopics,scatterVoices,resonanceLinks} from './topic-model.mjs?v=unrest-20261107';
import {reducedMotion} from './arrival-motion.mjs';

export function createVoiceAtlas(root,{themes,openVoice,language,onTourChange=()=>{}}){
 const d3=window.d3,viewport=document.createElement('div'),world=document.createElement('div'),field=document.createElement('div');
 viewport.className='atlas-viewport';viewport.tabIndex=0;viewport.setAttribute('aria-label','Drag through the voices; pull a voice, select it to read / ドラッグで散策。声をつかんで動かし、選んで読む');world.className='atlas-world';field.className='atlas-voices';
 const svg=d3.select(world).append('svg').attr('class','atlas-geography').attr('aria-hidden','true'),paths=svg.append('g').attr('class','atlas-threads'),annotations=document.createElement('div');annotations.className='resonance-annotations';world.append(annotations,field);viewport.append(world);root.append(viewport);
 const empty=document.createElement('div');empty.className='atlas-empty';root.append(empty);
 const gather=document.createElement('button');gather.type='button';gather.className='coalesce-toggle';root.append(gather);
 let nodes=[],groups=[],links=[],mode='wander',simulation,paused=false,tour=false,tourIndex=0,first=true,collected=true,selectedGroup=null,dimensions={width:2500,height:1500},transform=d3.zoomIdentity;
 const elements=new Map(),cache=new Map(),pigments=['#ee695a','#eac65d','#7dc28a','#f1eddb'];
 const ja=()=>language()==='ja';
 const zoom=d3.zoom().scaleExtent([.04,2]).clickDistance(7).filter(e=>e.type==='wheel'||(!e.button&&!e.target.closest?.('.voice-utterance,.resonance-label'))).wheelDelta(e=>-Math.max(-80,Math.min(80,e.deltaY*(e.deltaMode===1?16:1)))*.0012).on('start',e=>{if(e.sourceEvent)stopTour();}).on('zoom',e=>{transform=e.transform;world.style.transform=`translate(${transform.x}px,${transform.y}px) scale(${transform.k})`;root.classList.toggle('is-overview',transform.k<.4);});
 d3.select(viewport).call(zoom).on('dblclick.zoom',null);
 function stopTour(){tour=false;onTourChange(false);}
 function camera(x,y,k=transform.k,duration=900){const t=d3.zoomIdentity.translate(root.clientWidth/2-x*k,root.clientHeight/2-y*k).scale(k),selection=d3.select(viewport);selection.interrupt();if(reducedMotion()||!duration)selection.call(zoom.transform,t);else selection.transition().duration(duration).ease(d3.easeCubicInOut).call(zoom.transform,t);}
 function bounds(){return {x0:d3.min(nodes,n=>n.x-n.w*.58)-50,x1:d3.max(nodes,n=>n.x+n.w*.58)+50,y0:d3.min(nodes,n=>n.y-n.h*.64)-50,y1:d3.max(nodes,n=>n.y+n.h*.64)+50};}
 function fit(duration=850,close=false){if(!nodes.length)return;const b=bounds(),scale=Math.min((root.clientWidth-45)/(b.x1-b.x0),(root.clientHeight-135)/(b.y1-b.y0));camera((b.x0+b.x1)/2,(b.y0+b.y1)/2,Math.min(1,scale*(close?1.75:1)),duration);}
 viewport.onkeydown=e=>{if(e.key==='Home'){e.preventDefault();fit();}const moves={ArrowLeft:[90,0],ArrowRight:[-90,0],ArrowUp:[0,90],ArrowDown:[0,-90]};if(moves[e.key]&&e.target===viewport){e.preventDefault();stopTour();const [x,y]=moves[e.key];d3.select(viewport).call(zoom.translateBy,x/transform.k,y/transform.k);}};
 function illuminate(id=null){const set=new Set();if(id){set.add(id);links.forEach(l=>{if(l.a.id===id)set.add(l.b.id);if(l.b.id===id)set.add(l.a.id);});}else if(selectedGroup){groups.find(g=>g.id===selectedGroup)?.members.forEach(v=>set.add(v));}
  world.classList.toggle('has-focus',Boolean(id||selectedGroup));elements.forEach((el,key)=>{el.classList.toggle('is-related',set.has(key));el.classList.toggle('is-focus',key===id);});paths.selectAll('path').classed('is-related',l=>id?(l.a.id===id||l.b.id===id):Boolean(selectedGroup&&l.common.includes(selectedGroup)));annotations.querySelectorAll('button').forEach(b=>b.classList.toggle('is-related',b.dataset.topic===selectedGroup||Boolean(id&&nodes.find(n=>n.id===id)?.topics.includes(b.dataset.topic))));}
 function chooseGroup(group){selectedGroup=selectedGroup===group.id?null:group.id;illuminate();if(selectedGroup){const members=nodes.filter(n=>group.members.includes(n.id));camera(d3.mean(members,n=>n.x),d3.mean(members,n=>n.y),Math.min(.85,Math.max(transform.k,.55)),1100);}}
 // Elliptical, soft repulsion avoids both unreadable piles and the old grid snapping.
 function separate(){for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],dx=b.x-a.x||.1,dy=b.y-a.y||.1,rx=(a.w+b.w)*.53+16,ry=(a.h+b.h)*.58+14,nx=dx/rx,ny=dy/ry,dist=Math.sqrt(nx*nx+ny*ny);if(dist<1){const force=(1-dist)*.36,sx=dx/Math.max(.1,dist)*force,sy=dy/Math.max(.1,dist)*force;if(a.fx==null){a.x-=sx;a.y-=sy;}if(b.fx==null){b.x+=sx;b.y+=sy;}}}}
 function path(l){const bend=(hash(l.key)-.5)*90;return `M${l.a.x},${l.a.y} Q${(l.a.x+l.b.x)/2+bend},${(l.a.y+l.b.y)/2-bend} ${l.b.x},${l.b.y}`;}
 let ticks=0;
 function paint(){for(const n of nodes){const el=elements.get(n.id);el.style.transform=`translate3d(${n.x-n.w/2}px,${n.y-n.h/2}px,0)`;cache.set(n.id,{x:n.x,y:n.y});}paths.selectAll('path').attr('d',path);
  if(++ticks%12===0)annotations.querySelectorAll('button').forEach(b=>{const g=groups.find(g=>g.id===b.dataset.topic),members=nodes.filter(n=>g.members.includes(n.id));if(members.length){b.style.left=d3.mean(members,n=>n.x)+g.offsetX+'px';b.style.top=d3.mean(members,n=>n.y)+g.offsetY+'px';}});
 }
 function forces(){if(!nodes.length)return;simulation?.stop();
  const connected=mode!=='wander'&&collected;
  simulation=d3.forceSimulation(nodes).velocityDecay(.7).alpha(.55).alphaDecay(.018).alphaTarget(reducedMotion()?0:.012)
   .force('x',d3.forceX(n=>n.tx).strength(connected?.00045:.009))
   .force('y',d3.forceY(n=>n.ty).strength(connected?.00045:.009))
   .force('link',connected?d3.forceLink(links.map(l=>({source:l.a,target:l.b,weight:l.weight}))).id(n=>n.id).distance(l=>170+(l.source.w+l.target.w)*.22).strength(l=>Math.min(.13,.03*l.weight)):null)
   .force('charge',d3.forceManyBody().strength(connected?-100:-45).distanceMax(800))
   .force('space',separate).on('tick',paint);
  if(reducedMotion()){simulation.stop();for(let i=0;i<180;i++)simulation.tick();paint();}else if(paused||document.hidden)simulation.stop();
 }
 function gatherLabel(){gather.hidden=mode==='wander';gather.textContent=collected?(ja()?'共鳴をほどく ↗':'Release resonance ↗'):(ja()?'共鳴を集める ↗':'Gather resonance ↗');gather.setAttribute('aria-pressed',String(collected));root.classList.toggle('is-coalescing',mode!=='wander'&&collected);}
 gather.onclick=()=>{stopTour();collected=!collected;selectedGroup=null;illuminate();gatherLabel();forces();};
 function arrange({reset=false}={}){dimensions=scatterVoices(nodes,Math.max(.7,root.clientWidth/Math.max(240,root.clientHeight-140)));for(const n of nodes){const prior=cache.get(n.id);if(!prior||reset){n.x=n.tx;n.y=n.ty;}else{n.x=prior.x;n.y=prior.y;}}
  world.style.width=dimensions.width+'px';world.style.height=dimensions.height+'px';svg.attr('viewBox',`0 0 ${dimensions.width} ${dimensions.height}`);
  links=resonanceLinks(nodes,groups,mode==='threads'?2:3);paths.selectAll('path').data(links,l=>l.key).join('path').attr('class','atlas-thread').attr('stroke',l=>pigments[Math.floor(hash(l.common[0])*3)]).attr('stroke-width',l=>.8+Math.min(2,l.weight*.3));
  annotations.replaceChildren();if(mode!=='wander')groups.filter(g=>g.members.length>=2).sort((a,b)=>b.members.length-a.members.length).slice(0,7).forEach((g,i)=>{g.offsetX=(hash(g.id+'x')-.5)*220;g.offsetY=(hash(g.id+'y')-.5)*180;const b=document.createElement('button');b.type='button';b.className='resonance-label';b.dataset.topic=g.id;b.style.setProperty('--tone',pigments[i%3]);b.style.setProperty('--annotation-tilt',`${(hash(g.id)-.5)*16}deg`);b.append(document.createTextNode(g[ja()?'ja':'en']));const count=document.createElement('small');count.textContent=String(g.members.length);b.append(count);b.setAttribute('aria-label',`${g[ja()?'ja':'en']} · ${g.members.length}`);b.onclick=()=>chooseGroup(g);annotations.append(b);});
  ticks=11;paint();gatherLabel();forces();
 }
 function update(items,{mode:nextMode='wander',loading=false,failed=false,arrivals=[]}={}){
  const priorMode=mode;mode=nextMode;root.dataset.atlasMode=mode;simulation?.stop();selectedGroup=null;const detected=detectTopics(items);groups=detected.groups;
  const live=new Set(items.map(e=>e.id));elements.forEach((el,id)=>{if(!live.has(id)){el.remove();elements.delete(id);cache.delete(id);}});
  nodes=items.map(e=>({...e,topics:detected.membership.get(e.id)||[],w:300,h:180,vx:0,vy:0}));
  for(const n of nodes){let button=elements.get(n.id);if(!button){button=document.createElement('button');button.type='button';button.className='voice-utterance';button.dataset.voiceId=n.id;const breath=document.createElement('div'),headline=document.createElement('h3'),meta=document.createElement('p');breath.className='voice-breath';headline.className='voice-headline';meta.className='voice-whisper';breath.append(headline,meta);button.append(breath);field.append(button);elements.set(n.id,button);
    button.onclick=e=>{if(!e.defaultPrevented){stopTour();openVoice(nodes.find(v=>v.id===n.id));}};button.onpointerenter=()=>illuminate(n.id);button.onpointerleave=()=>illuminate();button.onfocus=()=>{illuminate(n.id);const v=nodes.find(v=>v.id===n.id);if(v){const x=v.x*transform.k+transform.x,y=v.y*transform.k+transform.y;if(x<40||x>root.clientWidth-40||y<80||y>root.clientHeight-75)camera(v.x,v.y,Math.max(.6,transform.k));}};button.onblur=()=>illuminate();
    d3.select(button).call(d3.drag().clickDistance(6).on('start',e=>{stopTour();const v=nodes.find(v=>v.id===n.id);v.fx=v.x;v.fy=v.y;button.classList.add('is-pulled');simulation?.alphaTarget(.08).restart();}).on('drag',e=>{const v=nodes.find(v=>v.id===n.id);v.fx+=e.dx/transform.k;v.fy+=e.dy/transform.k;v.x=v.fx;v.y=v.fy;paint();}).on('end',()=>{const v=nodes.find(v=>v.id===n.id);v.fx=v.fy=null;button.classList.remove('is-pulled');simulation?.alphaTarget(.012);}));
   }
   const seed=hash(n.id+'type'),shout=seed>.86;button.classList.toggle('is-shout',shout);button.classList.toggle('is-isolated',!n.topics.length);button.classList.toggle('is-arriving',arrivals.includes(n.id));button.dataset.urgency=n.urgency||'';
   button.style.setProperty('--voice-width',`${shout?360:255+hash(n.id+'width')*105}px`);button.style.setProperty('--voice-size',`${shout?49:26+seed*13}px`);button.style.setProperty('--voice-tilt',`${(hash(n.id+'tilt')-.5)*13}deg`);button.style.setProperty('--breath-time',`${17+hash(n.id)*18}s`);button.style.setProperty('--breath-delay',`${-hash(n.id)*17}s`);button.style.setProperty('--tone',pigments[Math.floor(hash(n.id+'ink')*3)]);
   button.querySelector('h3').textContent=n.headline;button.querySelector('p').textContent=n.resonance?`↗ ${n.resonance}`:'';button.setAttribute('aria-label',n.headline);n.w=button.offsetWidth;n.h=button.offsetHeight;
  }
  empty.hidden=Boolean(nodes.length);root.classList.toggle('is-empty',!nodes.length);if(!nodes.length){empty.textContent=loading?'…':failed?(ja()?'接続を確かめています':'Reconnecting'):(ja()?'まだ、声を待っています。':'Waiting for a voice.');gather.hidden=true;first=true;return;}
  if(priorMode!==mode)collected=true;arrange();illuminate();
  if(first){first=false;simulation.stop();for(let i=0;i<70;i++)simulation.tick();paint();fit(0,true);if(!paused&&!reducedMotion())simulation.restart();}
  else if(priorMode!==mode)gatherLabel();
 }
 let resizeTimer;const resizeObserver=new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(nodes.length)arrange();},180);});resizeObserver.observe(root);
 document.fonts?.ready.then(()=>{nodes.forEach(n=>{n.w=elements.get(n.id).offsetWidth;n.h=elements.get(n.id).offsetHeight;});if(nodes.length){arrange();fit(0,true);}});
 const visibility=()=>{if(document.hidden)simulation?.stop();else if(!paused&&!reducedMotion())simulation?.alpha(.08).restart();};document.addEventListener('visibilitychange',visibility);
 const timer=setInterval(()=>{if(tour&&!paused&&!document.hidden&&nodes.length&&!document.querySelector('dialog[open]')){const n=nodes[tourIndex++%nodes.length];camera(n.x,n.y,Math.min(1.05,root.clientWidth/650),3800);}},8500);
 return {update,home(){selectedGroup=null;illuminate();fit();},pause(v){paused=v;root.classList.toggle('motion-paused',v);if(v){simulation?.stop();stopTour();}else if(!reducedMotion())simulation?.alpha(.15).restart();},zoomBy(f){stopTour();d3.select(viewport).transition().duration(reducedMotion()?0:350).call(zoom.scaleBy,f);},toggleTour(){if(reducedMotion())return;tour=!tour;onTourChange(tour);if(tour&&nodes.length)camera(nodes[0].x,nodes[0].y,.85,2200);},destroy(){simulation?.stop();clearInterval(timer);clearTimeout(resizeTimer);resizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);root.replaceChildren();}};
}
