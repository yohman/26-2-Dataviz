import {fifaSnapshot} from './week09-fifa-data.mjs?v=20261127';
import {renderTubeSlide,bindTubeSlide} from './week09-tube.mjs?v=night-race-tokyo-20261127';
import {renderTokyo,bindTokyo} from './week09-tokyo-race.mjs?v=w9-tokyo-group-20261127';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external=(href,body,attrs='')=>`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" ${attrs}>${body}</a>`;

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
  const drawDot=([,rank,pop])=>`<circle class="${rank<=50?'w9-fifa-top '+(pop<cut?'w9-fifa-less':'w9-fifa-more'):'w9-fifa-dot'}" cx="${x(pop)}" cy="${y(rank)}" r="${rank<=50?7:4.2}"/>`;
  const marks=[...rows.filter(row=>row[1]>50),...rows.filter(row=>row[1]<=50)].map(drawDot).join('');
  const totals=halves.map(({teams,top},i)=>{
    const left=i?split:start,right=i?end:split,mid=(left+right)/2;
    const name=ja?['人口の少ない方の半分','人口の多い方の半分'][i]:['Less populous half','More populous half'][i];
    return `<g class="${i?'w9-fifa-more':'w9-fifa-less'}">
      <rect x="${left}" y="${y(1)}" width="${right-left}" height="${y(50)-y(1)}" class="w9-fifa-top-band"/>
      <path d="M${left} ${y(1)}H${right}" class="w9-fifa-band-rule"/>
      ${label(mid,166,name,'w9-fifa-half-label','middle')}
      ${label(mid,288,Math.round(top/teams*100)+'%','w9-fifa-percent','middle')}
      ${label(mid,348,ja?`${teams}チーム中${top}`:`${top} of ${teams} teams`,'w9-fifa-count','middle')}
      <path d="M${mid} 372V${y(1)}" class="w9-fifa-band-rule"/>
    </g>`;
  }).join('');
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
  return `<svg class="w9-fifa-plot" viewBox="0 0 1600 ${height}" role="img" aria-label="${esc(alt+' '+named)}">
    ${[50,100,200].map(rank=>`<path class="w9-fifa-grid" d="M${start} ${y(rank)}H${end}"/>`).join('')}
    ${[1e5,1e6,1e7,1e8,1e9].map((pop,i)=>label(x(pop),y(211)+31,ticks[i],'w9-fifa-axis','middle')).join('')}
    ${totals}
    <path class="w9-fifa-cut" d="M${split} 157V${y(211)}"/>
    ${[1,50,100,200].map(rank=>label(start-17,y(rank)+7,rank,'w9-fifa-axis','end')).join('')}
    ${label(start,386,ja?'男子FIFA順位':'FIFA men’s rank','w9-fifa-axis-title')}
    ${label(start-16,(y(1)+y(50))/2+6,ja?'上位50位':'Top 50','w9-fifa-band-label','end')}
    ${marks}
    ${callouts.map(item=>item.svg).join('')}
    ${label((start+end)/2,height-57,ja?'人口（対数軸）':'Population (log scale)','w9-fifa-axis-title','middle')}
    </svg>`;
}


export function renderWeek9(slide,{ja=true}={}) {
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
    return `<section class="w9-fifa-evidence"><h1>${title}</h1>${fifaPlot(ja,slide.canvasHeight)}<p class="w9-fifa-source">${ja?'第6班の公開データ：FIFA順位 2026年10月7日・人口 2025年':'Group 6 data · FIFA ranking 7 Oct 2026 · 2025 population'}</p></section>`;
  }
  if(slide.kind==='combined-route')return renderTubeSlide(slide,ja);
  if(slide.kind==='archive') {
    const opening=slide.id==='pocket-map'||slide.id==='beck-map';
    return `<figure class="w9-archive w9-archive--${esc(slide.id)}${opening?' w9-archive--opening':''}">${external(slide.sources[0].href,
      `<img src="${esc(slide.image)}" alt="${esc(t(slide.alt))}" referrerpolicy="no-referrer" ${slide.id==='pocket-map'?'fetchpriority="high"':''}><span class="w9-image-fallback" hidden>${ja?'原図を開く':'Open the original'} ↗</span>`)}
      ${opening?`<h1>${title}</h1>`:''}
      <figcaption><b>${esc(slide.year)}</b> ${esc(t(slide.credit))}</figcaption></figure>`;
  }
  if(slide.kind==='activity'||slide.kind==='homework') {
    return `<section class="w9-task${slide.kind==='homework'?' w9-task--homework':''}">
    <div class="w9-task-head"><h1>${title}</h1>${slide.duration?`<span>${esc(slide.duration)} <small>${ja?'分':'min'}</small></span>`:''}</div>
    <ol>${t(slide.steps).map(step=>`<li>${esc(step)}</li>`).join('')}</ol>
    ${slide.kind==='homework'?`<div class="w9-submit"><a href="homework-submit.html?week=9">${ja?'宿題を提出する':'Submit homework'} ↗</a><time datetime="2026-12-03T23:59:00+09:00">${ja?'12月3日（木）23:59':'Thu, Dec. 3 · 23:59'} JST</time></div>`:''}
    </section>`;
  }
  return '';
}

export function bindWeek9(slide,{s,ja}={}) {
  if(s.kind==='tokyo-reveal')bindTokyo(slide.querySelector('[data-tokyo-race]'),ja);
  if(s?.kind==='combined-route')bindTubeSlide(slide.querySelector('[data-tube-slide]'),s,ja);
  const img=slide.querySelector('.w9-archive img,.w9-match-photo img');
  if(!img)return;
  const fallback=()=>{img.hidden=true;slide.querySelector('.w9-image-fallback').hidden=false;};
  img.addEventListener('error',fallback,{once:true});
  if(img.complete&&!img.naturalWidth)fallback();
}
