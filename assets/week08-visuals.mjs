/* Week 8: native type, paths, marks and classroom interactions. Photos are source art. */
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phaseNames=['Discover','Define','Develop','Deliver'];
const phaseJa=['探る','問いを絞る','試す','確かめて届ける'];
const phaseColors=['#ac3d4d','#b87b26','#52716c','#77618a'];
const points=[[190,450],[495,165],[800,450],[1105,165],[1410,450]];
const tag=(x,y,t,cls='',more='')=>`<text x="${x}" y="${y}" class="${cls}" ${more}>${e(t)}</text>`;
const svg=(s,label)=>`<svg viewBox="0 0 1600 900" role="img" aria-label="${e(label)}"><title>${e(label)}</title>${s}</svg>`;
function diamond(s,ja){
 const p=s.phase;let content=tag(100,104,'Double Diamond','w8-diagram-title')+tag(1495,104,'2004','w8-diagram-year','text-anchor="end"');
 const triangles=['190,450 495,165 495,735','495,165 800,450 495,735','800,450 1105,165 1105,735','1105,165 1410,450 1105,735'];
 for(let i=0;i<4;i++){
  const visible=i<p,active=i===p-1;
  content+=`<polygon class="w8-phase${visible?' is-revealed':''}${active?' is-active':''}" points="${triangles[i]}" fill="${visible?phaseColors[i]:'#e8e3d8'}" fill-opacity="${visible?(active?'.18':'.08'):'.35'}" stroke="${visible?phaseColors[i]:'#d4cdbf'}" stroke-width="${visible?'3':'2'}"/>`;
  if(visible){const cx=342+i*305,cy=i%2?540:375;
   // Branching strokes, then a convergent counterpart: abstract alternatives, not observations.
   for(let k=0;k<5;k++){const x=i%2?cx-105:cx+100,y=cy+(k-2)*42;
    content+=`<path d="M${i%2?x:cx-90} ${i%2?y:cy}L${i%2?cx+90:x} ${i%2?cy:y}" stroke="${phaseColors[i]}" stroke-width="2" opacity=".45"/><circle cx="${x}" cy="${y}" r="7" fill="${phaseColors[i]}"/>`;}
   content+=tag(cx,817,phaseNames[i],'w8-phase-name','text-anchor="middle"')+tag(cx,861,ja?phaseJa[i]:'','w8-phase-translation','text-anchor="middle"');
  }
 }
 content+=`<path d="M190 450 495 165 800 450 1105 165 1410 450 1105 735 800 450 495 735Z" fill="none" stroke="#b5aa98" stroke-width="2"/>`;
 if(s.iterate)content+=`<path id="w8-return-path" d="M1390 475C1470 820 1110 880 817 716C490 530 420 838 220 500" class="w8-return-path" fill="none" stroke="#ac3d4d" stroke-width="6" stroke-dasharray="10 12"/><path d="m216 500 7 33 25-25" fill="none" stroke="#ac3d4d" stroke-width="6"/><circle class="w8-return-traveller" r="12" fill="#ac3d4d"/>`;
 return `<div class="w8-diamond">${svg(content,`Double Diamond · ${p?phaseNames.slice(0,p).join(', '):'2004'}`)}${s.question?`<p class="w8-phase-question" style="color:${phaseColors[p-1]}">${e(s.question[ja?'ja':'en'])}</p>`:''}${s.iterate?`<button class="w8-replay" data-replay>${ja?'もう一度 ↶':'Replay ↶'}</button>`:''}</div>`;
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
 if(s.kind==='framework-cover')return `<a class="w8-cover" href="https://www.designcouncil.org.uk/resources/framework-for-innovation/" target="_blank" rel="noopener"><img src="${e(s.image)}" alt="${ja?'赤い額縁に入ったDesign CouncilのDouble Diamondポスター':'Design Council’s Double Diamond poster in a red frame'}"><h1>Framework<br>for Innovation</h1><span class="w8-credit">Design Council ↗</span></a>`;
 if(s.kind==='history-question')return `<div class="w8-history"><time>2003</time><h1>${e(tr(s.title))}</h1><p>Richard Eisermann · Design Council</p></div>`;
 if(s.kind==='diamond')return diamond(s,ja);
 if(s.kind==='schon')return `<div class="w8-schon"><div><time>1983</time><h1>${e(tr(s.title))}</h1>${ja?'<p class="w8-english">Reflection-in-action</p>':''}<p>Donald Schön</p></div><a href="${e(s.sources[1].href)}" target="_blank" rel="noopener"><img src="${e(s.image)}" alt="The Reflective Practitioner · Donald Schön"></a></div>`;
 if(s.kind==='feedback')return `<div class="w8-feedback"><div data-feedback-chart>${feedbackChart(data,1,ja)}</div><nav class="w8-loop" aria-label="${ja?'試作を切り替える':'Switch prototype'}">${[ja?'つくる':'Make',ja?'見せる':'Critique',ja?'つくり直す':'Revise'].map((t,i)=>`<button data-feedback="${i+1}" aria-pressed="${i===0}"><small>0${i+1}</small>${t}</button>${i<2?'<span aria-hidden="true">→</span>':''}`).join('')}<span class="w8-loop-return" aria-hidden="true">↶</span></nav><p data-feedback-caption>${ja?'まず、つくる。':'Make a first version.'}</p></div>`;
 if(s.kind==='xaviz')return `<a class="w8-xaviz" href="${e(s.href)}" target="_blank" rel="noopener" aria-label="XAVIZ"><h1>XAVIZ<span aria-hidden="true">↗</span></h1><img src="${e(s.image)}" alt="XAVIZ"></a>`;
 if(s.kind==='group-title')return `<div class="w8-group-title"><div class="w8-group-marks" aria-hidden="true">${[0,1,2,3].map((v)=>`<i style="--n:${v};--c:${phaseColors[v]}"></i>`).join('')}</div><h1>${e(tr(s.title))}</h1></div>`;
 if(s.kind==='ideas-native')return `<div class="w8-ideas"><h1>${e(tr(s.title))}</h1><span class="w8-ideas-number">2–3</span>${ideaCharts(data,ja)}<a href="${e(s.href)}">${ja?'先週の作品を見る':'Last week’s gallery'} ↗</a></div>`;
 if(s.kind==='combine')return `<div class="w8-combine"><h1>${e(tr(s.title))}</h1><svg viewBox="0 0 1400 520" aria-hidden="true">${[0,1,2].map(i=>`<path d="M100 ${100+i*150}C600 ${100+i*150} 500 250 900 250" fill="none" stroke="${phaseColors[i]}" stroke-width="8"/><circle cx="100" cy="${100+i*150}" r="22" fill="${phaseColors[i]}"/>`).join('')}<circle cx="950" cy="250" r="75" fill="#40392f"/><path d="m925 250 18 18 35-42" fill="none" stroke="#faf8f0" stroke-width="7"/></svg><p>${ja?'問い一つ。試作一つ。':'One question. One prototype.'}</p></div>`;
 if(s.kind==='studio-activity')return `<div class="w8-activity"><div class="w8-time">${s.duration}<small>min</small></div><div><h1>${e(tr(s.title))}</h1><ol>${tr(s.steps).map(t=>`<li>${e(t)}</li>`).join('')}</ol>${s.href?`<a href="${e(s.href)}">${ja?'先週の作品を見る':'Last week’s gallery'} ↗</a>`:''}</div></div>`;
 if(s.kind==='studio-timeline')return `<div class="w8-timeline"><h1>${e(tr(s.title))}</h1><div>${(ja?['試作を改善','中間発表','地図','ネットワーク','最終制作','最終発表']:['Refine','Midterm','Maps','Networks','Final studio','Final presentations']).map((t,i)=>`<p><span>W${i+9}</span><strong>${t}</strong></p>`).join('')}</div></div>`;
 if(s.kind==='studio-homework')return `<div class="w8-homework"><h1>${e(tr(s.title))}</h1><ul>${tr(s.steps).map(t=>`<li>${e(t)}</li>`).join('')}</ul><footer><a href="homework-submit.html?week=8">${ja?'宿題を提出':'Submit homework'} ↗</a><a href="${e(returnTo)}">${ja?'課題の説明':'Assignment details'} ↗</a><time>11.26 Thu · 23:59 JST</time></footer></div>`;
 return '';
}
export function bindWeek8(root,{s,data,ja}){
 if(s.kind==='feedback')root.querySelectorAll('[data-feedback]').forEach(b=>b.onclick=()=>{
  const n=Number(b.dataset.feedback);root.querySelector('[data-feedback-chart]').innerHTML=feedbackChart(data,n,ja);
  root.querySelectorAll('[data-feedback]').forEach(a=>a.setAttribute('aria-pressed',String(a===b)));
  root.querySelector('[data-feedback-caption]').textContent=(ja?['まず、つくる。','どこが読み取りにくい？','並べ替え、値を直接示す。']:['Make a first version.','What is difficult to read?','Sort the bars. Label the values.'])[n-1];
 });
 if(s.iterate){const replay=()=>{root.classList.remove('w8-playing');void root.offsetWidth;root.classList.add('w8-playing');};root.querySelector('[data-replay]').onclick=replay;replay();}
}
