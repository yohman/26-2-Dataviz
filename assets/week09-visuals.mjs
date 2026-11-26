import {fifaSnapshot} from './week09-fifa-data.mjs?v=20261127';
import {renderTubeSlide,bindTubeSlide} from './week09-tube.mjs?v=rail-race-20261127';

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

function fifaPlot(ja) {
  const {rows}=fifaSnapshot,{cut,halves}=fifaEvidence(rows);
  const x=pop=>120+Math.log10(pop/30000)/Math.log10(1600000000/30000)*994;
  const y=rank=>176+(rank-1)/210*566;
  const ticks=ja?['10万','100万','1,000万','1億','10億']:['100k','1m','10m','100m','1bn'];
  const countries=ja?{ISL:'アイスランド',CPV:'カーボベルデ',HRV:'クロアチア',IND:'インド'}:{ISL:'Iceland',CPV:'Cabo Verde',HRV:'Croatia',IND:'India'};
  const labels={ISL:[-22,51],CPV:[31,58],HRV:[14,-21],IND:[-22,39]};
  const label=(x,y,text,cls='',anchor='start')=>`<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${esc(text)}</text>`;
  const marks=rows.map(([id,rank,pop])=>`<circle class="${rank<=50?'w9-fifa-top':'w9-fifa-dot'}" cx="${x(pop)}" cy="${y(rank)}" r="${rank<=50?5.7:4.7}" />`).join('');
  const highlights=rows.filter(([id])=>countries[id]).map(([id,rank,pop])=>{
    const cx=x(pop),cy=y(rank),[dx,dy]=labels[id];
    return `<path class="w9-fifa-leader" d="M${cx},${cy} l${dx*.77},${dy*.79}"/><circle class="w9-fifa-highlight" cx="${cx}" cy="${cy}" r="8"/>${label(cx+dx,cy+dy,`${countries[id]} ${ja?`${rank}位`:`#${rank}`}`,'w9-fifa-label',dx<0?'end':'start')}`;
  }).join('');
  const totals=halves.map(({teams,top},i)=>`<div class="w9-fifa-ratio"><dt>${ja?['人口の少ない方の半分','人口の多い方の半分'][i]:['Less populous half','More populous half'][i]}</dt><dd><strong>${Math.round(top/teams*100)}%</strong> <small>${ja?`${teams}チーム中${top}`:`${top} of ${teams} teams`}</small></dd></div>`).join('');
  const alt=ja?'人口が少ない方の半分では101チーム中8、多い方の半分では102チーム中39が、男子FIFA上位50位に入った。':'Scatterplot: 8 of 101 teams in the less populous half and 39 of 102 in the more populous half rank in the top 50.';
  return `<svg viewBox="0 0 1154 854" role="img" aria-label="${alt}">
    <rect x="120" y="${y(1)}" width="994" height="${y(50)-y(1)}" class="w9-fifa-top-band"/>
    ${[1,50,100,150,200].map(rank=>`<path class="w9-fifa-grid" d="M120 ${y(rank)}H1114"/>${label(100,y(rank)+8,rank,'w9-fifa-axis','end')}`).join('')}
    ${[1e5,1e6,1e7,1e8,1e9].map((pop,i)=>`<path class="w9-fifa-grid" d="M${x(pop)} ${y(1)}V${y(211)}"/>${label(x(pop),y(211)+34,ticks[i],'w9-fifa-axis','middle')}`).join('')}
    <path class="w9-fifa-cut" d="M${x(cut)} ${y(1)-4}V${y(211)}"/>
    ${label(120,140,ja?'男子FIFA世界ランキング（1位が最上位）':'FIFA men’s world rank (1 is best)','w9-fifa-axis-title')}
    ${label(x(cut)-11,163,ja?'人口で二分':'Population midpoint','w9-fifa-axis','end')}
    ${label(128,221,ja?'上位50位':'Top 50','w9-fifa-band-label')}
    ${marks}${highlights}
    ${label(617,826,ja?'人口（対数軸）':'Population (log scale)','w9-fifa-axis-title','middle')}
    </svg>
    <aside class="w9-fifa-result"><p>${ja?'上位50位に入った割合':'Share in the top 50'}</p><dl>${totals}</dl></aside>`;
}

export function renderWeek9(slide,{ja=true}={}) {
  const lang=ja?'ja':'en',t=value=>value?.[lang]??value??'';
  const title=esc(t(slide.title));
  if(slide.kind==='fifa-missing'){
    return `<section class="w9-fifa-missing">
      <div class="w9-fifa-missing-copy"><h1>${title}</h1>
      <p>${ja?'アイスランドもカーボベルデも人口は<strong>100万人未満</strong>。この図の横軸は<strong>約300万人</strong>から。':'Iceland and Cabo Verde each have <strong>under 1 million</strong> people. The chart starts at <strong>about 3 million</strong>.'}</p>
      <p>${esc(t(slide.subtitle))}</p></div>
      <figure>${external(slide.sources[0].href,`<img src="${esc(slide.image)}" alt="${esc(t(slide.alt))}">`)}
      <svg viewBox="0 0 1130 1000" aria-hidden="true"><path d="M111 61 V819" fill="none" stroke="#983e46" stroke-width="5" stroke-dasharray="11 9"/><circle cx="111" cy="851" r="19" fill="none" stroke="#983e46" stroke-width="4"/></svg>
      <figcaption>${ja?'第6班の散布図（左端の拡大）':'The left edge of Group 6’s scatterplot'}</figcaption></figure>
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
    return `<section class="w9-fifa-evidence"><h1>${title}</h1>${fifaPlot(ja)}<p class="w9-fifa-source">${ja?'第6班の公開データ：FIFA順位 2026年10月7日・人口 2025年':'Group 6 data · FIFA ranking 7 Oct 2026 · 2025 population'}</p></section>`;
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
  if(s?.kind==='combined-route')bindTubeSlide(slide.querySelector('[data-tube-slide]'),s,ja);
  const img=slide.querySelector('.w9-archive img,.w9-match-photo img');
  if(!img)return;
  const fallback=()=>{img.hidden=true;slide.querySelector('.w9-image-fallback').hidden=false;};
  img.addEventListener('error',fallback,{once:true});
  if(img.complete&&!img.naturalWidth)fallback();
}
