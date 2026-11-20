/* Week 8: native type, paths, marks and classroom interactions. Photos are source art. */
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Ink sampled from the archival plate used in the Du Bois sequence.
const plateInk={green:'#536c5c',blue:'#5b70a9',gold:'#e4b126',red:'#be3a4c'};
const phaseColors=[plateInk.green,plateInk.blue,plateInk.gold,plateInk.red];
export function safeSlideImage(value){
 if(typeof value!=='string'||value.length>2000||/[\s\\<>"']/.test(value))return '';
 if(/^assets\/images\/[a-z0-9_.\/-]+\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(value)&&!value.split('/').some(part=>!part||part==='.'||part==='..'))return value;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?value:'';}catch{return '';}
}
const tag=(x,y,t,cls='',more='')=>`<text x="${x}" y="${y}" class="${cls}" ${more}>${e(t)}</text>`;
const svg=(s,label)=>`<svg viewBox="0 0 1600 900" role="img" aria-label="${e(label)}"><title>${e(label)}</title>${s}</svg>`;
const returnArrows=[
 {path:'M1130 416C1112 296 959 296 925 403',seconds:.9,ja:'見せ方を試し直す。',en:'Try another way to show it.'},
 {path:'M729 416C680 68 240 68 188 390',seconds:1.25,ja:'問いを絞ったあとも、調べ直せる。',en:'A focused question can send you back to explore.'},
 {path:'M1270 558C1200 818 305 818 220 564',seconds:1.65,ja:'講評を受けて、問いに立ち返る。',en:'Feedback can send you back to the question.'}
];
function diamond(s,ja){
 const p=s.phase,{red,gold}=plateInk;
 const feedback=p===4?returnArrows.slice(0,s.feedbackCount??0):[];
 const active=s.animateFeedback?feedback.at(-1):null;
 const phaseLabels=['Discover','Define','Develop','Deliver'];
 const phaseTranslations=['探る','問いを決める','案をつくる','試して改善'];
 const edges=[[[190,450],[470,205],[470,695]],[[470,205],[750,450],[470,695]],[[750,450],[1030,205],[1030,695]],[[1030,205],[1310,450],[1030,695]]];
 let c=feedback.length?`<defs><marker id="w8-feedback-arrowhead" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 11 6 1 11Z" fill="${gold}"/></marker>${active?`<mask id="w8-feedback-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900"><path class="w8-feedback-trace is-tracing" style="--trace-duration:${active.seconds}s" d="${active.path}" pathLength="1" fill="none" stroke="white" stroke-width="66" stroke-linecap="round" stroke-dasharray="1 1"/></mask>`:''}</defs>`:'';
 c+=tag(80,85,'Double Diamond','w8-diagram-title')+tag(1520,85,'Design Council · 2004','w8-diagram-year','text-anchor="end"');
 // Same paired widening and narrowing as the source; the red edges carry the process.
 c+=`<path d="M190 450 470 205 750 450 1030 205 1310 450 1030 695 750 450 470 695Z" fill="none" stroke="#e6e0d5" stroke-width="4"/>`;
 c+=`<circle cx="88" cy="450" r="69" fill="#fff" stroke="${red}" stroke-width="4"/>`+tag(88,459,ja?'気になること':'Challenge','w8-endpoint','text-anchor="middle"');
 if(p>=1)c+=`<path d="M470 235V666" stroke="#bfc0c2" stroke-width="4" stroke-dasharray="16 18"/>`;
 if(p>=3)c+=`<path d="M1030 235V666" stroke="#bfc0c2" stroke-width="4" stroke-dasharray="16 18"/>`;
 const arrow=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,x=a[0]+dx*.59,y=a[1]+dy*.59;return `<path d="M${x+ux*17} ${y+uy*17}L${x-ux*12-uy*12} ${y-uy*12+ux*12}L${x-ux*12+uy*12} ${y-uy*12-ux*12}Z" fill="${red}"/>`;};
 for(let i=0;i<p;i++){
  const [a,b,d]=edges[i];
  const pairs=i%2?[[a,b],[d,b]]:[[a,b],[a,d]];
  c+=`<g class="w8-process-stage${i===p-1&&!feedback.length?' is-entering':''}" data-phase="${i+1}"><path d="${pairs.map(([from,to])=>`M${from.join(' ')}L${to.join(' ')}`).join(' ')}" fill="none" stroke="${red}" stroke-width="10" stroke-linejoin="miter"/>${pairs.map(([from,to])=>arrow(from,to)).join('')}`;
  c+=tag(330+i*280,455,ja?(i%2?'絞る':'広げる'):(i%2?'Focus':'Explore'),'w8-diverge-label','text-anchor="middle"');
  const x=330+i*280,y=535,rot=i%2?-41:41;
  c+=`<text x="${x}" y="${y}" text-anchor="middle" transform="rotate(${rot} ${x} ${y})" class="w8-source-phase-name">${phaseLabels[i]}</text>`;
  c+=tag(330+i*280,800,ja?phaseTranslations[i]:'','w8-source-translation','text-anchor="middle"')+'</g>';
 }
 c+=`<circle cx="750" cy="450" r="16" fill="#faf8f0"/>`;
 if(p>=4){
  c+=`<circle cx="1414" cy="450" r="69" fill="#fff" stroke="${red}" stroke-width="5"/>`+tag(1414,459,ja?'伝わる試作':'Prototype','w8-endpoint','text-anchor="middle"');
  for(const [i,arrow] of feedback.entries())c+=`<g${arrow===active?' mask="url(#w8-feedback-reveal)"':''}><path class="w8-source-feedback" data-return-arrow="${i+1}" d="${arrow.path}" fill="none" stroke="${gold}" stroke-width="5" stroke-dasharray="12 13" marker-end="url(#w8-feedback-arrowhead)"/></g>`;
 }
 const courseActions=ja?['データや、気になることを探す','みんなの案から、問いを一つ選ぶ','同じデータで、2〜3案をつくる','別のグループに見せて、改善する']:['Explore data and what matters to you','Choose one question together','Try 2–3 views of the same data','Show another group. Improve it.'];
 const caption=active?active[ja?'ja':'en']:(p?courseActions[p-1]:(ja?'広げる。絞る。もう一度。':'Open up. Focus. Again.'));
 return `<div class="w8-diamond w8-source-diamond">${svg(c,`Double Diamond · ${phaseLabels.slice(0,p).join(', ')}`)}<p class="w8-course-caption">${e(caption)}</p>${active?`<button class="w8-replay" data-replay>${ja?'もう一度 ↶':'Replay ↶'}</button>`:''}</div>`;
}
// Values transcribed from LOC ppmsca.33873. Ink colors sampled from the course scan.
const settlementCounts=[
 {en:'Cities over 10,000',ja:'1万人超の都市',count:78139,ink:plateInk.green},
 {en:'Cities of 5,000–10,000',ja:'5千〜1万人の都市',count:8025,ink:plateInk.blue},
 {en:'Cities of 2,500–5,000',ja:'2,500〜5千人の都市',count:37699,ink:plateInk.gold},
];
const countryAndVillages={en:'Country and villages',ja:'農村・村落',count:734952};
function reflectionMap(stage,ja){
 const phases=['Discover','Define','Develop','Deliver'];
 const translations=['探る','問いを決める','案をつくる','試して改善'];
 const active={data:0,draft:1,reveal:2,deliver:3}[stage];
 const points=['12,31 64,4 64,58','64,4 116,31 64,58','130,31 182,4 182,58','182,4 234,31 182,58'];
 const paths=points.map((p,i)=>`<polygon points="${p}"${i===active?' class="is-current"':''}/>`).join('');
 const labels=phases.map((phase,i)=>`<span${i===active?' aria-current="step"':''}>${phase}</span>`).join('');
 return `<div class="w8-reflection-map" role="group" aria-label="${ja?'ダブルダイヤモンド：':'Double Diamond: '}${ja?translations[active]:phases[active]}" data-phase="${phases[active]}"><svg viewBox="0 0 246 62" preserveAspectRatio="none" aria-hidden="true">${paths}</svg><div class="w8-reflection-map-labels" aria-hidden="true">${labels}</div></div>`;
}
function reflection(s,ja,tr){
 const title=e(tr(s.title)),n=value=>new Intl.NumberFormat(ja?'ja-JP':'en-US').format(value);
 const place=ja?'ジョージア州 · 1890年':'Georgia · 1890';
 if(s.stage==='data'){
  const rows=[...settlementCounts,countryAndVillages].map(row=>`<tr><th scope="row">${e(tr(row))}</th><td data-count="${row.count}">${n(row.count)}</td></tr>`).join('');
  return `<div class="w8-dubois-data"><p>${place}</p><h1>${title}</h1><table><thead><tr><th scope="col">${ja?'居住区分':'Settlement'}</th><th scope="col">${ja?'人数':'People'}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
 }
 if(s.stage==='draft'){
  const bars=settlementCounts.map((row,i)=>{
   const y=312+i*119,w=row.count/100000*800;
   return tag(450,y+37,tr(row),'w8-dubois-category','text-anchor="end"')+`<rect x="482" y="${y}" width="${w}" height="53" fill="${row.ink}" data-count="${row.count}"/>`+tag(505+w,y+37,n(row.count),'w8-dubois-value');
  }).join('');
  return `<div class="w8-dubois-draft"><p>${place}</p><h1>${title}</h1>${svg('<path d="M482 290V622" stroke="#9d907a" stroke-width="2"/>'+bars,ja?'ジョージア州の黒人人口、都市のみ。1890年。':'Black population of Georgia, cities only, 1890.')}</div>`;
 }
 if(s.stage==='deliver'){
  return `<figure class="w8-dubois-plate"><img src="${e(s.image)}" width="1751" height="2200" alt="${e(tr(s.alt))}" draggable="false"></figure>`;
 }
 const cityCount=settlementCounts.reduce((sum,row)=>sum+row.count,0);
 const ruralCount=countryAndVillages.count,share=ruralCount/(cityCount+ruralCount)*100;
 const rural=e(tr(countryAndVillages)),cities=ja?'都市':'Cities';
 return `<div class="w8-dubois-reveal" style="--rural-share:${share}%;--plate-green:${plateInk.green};--plate-red:${plateInk.red}"><p class="w8-dubois-place">${place}</p><h1>${title}</h1><strong class="w8-dubois-share">${share.toFixed(1)}%</strong><div class="w8-dubois-split" aria-hidden="true"></div><dl><div><dt>${cities}</dt><dd data-count="${cityCount}">${n(cityCount)}</dd></div><div><dt>${rural}</dt><dd data-count="${ruralCount}">${n(ruralCount)}</dd></div></dl></div>`;
}
function ideaCharts(data,ja){
 const rows=data.scatter.filter(r=>['Japan','India','China','Sweden','United States'].includes(r.country));
 const dots=rows.map((r,i)=>`<circle cx="${100+Math.log10(r.income/1000)*160}" cy="${400-(r.life-60)*10}" r="${12+i*3}" fill="${phaseColors[i%4]}"/>`).join('');
 const bars=rows.map((r,i)=>`<rect x="80" y="${85+i*58}" width="${r.life*3.7}" height="28" fill="${phaseColors[i%4]}"/>`).join('');
 const paths=data.series.slice(0,3).map((r,i)=>`<path d="${r.points.filter(p=>Number.isFinite(p[1])).map(([year,v],j)=>`${j?'L':'M'}${60+(year-1950)*5.6} ${440-v*4.2}`).join(' ')}" fill="none" stroke="${phaseColors[i]}" stroke-width="4"/>`).join('');
 return `<div class="w8-idea-charts">${[dots,paths,bars].map((marks,i)=>`<div><svg viewBox="0 0 500 500" role="img" aria-label="${['Scatterplot','Line chart','Bar chart'][i]}"><path d="M60 60V450H450" fill="none" stroke="#cfc5b4"/>${marks}</svg></div>`).join('')}</div>`;
}
export function renderWeek8(s,{ja,data,returnTo}){
 const tr=v=>typeof v==='string'?v:v?.[ja?'ja':'en']||'';
 if(s.content){
  const {layout,body,alt,image}=s.content;
  const url=safeSlideImage(image),media=url?`<img src="${e(url)}" alt="${e(tr(alt))}" draggable="false">`:'';
  if(layout==='figure')return `<figure class="w8-authored is-figure">${media}</figure>`;
  const heading=tr(s.title),copy=tr(body),compact=heading.length>(ja?18:36)||copy.length>(ja?126:285);
  return `<div class="w8-authored ${layout==='split'?'is-split':'is-type'}${compact?' is-compact':''}"><div class="w8-authored-copy"><h1>${e(heading)}</h1>${copy?`<p>${e(copy)}</p>`:''}</div>${layout==='split'?media:''}</div>`;
 }
 if(s.kind==='seam-preview')return `<div class="w8-seam-phone"><img class="w8-seam-capture" src="${e(s.image)}" alt="${e(tr(s.alt))}" width="1080" height="2400"></div>`;
 if(s.kind==='visual-thinking'){
  const title=`<h1 class="w8-visual-thinking-title" lang="en">${e(tr(s.title))}</h1>`;
  if(!s.subtitle)return title;
  const [lead,accent]=s.subtitle.split(/ (?=\S+$)/);
  return `<div class="w8-visual-thinking-lockup" lang="en">${title}<p class="w8-visual-thinking-subtitle">${e(lead)}${accent?` <strong>${e(accent)}</strong>`:''}</p></div>`;
 }
 if(s.kind==='framework-cover')return `<a class="w8-cover" href="https://www.designcouncil.org.uk/resources/framework-for-innovation/" target="_blank" rel="noopener"><img src="${e(s.image)}" alt="${ja?'赤い額縁に入ったDesign CouncilのDouble Diamondポスター':'Design Council’s Double Diamond poster in a red frame'}"><h1>Framework<br>for Innovation</h1><span class="w8-credit">Design Council ↗</span></a>`;
 if(s.kind==='history-question')return `<div class="w8-history"><time>2003</time><h1>${e(tr(s.title))}</h1><p>Richard Eisermann · Design Council</p></div>`;
 if(s.kind==='diamond')return diamond(s,ja);
 if(s.kind==='framework-context')return `<div class="w8-framework-context"><h1>Framework for Innovation</h1><div class="w8-context-engagement"><strong>Engagement</strong><span>${ja?'人と関わり、共につくる':'Connect with people. Co-create.'}</span></div><div class="w8-context-core">${diamond({phase:4,feedbackCount:returnArrows.length},ja)}</div><div class="w8-context-principles"><h2>${ja?'デザインの原則':'Design principles'}</h2><p>${ja?'人を中心に · 視覚で共有 · 協働 · 反復':'People first · Visual communication · Collaboration · Iteration'}</p></div><div class="w8-context-methods"><h2>${ja?'使える方法':'Methods bank'}</h2><p>${ja?'探る · 形にする · つくる':'Explore · Shape · Build'}</p></div><div class="w8-context-leadership"><strong>Leadership</strong><span>${ja?'試せる環境をつくる':'Create the conditions to experiment.'}</span></div></div>`;
 if(s.kind==='schon')return `<div class="w8-schon"><div><time>1983</time><h1>${e(tr(s.title))}</h1>${ja?'<p class="w8-english">Reflection-in-action</p>':''}<p>Donald Schön</p></div><a href="${e(s.sources[1].href)}" target="_blank" rel="noopener"><img src="${e(s.image)}" alt="The Reflective Practitioner · Donald Schön"></a></div>`;
 if(s.kind==='reflection')return reflection(s,ja,tr)+reflectionMap(s.stage,ja);
 if(s.kind==='xaviz')return `<a class="w8-xaviz" href="${e(s.href)}" target="_blank" rel="noopener" aria-label="XAVIZ"><h1>${e(tr(s.title))}<span aria-hidden="true">↗</span></h1><img src="${e(s.image)}" alt="XAVIZ"></a>`;
 if(s.kind==='group-title'){
  const mark=`<svg viewBox="0 0 900 256" aria-hidden="true"><path d="M14 26H308L430 128" fill="none" stroke="${plateInk.green}" stroke-width="29"/><path d="M14 128H430" fill="none" stroke="${plateInk.blue}" stroke-width="29"/><path d="M14 230H308L430 128" fill="none" stroke="${plateInk.gold}" stroke-width="29"/><path d="M430 128H886" stroke="${plateInk.red}" stroke-width="29"/></svg>`;
  return `<div class="w8-group-title">${mark}<h1>${e(tr(s.title))}</h1></div>`;
 }
 if(s.kind==='ideas-native')return `<div class="w8-ideas"><h1>${e(tr(s.title))}</h1><span class="w8-ideas-number">2–3</span>${ideaCharts(data,ja)}<a href="${e(s.href)}">${ja?'先週の作品を見る':'Last week’s gallery'} ↗</a></div>`;
 if(s.kind==='combine')return `<div class="w8-combine"><h1>${e(tr(s.title))}</h1><svg viewBox="0 0 1400 520" aria-hidden="true">${[0,1,2].map(i=>`<path d="M100 ${100+i*150}C600 ${100+i*150} 500 250 900 250" fill="none" stroke="${phaseColors[i]}" stroke-width="8"/><circle cx="100" cy="${100+i*150}" r="22" fill="${phaseColors[i]}"/>`).join('')}<circle cx="950" cy="250" r="75" fill="${plateInk.red}"/><path d="m925 250 18 18 35-42" fill="none" stroke="#faf8f0" stroke-width="7"/></svg><p>${e(tr(s.caption??{ja:'問い一つ。試作一つ。',en:'One question. One prototype.'}))}</p></div>`;
 if(s.kind==='studio-activity')return `<div class="w8-activity"><div class="w8-time">${s.duration}<small>min</small></div><div><h1>${e(tr(s.title))}</h1><ol>${tr(s.steps).map(t=>`<li>${e(t)}</li>`).join('')}</ol>${s.href?`<a href="${e(s.href)}">${ja?'先週の作品を見る':'Last week’s gallery'} ↗</a>`:''}</div></div>`;
 if(s.kind==='studio-timeline')return `<div class="w8-timeline"><h1>${e(tr(s.title))}</h1><div>${(ja?['スタジオ講評','中間発表','地図','ネットワーク','最終制作','最終発表']:['Studio critique','Midterm','Maps','Networks','Final studio','Final presentations']).map((t,i)=>`<p><span>W${i+9}</span><strong>${t}</strong></p>`).join('')}</div></div>`;
 if(s.kind==='studio-homework')return `<div class="w8-homework"><h1>${e(tr(s.title))}</h1><ul>${tr(s.steps).map(t=>`<li>${e(t)}</li>`).join('')}</ul><footer><a href="homework-submit.html?week=8">${ja?'宿題を提出':'Submit homework'} ↗</a><a href="${e(returnTo)}">${ja?'課題の説明':'Assignment details'} ↗</a><time datetime="2026-11-26T23:59:00+09:00">11.26 Thu · 23:59 JST</time></footer></div>`;
 return '';
}
export function bindWeek8(root,{s}){
 if(s.animateFeedback&&!s.content){
  const trace=root.querySelector('.w8-feedback-trace');
  root.querySelector('[data-replay]').onclick=()=>{
   trace.classList.remove('is-tracing');
   void trace.getBoundingClientRect();
   trace.classList.add('is-tracing');
  };
 }
}
