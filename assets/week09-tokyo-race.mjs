import {geographicPaths,geographicStops,tokyoBasemap,tokyoMapSource} from './week09-tokyo-geography.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const tokyoTimes=Object.freeze({departure:9*60+3,nishi:35,ote:47,board:42,tokyoPlatform:55,platformWalk:3,defaultWalk:8});
const T=tokyoTimes;
export function tokyoRace(walk=T.defaultWalk) {
  const a=T.ote+walk,b=T.tokyoPlatform+T.platformWalk;
  return {a,b,duration:Math.max(a,b),winner:a===b?'tie':a<b?'a':'b',margin:Math.abs(a-b)};
}
export function tokyoFrame(elapsed,walk=T.defaultWalk) {
  const {a,b}=tokyoRace(walk);
  const leg=(phase,start,end)=>({phase,progress:Math.min(1,Math.max(0,(elapsed-start)/(end-start)))});
  return {
    a:elapsed<T.nishi?leg('shared',0,T.nishi):elapsed<T.ote?leg('stay',T.nishi,T.ote):leg('street',T.ote,a),
    b:elapsed<T.nishi?leg('shared',0,T.nishi):elapsed<T.board?{phase:'transfer',progress:0}:elapsed<T.tokyoPlatform?leg('yamanote',T.board,T.tokyoPlatform):leg('exit',T.tokyoPlatform,b),
    landedA:elapsed>=a,landedB:elapsed>=b,
  };
}
const hhmm=minute=>[Math.floor(minute/60),minute%60].map(n=>String(n).padStart(2,'0')).join(':');
const stamp=t=>hhmm(T.departure+Math.floor(t));
const x=t=>45+t*9.7;
const routeNames=ja=>ja?['大手町で降りて歩く','西日暮里で山手線に乗り換え']:['Stay on to Ōtemachi, then walk','Change to the Yamanote at Nishi-Nippori'];
const mapPaths={shared:'M486 86 L353 159 Q317 177 296 202 L228 250',stay:'M228 250 Q176 282 180 334 L183 427',street:'M183 427 L260 451',yamanote:'M228 250 Q292 284 291 337 L269 417',exit:'M269 417 L260 451'};
const fullMap=[0,0,625,535];
const cityWidth=287;
const cityMap=[12,285,cityWidth,cityWidth*fullMap[3]/fullMap[2]];
export function tokyoMapFrame(elapsed,{reducedMotion=false}={}){
  const t=reducedMotion?Number(elapsed>=T.nishi):Math.max(0,Math.min(1,(elapsed-T.nishi)/3));
  const eased=t*t*(3-2*t);
  return fullMap.map((n,i)=>n+(cityMap[i]-n)*eased);
}
function routeMap(ja){
  const name=ja?['南柏','西日暮里','大手町','東京駅']:['Minami-Kashiwa','Nishi-Nippori','Ōtemachi','Tokyo Station'];
  const labels=[[486,86,0,-26,'middle'],[228,250,-20,-16,'end'],[183,427,-16,7,'end'],[260,451,17,33,'start']];
  return `<svg class="w9-commute-map" viewBox="0 0 625 535" role="img" aria-label="${ja?'南柏から東京駅までの二つの経路図':'Schematic of the two routes from Minami-Kashiwa to Tokyo Station'}">
     ${Object.entries(mapPaths).map(([id,d])=>`<path class="commute-map-${id}" data-path="${id}" d="${d}"/>`).join('')}
     ${labels.map(([x,y,dx,dy,anchor],i)=>`<circle class="commute-node" cx="${x}" cy="${y}" r="${i===0||i===3?11:8}"/><text x="${x+dx}" y="${y+dy}" text-anchor="${anchor}">${name[i]}</text>`).join('')}
     <text class="commute-map-compass" x="37" y="47">↑ N</text>
     <text class="commute-mode" x="365" y="177">${ja?'常磐線各駅停車':'Jōban Local'}</text>
     <text class="commute-mode" x="160" y="344" text-anchor="end">${ja?'千代田線':'Chiyoda Line'}</text>
     <text class="commute-mode" x="312" y="331">${ja?'山手線 外回り':'Yamanote outer loop'}</text>
     <text class="commute-mode" x="204" y="475" text-anchor="middle">${ja?'徒歩':'Walk'}</text>
   </svg>`;
}
function geographicMap(ja){
  const [origin,nishi,ote,gate]=geographicStops;
  const names=ja?['南柏','西日暮里','大手町','東京駅']:['Minami-Kashiwa','Nishi-Nippori','Ōtemachi','Tokyo Station'];
  const coordinates=[{p:origin,dx:0,dy:-17,anchor:'middle'},{p:nishi,dx:18,dy:-17,anchor:'start'},
    {p:ote,dx:-7,dy:-13,anchor:'end',className:'commute-ote-label'},{p:gate,dx:20,dy:26,anchor:'start'}];
  return `<svg class="w9-commute-map w9-commute-geographic" viewBox="0 0 625 535" role="img" aria-label="${ja?'南柏から東京駅までの実際の地理に沿った地図':'Geographic map of the rail routes from Minami-Kashiwa to Tokyo Station'}">
    <svg class="commute-map-camera" data-tokyo-camera width="625" height="535" viewBox="${fullMap.join(' ')}">
    <image class="commute-basemap" href="${tokyoBasemap}" width="625" height="535" preserveAspectRatio="none"/>
    <g class="commute-map-outlines" aria-hidden="true">${Object.values(geographicPaths).map(d=>`<path d="${d}"/>`).join('')}</g>
    ${Object.entries(geographicPaths).map(([id,d])=>`<path class="commute-map-${id}" data-path="${id}" d="${d}"/>`).join('')}
    ${coordinates.map(({p:[x,y],dx,dy,anchor,className},i)=>`<circle class="commute-node" cx="${x}" cy="${y}" r="${i===0||i===3?7:5}"/><text${className?` class="${className}"`:''} x="${x+dx}" y="${y+dy}" text-anchor="${anchor}">${names[i]}</text>`).join('')}
    <text class="commute-mode" x="489" y="150">${ja?'常磐線各駅停車':'Jōban Local'}</text>
    <text class="commute-mode" x="170" y="426">${ja?'山手線':'Yamanote'}</text>
    <g class="commute-wait-ring" aria-hidden="true" transform="translate(${nishi.join(' ')})"><circle r="12"/><circle r="22"/></g>
    <path class="commute-wait-leader" aria-hidden="true" d="M${nishi.join(' ')}l14 19h14"/>
    <text class="commute-wait-caption" x="${nishi[0]+34}" y="${nishi[1]+25}" aria-hidden="true" data-map-wait></text>
    <g data-racer="a" class="commute-racer-a" transform="translate(${origin[0]-7} ${origin[1]})"><circle r="9"/></g>
    <g data-racer="b" class="commute-racer-b" transform="translate(${origin[0]+7} ${origin[1]})"><path d="M0 -9 L9 0 0 9 -9 0Z"/></g>
    </svg>
    <text class="commute-map-compass" x="37" y="47">↑ N</text>
    <a href="${tokyoMapSource}" target="_blank" rel="noopener noreferrer"><text class="commute-map-credit" x="608" y="517" text-anchor="end">${ja?'地理院タイル（加工）・国土数値情報 鉄道':'GSI basemap · MLIT railway data'}</text></a>
   </svg>`;
}
const timelineWidth=780;
function chart(ja,walk){
  const {a,b}=tokyoRace(walk),names=routeNames(ja);
  const rail=(s,e,y,cls)=>`<path class="commute-time-${cls}" d="M${x(s)} ${y}H${x(e)}"/>`;
  const stop=(time,y)=>`<circle class="commute-clock-node" cx="${x(time)}" cy="${y}" r="7"/>`;
  return `<svg class="w9-commute-timeline" viewBox="0 0 ${timelineWidth} 400" aria-hidden="true">
      ${[0,15,30,45,60].map(t=>`<path class="commute-tick" d="M${x(t)} 62V335"/><text x="${x(t)}" y="368" text-anchor="middle" class="commute-tick-label">${stamp(t)}</text>`).join('')}
      <text x="45" y="70" class="commute-lane-label commute-a">${names[0]}</text>
      ${rail(0,T.ote,124,'a')}${rail(T.ote,a,124,'walk')}${stop(T.ote,124)}
      <text x="${x(T.ote)}" y="161" text-anchor="middle" class="commute-event">${ja?'大手町':'Ōtemachi'} ${stamp(T.ote)}</text>
      <text x="45" y="228" class="commute-lane-label commute-b">${names[1]}</text>
      ${rail(0,T.nishi,281,'b')}${rail(T.nishi,T.board,281,'change')}${rail(T.board,T.tokyoPlatform,281,'b')}${rail(T.tokyoPlatform,b,281,'exit')}${stop(T.nishi,281)}${stop(T.board,281)}
      <text x="${x((T.nishi+T.board)/2)}" y="322" text-anchor="middle" class="commute-event">${ja?'乗換＋待ち':'Transfer + wait'} ${T.board-T.nishi}${ja?'分':' min'}</text>
      <path data-commute-now d="M${x(0)} 45V338"/>
      <circle data-clock-racer="a" class="commute-racer-a" cx="${x(0)}" cy="124" r="9"/>
      <path data-clock-racer="b" class="commute-racer-b" transform="translate(${x(0)} 281)" d="M0 -9 L9 0 0 9 -9 0Z"/>
      <text data-lane-arrival="a" x="${x(a)+17}" y="132" class="commute-arrival commute-a" visibility="hidden">${stamp(a)}</text>
      <text data-lane-arrival="b" x="${x(b)+17}" y="289" class="commute-arrival commute-b" visibility="hidden">${stamp(b)}</text>
    </svg>`;
}
export function renderTokyo(slide,ja){
  const title=esc(slide.title[ja?'ja':'en']);
  if(slide.kind==='tokyo-planner')return `<section class="w9-commute-planner"><div><h1>${title}</h1><p>${ja?'「乗換0回」でも、東京駅まで歩く。':'Zero transfers can still mean a walk.'}</p></div><figure><a href="${esc(slide.sources[0].href)}" target="_blank" rel="noopener noreferrer"><img src="${esc(slide.image)}" alt="${esc(slide.alt[ja?'ja':'en'])}"></a><figcaption>Yahoo!路線情報 · ${ja?'検索結果の一覧（抜粋）':'Cropped search summary'}</figcaption></figure></section>`;
  if(slide.kind==='tokyo-schematic')return `<section class="w9-commute-schematic"><div><h1>${title}</h1>${routeNames(ja).map((s,i)=>`<p class="commute-${i?'b':'a'}">${i?'◆':'●'} ${s}</p>`).join('')}</div>${routeMap(ja)}</section>`;
  if(slide.kind==='tokyo-question')return `<section class="w9-commute-question"><strong>${stamp(0)}</strong><p>${ja?'二人とも南柏から同じ電車に乗る。':'Same train out of Minami-Kashiwa.'}</p><h1>${title}</h1></section>`;
  return `<section class="w9-commute" data-tokyo-race><header><div><h1>${title}</h1><p>${ja?'ゴール：東京駅 丸の内北口付近':'Finish: the Marunouchi North Gate area'}</p></div><time data-tokyo-clock aria-hidden="true">${stamp(0)}</time></header>
    <div class="w9-commute-graphic">${geographicMap(ja)}<div class="commute-chart"><div data-tokyo-chart>${chart(ja,T.defaultWalk)}</div><label class="commute-scrubber"><span>${ja?'時刻をドラッグ':'Drag to scrub'}</span><input type="range" data-tokyo-scrub min="0" max="${tokyoRace().duration}" step="0.25" value="0" aria-valuetext="${stamp(0)}"></label></div><div class="commute-phase" aria-hidden="true"><span class="commute-a" data-commute-a></span><span class="commute-b" data-commute-b></span></div></div>
    <div class="w9-commute-control"><button type="button" data-tokyo-play>${ja?'▶ 再生':'▶ Play race'}</button><label>${ja?'大手町からの徒歩':'Walk from Ōtemachi'} <output data-tokyo-walk>${T.defaultWalk} ${ja?'分':'min'}</output><input type="range" data-tokyo-walk-input min="4" max="16" value="${T.defaultWalk}"></label><p data-tokyo-result aria-live="polite"></p></div>
    <footer>${ja?'2026年12月の平日時刻表。徒歩は試算。':'Dec. 2026 weekday timetable. Walking times are estimates.'}</footer>
  </section>`;
}
export function bindTokyo(root,ja){
  if(!root)return;
  const get=q=>root.querySelector(q),control=get('[data-tokyo-walk-input]'),scrubber=get('[data-tokyo-scrub]'),play=get('[data-tokyo-play]'),walkLabel=get('[data-tokyo-walk]');
  const clock=get('[data-tokyo-clock]'),result=get('[data-tokyo-result]'),timeline=get('[data-tokyo-chart]');
  const camera=get('[data-tokyo-camera]'),motion=matchMedia('(prefers-reduced-motion: reduce)');
  const waitText=get('[data-map-wait]'),phaseA=get('[data-commute-a]'),phaseB=get('[data-commute-b]');
  const routes=Object.fromEntries(Object.keys(geographicPaths).map(id=>{const path=get('[data-path="'+id+'"]');return [id,[path,path.getTotalLength()]];}));
  const riders=['a','b'].map(id=>get('[data-racer="'+id+'"]'));
  let elapsed=0,frame=0,last=null,paused=false;
  const write=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
  const idle=()=>{play.textContent=finished()?(ja?'↻ もう一度':'↻ Replay'):paused?(ja?'▶ 続ける':'▶ Resume'):(ja?'▶ 再生':'▶ Play race');};
  function draw(){
    const walk=Number(control.value),out=tokyoRace(walk),model=tokyoFrame(elapsed,walk);
    const view=tokyoMapFrame(elapsed,{reducedMotion:motion.matches}),box=view.join(' ');
    if(camera.getAttribute('viewBox')!==box){
      camera.setAttribute('viewBox',box);
      camera.style.setProperty('--commute-map-scale',fullMap[2]/view[2]);
    }
    [model.a,model.b].forEach(({phase,progress},i)=>{
      const key=phase==='transfer'?'shared':phase,[path,length]=routes[key];
      const pos=path.getPointAtLength(length*(phase==='transfer'?1:progress));
      const offset=phase==='shared'||(model.landedA&&model.landedB)?(i?7:-7):0;
      riders[i].setAttribute('transform',`translate(${pos.x+offset} ${pos.y})`);
      riders[i].classList.toggle('is-transferring',phase==='transfer');
    });
    get('[data-commute-now]').setAttribute('d',`M${x(elapsed)} 45V338`);
    get('[data-clock-racer=a]').setAttribute('cx',x(Math.min(out.a,elapsed)));
    get('[data-clock-racer=b]').setAttribute('transform',`translate(${x(Math.min(out.b,elapsed))} 281)`);
    get('[data-lane-arrival=a]').setAttribute('visibility',model.landedA?'visible':'hidden');
    get('[data-lane-arrival=b]').setAttribute('visibility',model.landedB?'visible':'hidden');
    const current=stamp(elapsed);
    write(clock,current);
    if(Math.abs(Number(scrubber.value)-elapsed)>=.125)scrubber.value=elapsed;
    if(scrubber.getAttribute('aria-valuetext')!==current)scrubber.setAttribute('aria-valuetext',current);
    const waiting=model.b.phase==='transfer',remain=Math.ceil(T.board-elapsed);
    root.classList.toggle('has-transfer-hold',waiting);
    write(waitText,waiting?(ja?`乗換・待ち あと${remain}分`:`Transfer + wait · ${remain} min left`):'');
    write(phaseA,model.landedA?(ja?'● 丸の内北口に到着':'● At Marunouchi North Gate'):
      model.a.phase==='street'?(ja?'● 大手町から徒歩':'● Walking from Ōtemachi'):
      waiting?(ja?'● 千代田線に乗車中':'● Still on the Chiyoda Line'):
      model.a.phase==='stay'?(ja?'● 千代田線で大手町へ':'● On the train to Ōtemachi'):'');
    write(phaseB,model.landedB?(ja?'◆ 丸の内北口に到着':'◆ At Marunouchi North Gate'):
      waiting?(ja?'◆ 西日暮里で乗換・待ち':'◆ Waiting to board at Nishi-Nippori'):
      model.b.phase==='yamanote'?(ja?'◆ 山手線に乗車中':'◆ On the Yamanote Line'):
      model.b.phase==='exit'?(ja?'◆ ホームから北口へ徒歩':'◆ Walking from the platform'):'');
    root.dataset.stage=model.landedA&&model.landedB?'finished':model.b.phase;
    if(model.landedA&&model.landedB){
      const name=out.winner==='a'?(ja?'大手町経由':'Via Ōtemachi'):(ja?'西日暮里経由':'Via Nishi-Nippori');
      const copy=out.winner==='tie'?(ja?'同時に到着':'Tie'):(ja?`${name}が${out.margin}分早い`:`${name} wins by ${out.margin} min`);
      write(result,`${copy} · ${stamp(out.a)} / ${stamp(out.b)}`);
    }else write(result,'');
  }
  function reset(){
    cancelAnimationFrame(frame);frame=0;last=null;elapsed=0;paused=false;result.textContent='';
    walkLabel.textContent=control.value+(ja?'分':' min');
    timeline.innerHTML=chart(ja,Number(control.value));
    scrubber.max=tokyoRace(Number(control.value)).duration;
    scrubber.value=0;
    scrubber.parentElement.style.setProperty('--scrub-span',`${100*(x(Number(scrubber.max))-x(0))/timelineWidth}%`);
    idle();draw();
  }
  const finished=()=>elapsed>=tokyoRace(Number(control.value)).duration;
  function tick(t){
    if(!root.isConnected)return;
    const total=tokyoRace(Number(control.value)).duration;
    elapsed=Math.min(total,elapsed+(last===null?0:(t-last)*total/17000));last=t;
    draw();
    if(finished()){frame=0;idle();}
    else frame=requestAnimationFrame(tick);
  }
  play.addEventListener('click',()=>{
    if(frame){cancelAnimationFrame(frame);frame=0;paused=true;idle();return;}
    if(!paused)reset();
    paused=false;last=null;
    if(motion.matches){
      elapsed=tokyoRace(Number(control.value)).duration;draw();idle();return;
    }
    play.textContent=ja?'Ⅱ 一時停止':'Ⅱ Pause';
    frame=requestAnimationFrame(tick);
  });
  scrubber.addEventListener('pointerdown',()=>{
    if(frame){cancelAnimationFrame(frame);frame=0;last=null;paused=elapsed>0;idle();}
  });
  scrubber.addEventListener('input',()=>{
    cancelAnimationFrame(frame);frame=0;last=null;elapsed=Number(scrubber.value);
    paused=elapsed>0&&!finished();idle();draw();
  });
  control.addEventListener('input',reset);
  for(const input of [control,scrubber])for(const event of ['pointerdown','touchstart','dblclick'])input.addEventListener(event,e=>e.stopPropagation());
  reset();
}
