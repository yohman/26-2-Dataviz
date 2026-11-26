import {clampSlide,scatterMarks,lineSegments,safeDeckReturn,studioDeckOpening} from './html-lecture-model.mjs?v=week9-beck-20261126';
import {renderWeek8,bindWeek8} from './week08-visuals.mjs?v=marker-20261120';
import {renderWeek9,bindWeek9} from './week09-visuals.mjs?v=beck-20261126';
const $=s=>document.querySelector(s),params=new URLSearchParams(location.search),stage=$('[data-stage]'),surface=$('[data-surface]'),slide=$('[data-slide]'),viewer=$('.html-deck');
const requestedWeek=Number(params.get('week')),week=[8,9].includes(requestedWeek)?requestedWeek:7;
const allowedReturn=safeDeckReturn(params.get('return'),week);
const returnParams=new URL(allowedReturn,location.href).searchParams;
const preview=['127.0.0.1','localhost','[::1]'].includes(location.hostname)||params.has('p')||returnParams.has('p');
const deckReturn=()=>week===9&&params.has('p')&&!returnParams.has('p')?'agenda.html?p#week-9':allowedReturn;
let lang='ja';try{lang=localStorage.getItem('dv-language')==='en'?'en':'ja';}catch{}
let deck,data,page=1,zoom=1,layoutFrame;
const tr=v=>typeof v==='string'?v:v?.[lang]||'',ja=()=>lang==='ja',esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),number=v=>new Intl.NumberFormat(lang).format(v);
const colors={Asia:'#b88631',Europe:'#64805c',Americas:'#ad3d50',Africa:'#85617d',Oceania:'#4e7d84'},countryColors=['#ad3d50','#b88631','#4e7d84','#64805c','#85617d'];
const names={Japan:'日本',India:'インド',China:'中国',Sweden:'スウェーデン','United States':'米国'},cn=n=>ja()?(names[n]||n):n;
const heading=(text,x=110,y=113)=>`<text class="chart-title" x="${x}" y="${y}">${esc(text)}</text>`;
const text=(x,y,value,cls='axis-label',extra='')=>`<text x="${x}" y="${y}" class="${cls}" ${extra}>${esc(value)}</text>`;
const svg=(content,label)=>`<svg viewBox="0 0 1600 900" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${content}</svg>`;
function scatter({mini=false}={}){
 const rows=scatterMarks(data.scatter),x=v=>160+(Math.log10(v)-2)/(Math.log10(200000)-2)*1270,y=v=>735-(v-40)/50*510,maxPop=Math.max(...rows.map(r=>r.population));let s=heading('2018');
 for(const v of [40,50,60,70,80,90])s+=`<path class="grid" d="M160 ${y(v)}H1430"/>`+text(130,y(v)+8,v,'axis-label','text-anchor="end"');
 for(const v of [100,1000,10000,100000])s+=text(x(v),778,number(v),'axis-label','text-anchor="middle"');
 s+=text(160,183,ja()?'平均寿命（年）':'Life expectancy (years)')+text(1430,825,ja()?'1人当たり所得 · 対数軸':'Income per person · log scale','axis-label','text-anchor="end"');
 for(const r of rows){const color=colors[r.region]||'#aaa49a',label=`${cn(r.country)} · ${r.life} · ${number(r.population)}`;s+=`<circle class="chart-mark" cx="${x(r.income)}" cy="${y(r.life)}" r="${Math.sqrt(r.population/maxPop)*62}" fill="${color}" fill-opacity=".55" stroke="${color}" stroke-width="1"${names[r.country]?' tabindex="0"':''} aria-label="${esc(label)}"><title>${esc(label)} · ${r.income}</title></circle>`;}
 for(const n of ['Japan','India','United States']){const r=rows.find(r=>r.country===n);if(r)s+=text(x(r.income)+14,y(r.life)-16,cn(n),'chart-label');}
 let lx=160;for(const [region,color] of Object.entries(colors)){s+=`<circle cx="${lx}" cy="862" r="6" fill="${color}"/>`+text(lx+17,870,region,'axis-label');lx+=200;}
 return svg(s,ja()?'2018年、所得と平均寿命。円の面積は人口。':'Income and life expectancy in 2018. Circle area represents population.');
}
function lineChart(){
 const x=v=>150+(v-1950)/68*1175,y=v=>740-v/90*500;let s=heading(ja()?'寿命の変化':'Life expectancy over time');
 for(const v of [0,20,40,60,80])s+=`<path class="grid" d="M150 ${y(v)}H1325"/>`+text(115,y(v)+8,v,'axis-label','text-anchor="end"');
 for(const v of [1950,1970,1990,2010,2018])s+=text(x(v),790,v,'axis-label','text-anchor="middle"');s+=text(150,200,ja()?'平均寿命（年）':'Life expectancy (years)');
 data.series.forEach((series,i)=>{const color=countryColors[i];for(const points of lineSegments(series.points))s+=`<path d="${points.map(([a,b],j)=>`${j?'L':'M'}${x(a)} ${y(b)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;s+=`<path d="M${150+i*260} 850h25" stroke="${color}" stroke-width="5"/>`+text(190+i*260,858,cn(series.country),'chart-label');});
 return svg(s,ja()?'5か国の平均寿命、1950〜2018年':'Life expectancy in five countries, 1950–2018');
}
function bars(){const rows=data.scatter.filter(r=>names[r.country]&&Number.isFinite(r.life)).sort((a,b)=>b.life-a.life);let s=heading(ja()?'2018年を比べる':'Comparing 2018');const x=v=>440+v/90*910;
 for(const v of [0,20,40,60,80])s+=text(x(v),785,v,'axis-label','text-anchor="middle"');
 rows.forEach((r,i)=>{const y=235+i*100;s+=text(395,y+36,cn(r.country),'chart-label','text-anchor="end"')+`<rect x="440" y="${y}" width="${x(r.life)-440}" height="49" fill="${colors[r.region]||'#85617d'}"/>`+text(x(r.life)+18,y+36,r.life,'chart-label');});s+=text(1350,845,ja()?'平均寿命（年） · 選んだ5か国':'Life expectancy (years) · five selected countries','axis-label','text-anchor="end"');return svg(s,ja()?'選んだ5か国の平均寿命、2018年':'Life expectancy in five selected countries, 2018');}
function table(headers,rows,classes=''){return `<table class="slide-table ${classes}"><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td${v===''?' class="missing-cell"':''}>${v===''?(ja()?'空欄':'blank'):esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
const layout=html=>`<div class="slide-layout">${html}</div>`;
function renderVisual(s){
 if(week===9)return renderWeek9(s,{ja:ja()});
 if(week===8)return renderWeek8(s,{ja:ja(),data,returnTo:deckReturn()});
 if(s.kind==='scatter')return scatter();if(s.kind==='line')return lineChart();if(s.kind==='bars')return bars();
 if(s.kind==='row'){const r=data.row;return layout(`<h1>${esc(tr(s.title))}</h1>${table(['Country','Year','Population','Region','Life<br>Expectancy'],[[r.Country,r.Year,number(Number(r.Population)),r.Region,r['Life Expectancy']]])}<p class="row-answer">${ja()?'日本 × 2018年':'Japan × 2018'}</p>`);}
 if(s.kind==='question')return layout(`<p class="topic">${ja()?'健康':'Health'}</p><h1>${esc(tr(s.title))}</h1><p class="question-fields">${ja()?'対象　　　 指標　　　 時間':'Population　　　 Measure　　　 Time'}</p>`);
 if(s.kind==='missing')return layout(`<h1>${esc(tr(s.title))}</h1>${table(['Country','Disaster Type','Start Year','Total Deaths'],data.disasterRows.map(r=>[r.Country,r['Disaster Type'],r['Start Year'],r['Total Deaths']]))}`);
 if(s.kind==='blank')return layout(`<p class="giant">${ja()?'空欄':'Blank'} <span>≠</span> 0</p><div class="blank-example"><span>Marshall Islands<br>Total Deaths: —</span><span>Tanzania<br>Total Deaths: 15</span></div>`);
 if(s.kind==='compare'){const a=data.sources.gapminder,b=data.sources.disasters;return layout(`<h1>${esc(tr(s.title))}</h1>${table(['','Gapminder','Disasters'],[[ja()?'期間':'Years',`${a.start}–${a.end}`,`${b.start}–${b.end}`],[ja()?'行数':'Rows',number(a.rows),number(b.rows)],[ja()?'列の例':'Example fields',ja()?'国・年・寿命・所得':'Country, year, life expectancy, income',ja()?'国・種類・時期・死亡者数':'Country, type, dates, deaths']])}<p class="dataset-note">${esc(tr(s.note))}</p>`);}
 if(s.kind==='criteria')return layout([ja()?'問い':'A question',ja()?'実データ':'Actual data',ja()?'みんなの関心':'Shared interest'].map(v=>`<p class="criteria-word">${v}</p>`).join(''));
 if(s.kind==='ideas')return `<div class="ideas-title">${esc(tr(s.title))}</div><div class="idea-triptych"><div>${lineChart()}<p>${ja()?'いつ変わった？':'When did it change?'}</p></div><div>${bars()}<p>${ja()?'どこが違う？':'Where does it differ?'}</p></div><div>${scatter()}<p>${ja()?'関係はある？':'Are they related?'}</p></div></div>`;
 if(s.kind==='timeline'){const titles=ja()?['データを選ぶ','案を持ち寄る','試して、改善','中間発表']:['Choose data','Combine ideas','Test & improve','Midterm'];return layout(`<h1>${esc(tr(s.title))}</h1><div class="project-path">${['11.13','11.20','11.27','12.04'].map((date,i)=>`<div><time>${date}</time><strong>${titles[i]}</strong><small>WEEK ${7+i}</small></div>`).join('')}</div>`);}
 if(s.kind==='brief'){const labels=ja()?['グループ・全員の名前','データ・出典リンク','1行の意味','最初の問い']:['Group & all members','Dataset & source link','Meaning of one row','A starting question'];return layout(`<h1>${esc(tr(s.title))}</h1><dl class="group-brief">${labels.map(v=>`<dt>${v}</dt><dd>　　　　　　　　　　　　　　　　　</dd>`).join('')}</dl>`);}
 if(s.kind.startsWith('activity'))return layout(`<h1>${esc(tr(s.title))}</h1><div class="activity-body"><div class="activity-clock">${s.duration}<small>min</small></div><ol>${tr(s.steps).map(v=>`<li>${esc(v)}</li>`).join('')}</ol></div>`);
 if(s.kind==='homework')return layout(`<div class="homework-number">2–3</div><h1>${esc(tr(s.title))}</h1><div class="homework-bottom"><ul>${tr(s.steps).map(v=>`<li>${esc(v)}</li>`).join('')}</ul><div class="homework-submit"><a href="homework-submit.html?week=7">${ja()?'宿題を提出する':'Submit homework'} ↗</a><br><a href="${esc(deckReturn())}">${ja()?'課題の説明':'Assignment details'} ↗</a><time datetime="2026-11-19T23:59:00+09:00">11.19 Thu · 23:59 JST</time></div></div>`);
 return '';
}
let viewportControl,ink;
function resize(reset=false){if(!deck)return;const fit=Math.min(stage.clientWidth/1600,stage.clientHeight/900);surface.style.width=`${1600*fit}px`;surface.style.height=`${900*fit}px`;slide.style.transform=`scale(${fit})`;viewportControl.layout(1600*fit,900*fit,{reset});ink.rendered(deck.slides[page-1].annotationPage??page);}
function render(value=page,{url=true}={}){
 if(!deck)return;const next=clampSlide(value,deck.slides.length),changed=next!==page;page=next;const s=deck.slides[page-1];ink.loading();slide.className=`html-slide slide-${s.kind}`;slide.dataset.slideId=s.id;slide.innerHTML=renderVisual(s);slide.setAttribute('aria-label',`${page}. ${tr(s.title)}`);if(week===8)bindWeek8(slide,{s,data,ja:ja()});if(week===9)bindWeek9(slide);surface.hidden=false;$('[data-loading]').hidden=true;resize(changed);
 $('[data-page-input]').value=page;$('[data-page-input]').max=deck.slides.length;$('[data-page-total]').textContent=`/ ${deck.slides.length}`;$('[data-previous]').disabled=page===1;$('[data-next]').disabled=page===deck.slides.length;
 document.documentElement.lang=lang;document.title=`Week ${week} · ${tr(deck.title)}`;$('[data-deck-title]').textContent=tr(deck.title);$('[data-back]').textContent=ja()?`← 第${week}週`:`← Week ${week}`;$('[data-back]').href=deckReturn();$('.wordmark').innerHTML=`<span>DV / 26–2</span> ${ja()?'データを見る':'Seeing Data'}`;$('[data-language-toggle]').textContent=ja()?'EN':'JP';$('[data-language-toggle]').setAttribute('aria-label',ja()?'Switch to English':'日本語に切り替える');
 const edit=$('[data-deck-edit]');
 if(edit&&week===8&&['127.0.0.1','localhost','[::1]'].includes(location.hostname)){
  edit.href=`http://127.0.0.1:8768/lecture-edit.html?slide=${encodeURIComponent(s.id)}`;
  edit.textContent=ja()?'スライドを編集':'Edit slides';edit.hidden=false;
 }
 $('[data-notes]').hidden=false;$('[data-notes-heading]').textContent=ja()?`スライドノート · ${page}`:`Slide notes · ${page}`;$('[data-notes-text]').textContent=tr(s.notes);$('[data-sources]').innerHTML=(s.sources||[]).map(source=>{const u=new URL(source.href,location.href),external=u.origin!==location.origin;return `<a href="${esc(u.href)}"${external?' target="_blank" rel="noopener"':''}>${esc(tr(source.label))} ↗</a>`;}).join('');
 const pageHref=(key,value)=>`?week=${week}&${key}=${encodeURIComponent(value)}&return=${encodeURIComponent(deckReturn())}`;
 const chapters=deck.chapters?.map(c=>({p:deck.slides.findIndex(s=>s.id===c.id)+1,label:tr(c.label)}))||[{p:1,label:ja()?'講義 · 20分':'Lecture · 20 min'},{p:13,label:ja()?'活動1':'Activity 1'},{p:14,label:ja()?'活動2':'Activity 2'},{p:15,label:ja()?'活動3':'Activity 3'},{p:16,label:ja()?'宿題':'Homework'}];
 $('[data-chapters]').innerHTML=chapters.map(c=>`<a href="${esc(pageHref('page',c.p))}" data-go="${c.p}" aria-current="${page===c.p}">${esc(c.label)}</a>`).join('');
 $('[data-toc-title]').textContent=ja()?'スライド一覧':'Slides';
 $('[data-toc-list]').innerHTML=deck.slides.map((s,i)=>`<a href="${esc(pageHref('slide',s.id))}" data-go="${i+1}" aria-current="${page===i+1}"><span>${String(i+1).padStart(2,'0')}</span>${esc(tr(s.title))}</a>`).join('');
 if(url){params.set('week',String(week));params.set('page',page);params.set('slide',s.id);history.replaceState(null,'',`${location.pathname}?${params}`);}
}
function fullscreen(active){viewer.classList.toggle('is-fullscreen',active);$('[data-fullscreen]').setAttribute('aria-pressed',String(active));requestAnimationFrame(()=>resize(true));}
async function toggleFullscreen(){const active=!viewer.classList.contains('is-fullscreen');fullscreen(active);try{if(active&&viewer.requestFullscreen)await viewer.requestFullscreen();else if(document.fullscreenElement)await document.exitFullscreen();}catch{/* CSS presentation mode remains available. */}}
async function start(){
 try{
  if(week===9&&!preview){
   const response=await fetch('content/weeks/09-studio-test-improve.md',{cache:'no-store'});
   if(!response.ok)throw new Error('Missing release time');
   const opening=studioDeckOpening(await response.text());
   if(!Number.isFinite(opening))throw new Error('Invalid release time');
   if(Date.now()<opening){
    const date=new Intl.DateTimeFormat(lang,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Asia/Tokyo'}).format(opening);
    $('[data-loading]').textContent=ja()?`第9週は ${date} JST に公開します。`:`Week 9 opens ${date} JST.`;
    $('[data-back]').href=deckReturn();
    return;
   }
  }
  const path=`content/slides/week${String(week).padStart(2,'0')}.json`;
  const load=async url=>{const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw new Error('Unavailable');return response.json();};
  [deck,data]=await Promise.all([load(path),week===9?null:load('data/week07-examples.json?v=20261112')]);
  if(week===9)for(const item of deck.slides.slice(1,3)){
   const img=new Image();img.referrerPolicy='no-referrer';img.src=item.image;
  }
  viewportControl=window.createSlideViewport({viewport:stage,surface,onChange:value=>{zoom=value;$('[data-zoom-level]').textContent=`${Math.round(value*100)}%`;}});
  ink=window.bindSlideAnnotations({surface,viewport:stage,toolbar:$('.pdf-toolbar'),file:`lectures/week${String(week).padStart(2,'0')}-html-v1`});
  viewer.classList.toggle('week8-deck',week===8);viewer.setAttribute('aria-label',`Week ${week} lecture`);
  const requested=deck.slides.findIndex(s=>s.id===params.get('slide'));render(requested>=0?requested+1:params.get('page'));new ResizeObserver(()=>{cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(()=>resize());}).observe(stage);
  window.installSlideSwipes(stage,{canSwipe:()=>stage.dataset.slideDrawing!=='true'&&zoom<=1.01&&stage.dataset.pinching!=='true'&&(window.visualViewport?.scale||1)<=1.01,next:()=>render(page+1),previous:()=>render(page-1)});
 }catch(error){console.error(error);$('[data-loading]').className='lecture-load-error';$('[data-loading]').textContent=ja()?'スライドを読み込めませんでした。再読み込みしてください。':'Could not load the slides. Please reload.';}
}
$('[data-previous]').onclick=()=>render(page-1);$('[data-next]').onclick=()=>render(page+1);$('[data-page-input]').onchange=e=>render(e.target.value);$('[data-page-input]').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();render(e.target.value);e.target.blur();}};$('[data-language-toggle]').onclick=()=>{lang=ja()?'en':'ja';try{localStorage.setItem('dv-language',lang);}catch{}render();};
$('[data-fullscreen]').onclick=toggleFullscreen;$('[data-zoom-in]').onclick=()=>viewportControl?.zoomTo(zoom*1.2);$('[data-zoom-out]').onclick=()=>viewportControl?.zoomTo(zoom/1.2);$('[data-zoom-reset]').onclick=()=>viewportControl?.fit();
$('[data-toc]').onclick=()=>{if($('[data-toc-dialog]').open)$('[data-toc-dialog]').close();else $('[data-toc-dialog]').showModal();};
$('[data-toc-close]').onclick=()=>$('[data-toc-dialog]').close();
$('[data-toc-list]').onclick=e=>{const a=e.target.closest('[data-go]');if(!a)return;e.preventDefault();$('[data-toc-dialog]').close();render(a.dataset.go);};
$('[data-chapters]').onclick=e=>{const a=e.target.closest('[data-go]');if(!a)return;e.preventDefault();render(a.dataset.go);};
document.addEventListener('fullscreenchange',()=>{fullscreen(Boolean(document.fullscreenElement));});
document.addEventListener('keydown',e=>{if($('[data-toc-dialog]').open)return;if(e.target.closest('input,textarea,select,[contenteditable="true"]')||e.isComposing||stage.dataset.slideDrawing==='true'||e.ctrlKey||e.metaKey||e.altKey||(e.target.closest('a,button,summary')&&[' ','Enter'].includes(e.key)))return;if(e.key.toLowerCase()==='c'){$('[data-toc-dialog]').showModal();return;}if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();render(page+1);}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();render(page-1);}if(e.key==='Home'){e.preventDefault();render(1);}if(e.key==='End'){e.preventDefault();render(deck?.slides.length||1);}if(e.key==='Escape')fullscreen(false);if(e.key.toLowerCase()==='f')toggleFullscreen();});
window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search),i=deck?.slides.findIndex(s=>s.id===p.get('slide'));render(i>=0?i+1:p.get('page'),{url:false});});
start();
