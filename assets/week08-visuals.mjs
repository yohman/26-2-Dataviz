/* Week 8: native type, paths, marks and classroom interactions. Photos are source art. */
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phaseColors=['#ac3d4d','#b87b26','#52716c','#77618a'];
const tag=(x,y,t,cls='',more='')=>`<text x="${x}" y="${y}" class="${cls}" ${more}>${e(t)}</text>`;
const svg=(s,label)=>`<svg viewBox="0 0 1600 900" role="img" aria-label="${e(label)}"><title>${e(label)}</title>${s}</svg>`;
const returnArrows=[
 {path:'M1130 416C1112 296 959 296 925 403',seconds:.9,ja:'見せ方を試し直す。',en:'Try another way to show it.'},
 {path:'M729 416C680 68 240 68 188 390',seconds:1.25,ja:'問いを絞ったあとも、調べ直せる。',en:'A focused question can send you back to explore.'},
 {path:'M1270 558C1200 818 305 818 220 564',seconds:1.65,ja:'講評を受けて、問いに立ち返る。',en:'Feedback can send you back to the question.'}
];
function diamond(s,ja){
 const p=s.phase,red='#ac3d4d',gold='#b78631';
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
export function feedbackChart(data,state,ja){
 let rows=data.scatter.filter(r=>['Japan','India','China','Sweden','United States'].includes(r.country));
 if(state===3)rows.sort((a,b)=>b.life-a.life);
 const country=n=>ja?({Japan:'日本',India:'インド',China:'中国',Sweden:'スウェーデン','United States':'米国'}[n]):n;
 const x=v=>340+v/90*1030;let s=tag(120,120,ja?'平均寿命 · 2018年':'Life expectancy · 2018','w8-chart-title');
 for(let v=0;v<=80;v+=20)s+=`<path d="M${x(v)} 180V685" class="grid"/>`+tag(x(v),732,v,'axis-label','text-anchor="middle"');
 rows.forEach((r,i)=>{const y=205+i*96;s+=tag(310,y+35,country(r.country),'chart-label','text-anchor="end"')+`<rect x="340" y="${y}" width="${x(r.life)-340}" height="49" fill="${state===3?'#52716c':'#ac3d4d'}"/>`+(state===3?tag(x(r.life)+15,y+35,r.life,'chart-label'):'');});
 if(state===2)s+=`<g class="w8-critique-mark"><path d="M1280 205q90-60 125 20t-32 70" fill="none" stroke="#b87b26" stroke-width="5"/>${tag(1310,380,'?','w8-question-mark')}</g>`;
 return svg(s,ja?'選んだ5か国の平均寿命。単位：年。':'Life expectancy for five selected countries, in years.');
}
function ideaCharts(data,ja){
 const rows=data.scatter.filter(r=>['Japan','India','China','Sweden','United States'].includes(r.country));
 const dots=rows.map((r,i)=>`<circle cx="${100+Math.log10(r.income/1000)*160}" cy="${400-(r.life-60)*10}" r="${12+i*3}" fill="${phaseColors[i%4]}" opacity=".7"/>`).join('');
 const bars=rows.map((r,i)=>`<rect x="80" y="${85+i*58}" width="${r.life*3.7}" height="28" fill="${phaseColors[i%4]}" opacity=".8"/>`).join('');
 const paths=data.series.slice(0,3).map((r,i)=>`<path d="${r.points.filter(p=>Number.isFinite(p[1])).map(([year,v],j)=>`${j?'L':'M'}${60+(year-1950)*5.6} ${440-v*4.2}`).join(' ')}" fill="none" stroke="${phaseColors[i]}" stroke-width="4"/>`).join('');
 return `<div class="w8-idea-charts">${[dots,paths,bars].map((marks,i)=>`<div><svg viewBox="0 0 500 500" role="img" aria-label="${['Scatterplot','Line chart','Bar chart'][i]}"><path d="M60 60V450H450" fill="none" stroke="#cfc5b4"/>${marks}</svg></div>`).join('')}</div>`;
}
export function renderWeek8(s,{ja,data,returnTo}){
 const tr=v=>typeof v==='string'?v:v?.[ja?'ja':'en']||'';
 if(s.kind==='seam-preview')return `<img class="w8-seam-capture" src="${e(s.image)}" alt="${e(tr(s.alt))}" width="1080" height="2400">`;
 if(s.kind==='visual-thinking'){
  const title=`<h1 class="w8-visual-thinking-title" lang="en">${e(s.title.en)}</h1>`;
  return s.subtitle?`<div class="w8-visual-thinking-lockup" lang="en">${title}<p class="w8-visual-thinking-subtitle">${e(s.subtitle)}</p></div>`:title;
 }
 if(s.kind==='framework-cover')return `<a class="w8-cover" href="https://www.designcouncil.org.uk/resources/framework-for-innovation/" target="_blank" rel="noopener"><img src="${e(s.image)}" alt="${ja?'赤い額縁に入ったDesign CouncilのDouble Diamondポスター':'Design Council’s Double Diamond poster in a red frame'}"><h1>Framework<br>for Innovation</h1><span class="w8-credit">Design Council ↗</span></a>`;
 if(s.kind==='history-question')return `<div class="w8-history"><time>2003</time><h1>${e(tr(s.title))}</h1><p>Richard Eisermann · Design Council</p></div>`;
 if(s.kind==='diamond')return diamond(s,ja);
 if(s.kind==='framework-context')return `<div class="w8-framework-context"><h1>Framework for Innovation</h1><div class="w8-context-engagement"><strong>Engagement</strong><span>${ja?'人と関わり、共につくる':'Connect with people. Co-create.'}</span></div><div class="w8-context-core">${diamond({phase:4,feedbackCount:returnArrows.length},ja)}</div><div class="w8-context-principles"><h2>${ja?'デザインの原則':'Design principles'}</h2><p>${ja?'人を中心に · 視覚で共有 · 協働 · 反復':'People first · Visual communication · Collaboration · Iteration'}</p></div><div class="w8-context-methods"><h2>${ja?'使える方法':'Methods bank'}</h2><p>${ja?'探る · 形にする · つくる':'Explore · Shape · Build'}</p></div><div class="w8-context-leadership"><strong>Leadership</strong><span>${ja?'試せる環境をつくる':'Create the conditions to experiment.'}</span></div></div>`;
 if(s.kind==='schon')return `<div class="w8-schon"><div><time>1983</time><h1>${e(tr(s.title))}</h1>${ja?'<p class="w8-english">Reflection-in-action</p>':''}<p>Donald Schön</p></div><a href="${e(s.sources[1].href)}" target="_blank" rel="noopener"><img src="${e(s.image)}" alt="The Reflective Practitioner · Donald Schön"></a></div>`;
 if(s.kind==='feedback')return `<div class="w8-feedback"><div data-feedback-chart>${feedbackChart(data,1,ja)}</div><nav class="w8-loop" aria-label="${ja?'試作を切り替える':'Switch prototype'}">${[ja?'つくる':'Make',ja?'見せる':'Critique',ja?'つくり直す':'Revise'].map((t,i)=>`<button data-feedback="${i+1}" aria-pressed="${i===0}"><small>0${i+1}</small>${t}</button>${i<2?'<span aria-hidden="true">→</span>':''}`).join('')}<span class="w8-loop-return" aria-hidden="true">↶</span></nav><p data-feedback-caption>${ja?'まず、つくる。':'Make a first version.'}</p></div>`;
 if(s.kind==='xaviz')return `<a class="w8-xaviz" href="${e(s.href)}" target="_blank" rel="noopener" aria-label="XAVIZ"><h1>XAVIZ<span aria-hidden="true">↗</span></h1><img src="${e(s.image)}" alt="XAVIZ"></a>`;
 if(s.kind==='group-title')return `<div class="w8-group-title"><div class="w8-group-marks" aria-hidden="true">${[0,1,2,3].map((v)=>`<i style="--n:${v};--c:${phaseColors[v]}"></i>`).join('')}</div><h1>${e(tr(s.title))}</h1></div>`;
 if(s.kind==='ideas-native')return `<div class="w8-ideas"><h1>${e(tr(s.title))}</h1><span class="w8-ideas-number">2–3</span>${ideaCharts(data,ja)}<a href="${e(s.href)}">${ja?'先週の作品を見る':'Last week’s gallery'} ↗</a></div>`;
 if(s.kind==='combine')return `<div class="w8-combine"><h1>${e(tr(s.title))}</h1><svg viewBox="0 0 1400 520" aria-hidden="true">${[0,1,2].map(i=>`<path d="M100 ${100+i*150}C600 ${100+i*150} 500 250 900 250" fill="none" stroke="${phaseColors[i]}" stroke-width="8"/><circle cx="100" cy="${100+i*150}" r="22" fill="${phaseColors[i]}"/>`).join('')}<circle cx="950" cy="250" r="75" fill="#40392f"/><path d="m925 250 18 18 35-42" fill="none" stroke="#faf8f0" stroke-width="7"/></svg><p>${ja?'問い一つ。試作一つ。':'One question. One prototype.'}</p></div>`;
 if(s.kind==='studio-activity')return `<div class="w8-activity"><div class="w8-time">${s.duration}<small>min</small></div><div><h1>${e(tr(s.title))}</h1><ol>${tr(s.steps).map(t=>`<li>${e(t)}</li>`).join('')}</ol>${s.href?`<a href="${e(s.href)}">${ja?'先週の作品を見る':'Last week’s gallery'} ↗</a>`:''}</div></div>`;
 if(s.kind==='studio-timeline')return `<div class="w8-timeline"><h1>${e(tr(s.title))}</h1><div>${(ja?['A3の壁で講評','中間発表','地図','ネットワーク','最終制作','最終発表']:['A3 pin-up critique','Midterm','Maps','Networks','Final studio','Final presentations']).map((t,i)=>`<p><span>W${i+9}</span><strong>${t}</strong></p>`).join('')}</div></div>`;
 if(s.kind==='studio-homework')return `<div class="w8-homework w8-print-homework"><div class="w8-a3-sheet" aria-hidden="true"><b>A3</b><svg viewBox="0 0 220 170"><path d="M20 15V145H205" fill="none" stroke="#c7b8a2" stroke-width="2"/><path d="m25 120 40-25 35 10 30-55 35 10 30-35" fill="none" stroke="#ac3d4d" stroke-width="5"/></svg><span>11.27 · ${ja?'持参':'Bring to class'}</span></div><h1>${e(tr(s.title))}</h1><ul>${tr(s.steps).map(t=>`<li>${e(t)}</li>`).join('')}</ul><footer><a href="homework-submit.html?week=8">${ja?'宿題を提出':'Submit homework'} ↗</a><a href="${e(returnTo)}">${ja?'課題の説明':'Assignment details'} ↗</a><time>11.26 Thu · 23:59 JST</time></footer></div>`;
 return '';
}
export function bindWeek8(root,{s,data,ja}){
 if(s.kind==='feedback')root.querySelectorAll('[data-feedback]').forEach(b=>b.onclick=()=>{
  const n=Number(b.dataset.feedback);root.querySelector('[data-feedback-chart]').innerHTML=feedbackChart(data,n,ja);
  root.querySelectorAll('[data-feedback]').forEach(a=>a.setAttribute('aria-pressed',String(a===b)));
  root.querySelector('[data-feedback-caption]').textContent=(ja?['まず、つくる。','どこが読み取りにくい？','並べ替え、値を直接示す。']:['Make a first version.','What is difficult to read?','Sort the bars. Label the values.'])[n-1];
 });
 if(s.animateFeedback){
  const trace=root.querySelector('.w8-feedback-trace');
  root.querySelector('[data-replay]').onclick=()=>{
   trace.classList.remove('is-tracing');
   void trace.getBoundingClientRect();
   trace.classList.add('is-tracing');
  };
 }
}
