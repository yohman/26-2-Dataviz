import {fifaSnapshot} from './week09-fifa-data.mjs?v=20261127';
import {fifaTeamName} from './week09-fifa-regions.mjs';
import {renderTubeSlide,bindTubeSlide} from './week09-tube.mjs?v=night-race-tokyo-20261127';
import {renderTokyo,bindTokyo} from './week09-tokyo-race.mjs?v=w9-tokyo-group-20261127';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external=(href,body,attrs='')=>`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" ${attrs}>${body}</a>`;
const fifaStages=ja=>ja?['全チーム','人口が少ない側','人口が多い側','上位50位の割合','カーボベルデとアイスランド']:['All teams','Less populous half','More populous half','Top-50 shares','Cabo Verde and Iceland'];

export function fifaEvidence(rows=fifaSnapshot.rows) {
  const ordered=[...rows].sort((a,b)=>a[2]-b[2]);
  const i=Math.floor(ordered.length/2);
  const halves=[ordered.slice(0,i),ordered.slice(i)];
  return {cut:Math.sqrt(ordered[i-1][2]*ordered[i][2]),halves:halves.map(half=>({
    teams:half.length,top:half.filter(row=>row[1]<=50).length
  }))};
}

function fifaPlot(ja,height=1160) {
  const {rows}=fifaSnapshot,{cut,halves}=fifaEvidence(rows);
  const start=164,end=1479;
  const x=pop=>start+Math.log10(pop/30000)/Math.log10(1600000000/30000)*(end-start);
  const y=rank=>407+(rank-1)/210*(height-540);
  const split=x(cut);
  const ticks=ja?['10万','100万','1,000万','1億','10億']:['100k','1m','10m','100m','1bn'];
  const label=(x,y,text,cls='',anchor='start')=>`<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${esc(text)}</text>`;
  const drawDot=([code,rank,pop],highlight=false)=>`<circle class="${highlight?'w9-fifa-top '+(pop<cut?'w9-fifa-less':'w9-fifa-more'):'w9-fifa-dot'}" cx="${x(pop)}" cy="${y(rank)}" r="${highlight?7:4.2}" data-fifa-team="${esc(code)}"/>`;
  const marks=rows.map(row=>drawDot(row)).join('');
  const top=rows.filter(row=>row[1]<=50);
  const layer=(index,content)=>`<g data-fifa-layer="${index}" aria-hidden="true">${content}</g>`;
  const totals=halves.map(({teams,top},i)=>{
    const left=i?split:start,right=i?end:split,mid=(left+right)/2;
    const name=ja?['人口の少ない方の半分','人口の多い方の半分'][i]:['Less populous half','More populous half'][i];
    const cls=i?'w9-fifa-more':'w9-fifa-less';
    return {band:layer(i+1,`<g class="${cls}">
      <rect x="${left}" y="${y(1)}" width="${right-left}" height="${y(50)-y(1)}" class="w9-fifa-top-band"/>
      <path d="M${left} ${y(1)}H${right}" class="w9-fifa-band-rule"/>
      ${label(mid,166,name,'w9-fifa-half-label','middle')}
    </g>`),count:`<g class="${cls}">
      ${label(mid,288,Math.round(top/teams*100)+'%','w9-fifa-percent','middle')}
      ${label(mid,348,ja?`${teams}チーム中${top}`:`${top} of ${teams} teams`,'w9-fifa-count','middle')}
      <path d="M${mid} 372V${y(1)}" class="w9-fifa-band-rule"/>
    </g>`};
  });
  const rates=halves.map(({teams,top})=>Math.round(top/teams*100));
  const callouts=[
    {code:'CPV',name:ja?'カーボベルデ':'Cabo Verde',dx:-116,dy:-39},
    {code:'ISL',name:ja?'アイスランド':'Iceland',dx:-80,dy:56}
  ].flatMap(({code,name,dx,dy})=>{
    const row=rows.find(([team])=>team===code);
    if(!row)return [];
    const [,rank,pop]=row,px=x(pop),py=y(rank),lx=px+dx,ly=py+dy;
    return [{name,rank,svg:`<g class="w9-fifa-callout" data-team="${code}">
      <path class="w9-fifa-leader" d="M${lx+13} ${ly}H${lx+38}L${px} ${py}"/>
      <circle class="w9-fifa-callout-point" cx="${px}" cy="${py}" r="8"/>
      ${label(lx,ly+8,name,'w9-fifa-country-label','end')}
    </g>`}];
  });
  const alt=ja?`人口が少ない方の半分では${rates[0]}%、多い方の半分では${rates[1]}%が男子FIFA上位50位に入った。`:`Scatterplot: ${rates[0]}% of the less populous half and ${rates[1]}% of the more populous half rank in the FIFA men’s top 50.`;
  const named=callouts.map(({name,rank})=>ja?`${name}${rank}位`:`${name} is ranked ${rank}`).join(ja?'、':'; ');
  const base=ja?'代表チームの人口と男子FIFA順位の散布図。灰色の1点は1チーム。':'Scatterplot of population and FIFA men’s rank. Each gray point is one team.';
  return `<svg class="w9-fifa-plot" viewBox="0 0 1600 ${height}" role="img" aria-label="${base}" data-fifa-base="${base}" data-fifa-summary="${esc(alt)}" data-fifa-countries="${esc(named)}">
    ${[50,100,200].map(rank=>`<path class="w9-fifa-grid" d="M${start} ${y(rank)}H${end}"/>`).join('')}
    ${[1e5,1e6,1e7,1e8,1e9].map((pop,i)=>label(x(pop),y(211)+31,ticks[i],'w9-fifa-axis','middle')).join('')}
    ${totals.map(item=>item.band).join('')}
    ${layer(1,`<path class="w9-fifa-cut" d="M${split} 157V${y(211)}"/>`)}
    ${[1,50,100,200].map(rank=>label(start-17,y(rank)+7,rank,'w9-fifa-axis','end')).join('')}
    ${label(start,386,ja?'男子FIFA順位':'FIFA men’s rank','w9-fifa-axis-title')}
    ${label(start-16,(y(1)+y(50))/2+6,ja?'上位50位':'Top 50','w9-fifa-band-label','end')}
    ${marks}
    ${layer(1,top.filter(row=>row[2]<cut).map(row=>drawDot(row,true)).join(''))}
    ${layer(2,top.filter(row=>row[2]>=cut).map(row=>drawDot(row,true)).join(''))}
    ${layer(3,totals.map(item=>item.count).join(''))}
    ${layer(4,callouts.map(item=>item.svg).join(''))}
    <circle class="w9-fifa-probe" data-fifa-probe r="11" visibility="hidden" aria-hidden="true"/>
    ${label((start+end)/2,height-57,ja?'人口（対数軸）':'Population (log scale)','w9-fifa-axis-title','middle')}
    </svg>`;
}


export function renderWeek9(slide,{ja=true,seating=null}={}) {
  const lang=ja?'ja':'en',t=value=>value?.[lang]??value??'';
  const title=esc(t(slide.title));
  if(slide.kind.startsWith('tokyo-'))return renderTokyo(slide,ja);
  if(slide.kind==='fifa-missing'){
    return `<section class="w9-fifa-missing">
      <div class="w9-fifa-missing-copy"><h1>${title}</h1>
      <p>${ja?'アイスランドもカーボベルデも人口は<strong>100万人未満</strong>。この図の横軸は<strong>約300万人</strong>から。':'Iceland and Cabo Verde each have <strong>under 1 million</strong> people. The chart starts at <strong>about 3 million</strong>.'}</p>
      <p>${esc(t(slide.subtitle))}</p></div>
      <figure>${external(slide.sources[0].href,`<img src="${esc(slide.image)}" alt="${esc(t(slide.alt))}">`)}
      <svg viewBox="0 0 1879 1120" aria-hidden="true"><path d="M112 131 V900" fill="none" stroke="#983e46" stroke-width="5" stroke-dasharray="11 9"/><circle cx="112" cy="921" r="16" fill="none" stroke="#983e46" stroke-width="4"/></svg>
      <figcaption>${ja?'第6班の散布図':'Group 6’s original scatterplot'}</figcaption></figure>
    </section>`;
  }
  if(slide.kind==='inquiry') {
    return `<section class="w9-inquiry w9-inquiry--${esc(slide.id)}">${slide.kicker?`<p>${esc(t(slide.kicker))}</p>`:''}<h1>${title}</h1>${slide.subtitle?`<p>${esc(t(slide.subtitle))}</p>`:''}</section>`;
  }
  if(slide.kind==='tfl-detail') {
    return `<section class="w9-tfl">
      ${external(slide.sources[0].href,`<img src="${esc(slide.image)}" alt="${esc(t(slide.alt))}">`)}
      <div><h1>${title}</h1><p>320 m</p>${external(slide.sources[0].href,ja?'TfL ウエストエンド徒歩地図（全体）':'TfL West End walking map (full map)')}</div>
    </section>`;
  }
  if(slide.kind==='match-photo') {
    return `<figure class="w9-match-photo w9-match-photo--${esc(slide.id)}">
      ${external(slide.sources[0].href,`<img src="${esc(slide.image)}" alt="${esc(t(slide.alt))}" referrerpolicy="no-referrer"><span class="w9-image-fallback" hidden>${ja?'出典を開く':'Open the source'} ↗</span>`)}
      <figcaption><h1>${title}</h1><p><strong>${esc(slide.score)}</strong> <span>${esc(t(slide.opponent))}</span></p><small>${esc(t(slide.context))}</small></figcaption>
      <div class="w9-photo-credit">${esc(t(slide.credit))}</div>
    </figure>`;
  }
  if(slide.kind==='fifa-drafts') {
    return `<section class="w9-fifa-drafts"><h1>${title}</h1><div>${slide.images.map((img,i)=>`<figure>${external(slide.sources[i].href,`<img src="${esc(img.src)}" alt="${esc(t(img.alt))}">`)}<figcaption>${esc(t(img.label))}</figcaption></figure>`).join('')}</div></section>`;
  }
  if(slide.kind==='fifa-evidence') {
    return `<section class="w9-fifa-evidence" data-fifa-build><h1>${title}</h1>
      <div class="w9-fifa-controls" aria-label="${ja?'図の表示ステップ':'Chart reveal'}" role="group">
        <button type="button" data-fifa-next aria-label="${ja?'次のレイヤー':'Next layer'}">${ja?'次へ ›':'Next layer ›'}</button>
        <output data-fifa-step aria-live="polite">1 / 5　${fifaStages(ja)[0]}</output>
      </div>
      ${fifaPlot(ja,slide.canvasHeight)}
      <aside class="w9-fifa-tooltip" data-fifa-tooltip role="tooltip" hidden>
        <strong data-fifa-name></strong><dl>
          <div><dt>${ja?'FIFA順位':'FIFA rank'}</dt><dd data-fifa-rank></dd></div>
          <div><dt>${ja?'人口（2025年）':'Population (2025)'}</dt><dd data-fifa-population></dd></div>
        </dl>
      </aside>
      <p class="w9-fifa-source">${ja?'第6班の公開データ：FIFA順位 2026年10月7日・人口 2025年':'Group 6 data · FIFA ranking 7 Oct 2026 · 2025 population'}</p></section>`;
  }
  if(slide.kind==='combined-route')return renderTubeSlide(slide,ja);
  if(slide.kind==='archive') {
    const opening=slide.id==='pocket-map'||slide.id==='beck-map';
    return `<figure class="w9-archive w9-archive--${esc(slide.id)}${opening?' w9-archive--opening':''}">${external(slide.sources[0].href,
      `<img src="${esc(slide.image)}" alt="${esc(t(slide.alt))}" referrerpolicy="no-referrer" ${slide.id==='pocket-map'?'fetchpriority="high"':''}><span class="w9-image-fallback" hidden>${ja?'原図を開く':'Open the original'} ↗</span>`)}
      ${opening?`<h1>${title}</h1>`:''}
      <figcaption><b>${esc(slide.year)}</b> ${esc(t(slide.credit))}</figcaption></figure>`;
  }
  if(slide.kind==='studio-opening') {
    return `<section class="w9-studio-opening"><h1>${title}</h1><img src="${esc(slide.image)}" alt=""><p>${ja?'一つの問い。一つのグループ作品。':'One question. One group graphic.'}</p></section>`;
  }
  if(slide.kind==='studio-seating') {
    const names=number=>Array.isArray(seating?.[number])?seating[number]:[];
    return `<section class="w9-seating-chart"><header><h1>${title}</h1><p>${ja?'16班・63人':'16 groups · 63 students'}</p></header>
      <div class="w9-room-front">${ja?'黒板・スクリーン（教室の前方）':'Board / screen (front of the room)'}</div>
      <div class="w9-seat-grid">${slide.groups.map(([number,en,jp])=>`<article class="w9-seat-card" data-group="${number}"><p>${ja?`第${number}班`:`GROUP ${String(number).padStart(2,'0')}`}</p><h2>${esc(ja?jp:en)}</h2>
      ${names(number).length?`<ul>${names(number).map(name=>`<li>${esc(t(name))}</li>`).join('')}</ul>`:''}</article>`).join('')}
      <p class="w9-seat-open">${ja?'空き机':'Open desks'}</p></div></section>`;
  }
  if(slide.kind==='activity'||slide.kind==='homework') {
    return `<section class="w9-task${slide.kind==='homework'?' w9-task--homework':''}">
    <div class="w9-task-head"><h1>${title}</h1>${slide.duration?`<span>${esc(slide.duration)} <small>${ja?'分':'min'}</small></span>`:''}</div>
    <ol>${t(slide.steps).map(step=>`<li>${esc(step)}</li>`).join('')}</ol>
    ${slide.kind==='homework'?`<div class="w9-submit"><a href="homework-submit.html?week=10">${ja?'中間発表の図を提出':'Submit the midterm graphic'} ↗</a><a href="homework-submit.html?week=9">${ja?'第9週の宿題':'Week 9 homework'} ↗</a><time datetime="2026-12-03T23:59:00+09:00">${ja?'12月3日（木）23:59':'Thu, Dec. 3 · 23:59'} JST</time></div>`:''}
    </section>`;
  }
  return '';
}

export function bindWeek9(slide,{s,ja}={}) {
  if(s.kind==='tokyo-reveal')bindTokyo(slide.querySelector('[data-tokyo-race]'),ja);
  if(s?.kind==='combined-route')bindTubeSlide(slide.querySelector('[data-tube-slide]'),s,ja);
  if(s.kind==='fifa-evidence')return bindFifa(slide.querySelector('[data-fifa-build]'),ja);
  const img=slide.querySelector('.w9-archive img,.w9-match-photo img');
  if(!img)return;
  const fallback=()=>{img.hidden=true;slide.querySelector('.w9-image-fallback').hidden=false;};
  img.addEventListener('error',fallback,{once:true});
  if(img.complete&&!img.naturalWidth)fallback();
}

function bindFifa(root,ja){
  if(!root)return;
  const stages=fifaStages(ja),last=stages.length-1;
  const get=name=>root.querySelector(`[data-fifa-${name}]`);
  const [next,status,probe,tooltip,name,rank,population]=['next','step','probe','tooltip','name','rank','population'].map(get);
  const plot=root.querySelector('.w9-fifa-plot'),layers=[...plot.querySelectorAll('[data-fifa-layer]')];
  const count=new Intl.NumberFormat(ja?'ja-JP':'en');
  const teams=new Map(fifaSnapshot.rows.map(row=>[row[0],row]));
  const points=[...plot.querySelectorAll('.w9-fifa-dot')].map(dot=>({
    x:Number(dot.getAttribute('cx')),y:Number(dot.getAttribute('cy')),row:teams.get(dot.dataset.fifaTeam)
  }));
  let step=0,active=null,press=null;
  function show(value){
    step=Math.max(0,Math.min(last,value));
    root.dataset.fifaStage=step;
    for(const layer of layers){
      const visible=Number(layer.dataset.fifaLayer)<=step;
      layer.classList.toggle('is-visible',visible);
      layer.setAttribute('aria-hidden',String(!visible));
    }
    next.disabled=step===last;
    status.textContent=`${step+1} / ${stages.length}　${stages[step]}`;
    const description=step===last?`${plot.dataset.fifaSummary} ${plot.dataset.fifaCountries}`:step===3?plot.dataset.fifaSummary:`${plot.dataset.fifaBase} ${stages[step]}.`;
    plot.setAttribute('aria-label',description);
  }
  function advance(){
    if(step===last)return false;
    show(step+1);
    return true;
  }
  function inspect(point){
    if(point===active)return;
    active=point;
    tooltip.hidden=!point;
    probe.setAttribute('visibility',point?'visible':'hidden');
    if(!point)return;
    const {x,y,row:[code,ranking,pop]}=point;
    probe.setAttribute('cx',x);probe.setAttribute('cy',y);
    tooltip.style.left=`${x}px`;tooltip.style.top=`${y}px`;
    tooltip.classList.toggle('is-left',x>1150);
    name.textContent=fifaTeamName(code,ja);
    rank.textContent=count.format(ranking);
    population.textContent=count.format(pop);
  }
  next.addEventListener('click',advance);
  plot.addEventListener('pointerdown',event=>{press=[event.clientX,event.clientY];});
  plot.addEventListener('click',event=>{
    const moved=press&&Math.hypot(event.clientX-press[0],event.clientY-press[1])>7;
    press=null;
    if(event.detail<=1&&!moved)advance();
  });
  plot.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch')return;
    const transform=plot.getScreenCTM();
    if(!transform)return;
    const scale=Math.hypot(transform.a,transform.b);
    if(!scale)return;
    const pos=new DOMPoint(event.clientX,event.clientY).matrixTransform(transform.inverse());
    const radius=Math.min(42,10/scale);
    let nearest=null,distance=radius*radius;
    for(const point of points){
      const d=(pos.x-point.x)**2+(pos.y-point.y)**2;
      if(d<=distance){nearest=point;distance=d;}
    }
    inspect(nearest);
  });
  plot.addEventListener('pointerleave',()=>inspect(null));
  show(0);
  return advance;
}
