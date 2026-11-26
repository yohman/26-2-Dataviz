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
const mapPaths={shared:'M155 86 H245 Q305 86 305 145 V250',stay:'M305 250 V438',street:'M305 438 H505',yamanote:'M305 250 H426 Q505 250 505 329 V398',exit:'M505 398 V438'};
function routeMap(ja,moving=false){
  const name=ja?['南柏','西日暮里','大手町','東京駅']:['Minami-Kashiwa','Nishi-Nippori','Ōtemachi','Tokyo Station'];
  const labels=[[155,86,0,-26],[305,250,-20,-24],[305,438,-19,38],[505,438,14,38]];
  return `<svg class="w9-commute-map" viewBox="0 0 625 535" role="img" aria-label="${ja?'南柏から東京駅までの二つの経路図':'Schematic of the two routes from Minami-Kashiwa to Tokyo Station'}">
     ${Object.entries(mapPaths).map(([id,d])=>`<path class="commute-map-${id}" data-path="${id}" d="${d}"/>`).join('')}
     ${labels.map(([x,y,dx,dy],i)=>`<circle class="commute-node" cx="${x}" cy="${y}" r="${i===0||i===3?11:8}"/><text x="${x+dx}" y="${y+dy}" text-anchor="${i===0?'middle':i===3?'end':'end'}">${name[i]}</text>`).join('')}
     <text class="commute-mode" x="76" y="148">${ja?'常磐線各駅停車':'Jōban Local'}</text>
     <text class="commute-mode" x="280" y="349" text-anchor="end">${ja?'千代田線':'Chiyoda Line'}</text>
     <text class="commute-mode" x="402" y="219">${ja?'山手線 外回り':'Yamanote outer loop'}</text>
     <text class="commute-mode" x="400" y="414" text-anchor="middle">${ja?'徒歩':'Walk'}</text>
     ${moving?'<g data-racer="a" class="commute-racer-a" transform="translate(150 86)"><circle r="11"/></g><g data-racer="b" class="commute-racer-b" transform="translate(160 86)"><path d="M0 -10 L10 0 0 10 -10 0Z"/></g>':''}
   </svg>`;
}
function chart(ja,walk){
  const {a,b}=tokyoRace(walk),names=routeNames(ja);
  const rail=(s,e,y,cls)=>`<path class="commute-time-${cls}" d="M${x(s)} ${y}H${x(e)}"/>`;
  const stop=(time,y)=>`<circle class="commute-clock-node" cx="${x(time)}" cy="${y}" r="7"/>`;
  return `<svg class="w9-commute-timeline" viewBox="0 0 780 400" aria-hidden="true">
      ${[0,15,30,45,60].map(t=>`<path class="commute-tick" d="M${x(t)} 62V335"/><text x="${x(t)}" y="368" text-anchor="middle" class="commute-tick-label">${stamp(t)}</text>`).join('')}
      <text x="45" y="70" class="commute-lane-label commute-a">${names[0]}</text>
      ${rail(0,T.ote,124,'a')}${rail(T.ote,a,124,'walk')}${stop(T.ote,124)}
      <text x="${x(T.ote)}" y="161" text-anchor="middle" class="commute-event">${ja?'大手町':'Ōtemachi'} ${stamp(T.ote)}</text>
      <text x="45" y="228" class="commute-lane-label commute-b">${names[1]}</text>
      ${rail(0,T.nishi,281,'b')}${rail(T.nishi,T.board,281,'change')}${rail(T.board,T.tokyoPlatform,281,'b')}${rail(T.tokyoPlatform,b,281,'exit')}${stop(T.nishi,281)}${stop(T.board,281)}
      <text x="${x((T.nishi+T.board)/2)}" y="322" text-anchor="middle" class="commute-event">${ja?'乗換＋待ち':'Transfer + wait'} ${T.board-T.nishi}${ja?'分':' min'}</text>
      <path data-commute-now d="M${x(0)} 78V338"/>
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
    <div class="w9-commute-graphic">${routeMap(ja,true)}<div data-tokyo-chart>${chart(ja,T.defaultWalk)}</div></div>
    <div class="w9-commute-control"><button type="button" data-tokyo-play>${ja?'▶ 再生':'▶ Play race'}</button><label>${ja?'大手町からの徒歩':'Walk from Ōtemachi'} <output data-tokyo-walk>${T.defaultWalk} ${ja?'分':'min'}</output><input type="range" min="4" max="16" value="${T.defaultWalk}"></label><p data-tokyo-result aria-live="polite"></p></div>
    <footer>${ja?'2026年12月の平日時刻表。徒歩は試算。':'Dec. 2026 weekday timetable. Walking times are estimates.'}</footer>
  </section>`;
}
export function bindTokyo(root,ja){
  if(!root)return;
  const get=q=>root.querySelector(q),control=get('input'),play=get('[data-tokyo-play]'),walkLabel=get('[data-tokyo-walk]');
  const clock=get('[data-tokyo-clock]'),result=get('[data-tokyo-result]'),timeline=get('[data-tokyo-chart]');
  const routes=Object.fromEntries(Object.keys(mapPaths).map(id=>{const path=get('[data-path="'+id+'"]');return [id,[path,path.getTotalLength()]];}));
  const riders=['a','b'].map(id=>get('[data-racer="'+id+'"]'));
  let elapsed=0,frame=0,last=null,paused=false;
  function draw(){
    const walk=Number(control.value),out=tokyoRace(walk),model=tokyoFrame(elapsed,walk);
    [model.a,model.b].forEach(({phase,progress},i)=>{
      const key=phase==='transfer'?'shared':phase,[path,length]=routes[key];
      const pos=path.getPointAtLength(length*(phase==='transfer'?1:progress));
      const offset=phase==='shared'||(model.landedA&&model.landedB)?(i?7:-7):0;
      riders[i].setAttribute('transform',`translate(${pos.x+offset} ${pos.y})`);
      riders[i].classList.toggle('is-transferring',phase==='transfer');
    });
    get('[data-commute-now]').setAttribute('d',`M${x(elapsed)} 78V338`);
    get('[data-clock-racer=a]').setAttribute('cx',x(Math.min(out.a,elapsed)));
    get('[data-clock-racer=b]').setAttribute('transform',`translate(${x(Math.min(out.b,elapsed))} 281)`);
    get('[data-lane-arrival=a]').setAttribute('visibility',model.landedA?'visible':'hidden');
    get('[data-lane-arrival=b]').setAttribute('visibility',model.landedB?'visible':'hidden');
    clock.textContent=stamp(elapsed);
    root.dataset.stage=model.landedA&&model.landedB?'finished':model.b.phase;
    if(model.landedA&&model.landedB){
      const name=out.winner==='a'?(ja?'大手町経由':'Via Ōtemachi'):(ja?'西日暮里経由':'Via Nishi-Nippori');
      const copy=out.winner==='tie'?(ja?'同時に到着':'Tie'):(ja?`${name}が${out.margin}分早い`:`${name} wins by ${out.margin} min`);
      result.textContent=`${copy} · ${stamp(out.a)} / ${stamp(out.b)}`;
    }
  }
  function reset(){
    cancelAnimationFrame(frame);frame=0;last=null;elapsed=0;paused=false;result.textContent='';
    walkLabel.textContent=control.value+(ja?'分':' min');
    timeline.innerHTML=chart(ja,Number(control.value));
    play.textContent=ja?'▶ 再生':'▶ Play race';draw();
  }
  const finished=()=>elapsed>=tokyoRace(Number(control.value)).duration;
  function tick(t){
    if(!root.isConnected)return;
    const total=tokyoRace(Number(control.value)).duration;
    elapsed=Math.min(total,elapsed+(last===null?0:(t-last)*total/10500));last=t;
    draw();
    if(finished()){frame=0;play.textContent=ja?'↻ もう一度':'↻ Replay';}
    else frame=requestAnimationFrame(tick);
  }
  play.addEventListener('click',()=>{
    if(frame){cancelAnimationFrame(frame);frame=0;paused=true;play.textContent=ja?'▶ 続ける':'▶ Resume';return;}
    if(!paused)reset();
    paused=false;last=null;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){
      elapsed=tokyoRace(Number(control.value)).duration;draw();play.textContent=ja?'↻ もう一度':'↻ Replay';return;
    }
    play.textContent=ja?'Ⅱ 一時停止':'Ⅱ Pause';
    frame=requestAnimationFrame(tick);
  });
  control.addEventListener('input',reset);
  for(const event of ['pointerdown','touchstart','dblclick'])control.addEventListener(event,e=>e.stopPropagation());
}
