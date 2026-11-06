/* Alternative lenses over the same filtered submissions. No extra data requests. */
(() => {
 const themes = [
 ['sport','Sport','スポーツ',/sport|soccer|football|tennis|baseball|basketball|野球|サッカー|テニス|スポーツ|球団/i],
 ['music','Music','音楽',/music|song|artist|spotify|itunes|音楽|曲|歌手|アーティスト|ボカロ/i],
 ['life','Everyday life','日々の暮らし',/daily|personal|sleep|commut|日常|生活|睡眠|通学|バイト|自分|家族/i],
 ['world','World & society','世界と社会',/country|countries|population|inequal|poverty|income|gender|世界|人口|貧困|格差|所得|男女|社会/i],
 ['nature','Planet','地球・自然',/earthquake|climate|weather|temperature|rain|environment|地震|気温|天気|雨|環境|災害/i],
 ['culture','Play & culture','遊び・文化',/pokemon|game|anime|movie|film|ゲーム|ポケモン|映画|アニメ|ジブリ/i],
 ['health','Health','健康',/health|mortality|survival|life expectancy|健康|死亡|寿命|生存/i],
 ['money','Money & work','お金と仕事',/price|cost|salary|employment|workforce|econom|価格|値段|収入|賃金|労働|経済|物価/i],
 ['place','Places & journeys','場所・移動',/city|cities|travel|transport|train|touris|都市|旅行|交通|電車|駅|観光|都道府県/i]
 ];
 const palette=['#ae3f50','#ad772e','#52716a','#675777','#4c7c8a','#79804b','#b66542'];
 const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 const svgNode=(tag,attrs)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;};
 function subjectGroups(items){return themes.map(([id,en,ja,re])=>({id,en,ja,items:items.filter(i=>re.test(`${i.title||''} ${i.description||''}`))})).filter(g=>g.items.length);}
 function toolGraph(items,match){const groups=new Map(),edges=new Map();items.forEach(item=>{const names=match(item.tools).map(t=>t.name);names.forEach(name=>{if(!groups.has(name))groups.set(name,[]);groups.get(name).push(item);});names.forEach((a,i)=>names.slice(i+1).forEach(b=>{const key=[a,b].sort().join('|');edges.set(key,(edges.get(key)||0)+1);}));});return {groups:[...groups].map(([en,items])=>({id:en,en,ja:en,items})).sort((a,b)=>b.items.length-a.items.length),edges};}
 function wordGroups(items){
 const stop=new Set('the and for with from this that these those their they them was were are have has had into used use using data chart graph visualization visualisation visualized create created made make selected shows show also can one two more than each which about through between when then what how all some very first データ グラフ 可視化 こと もの ため よう それ これ ところ できる なる する した して あり ある いる ます ました から まで では です など 今回 自分 使用 作成 比較 分析 選択 表示 結果 分かる わかる 見える 可視 散布 同じ 発見 関係 驚き 変化 最初 特に 考え 見る 違い 高い 予想 使い 全体 感じ 以上 傾向 多く 強い 推移 最も 今回 選ん 分け 見せ 知る 分析 調べ 表現 示し 示す 使っ 思っ 思う 場合 内容 方法 目的 可能 必要 実際 大きく 小さく 多い 少ない 各国 使う わかり 理解 注目 でき なっ かっ だった 使 用い 異なる いう 行っ 得る 分ける 特徴 based different selected results found showing charts graphs plots plot analysis explore exploring compared comparison relationship used using visualise visualize visualising visualizing information dataset datasets'.split(' '));
 const terms=new Map();const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('ja',{granularity:'word'}):null;
 items.forEach(item=>{const text=`${item.title||''} ${item.description||''}`.normalize('NFKC').toLowerCase().replace(/https?:\/\/\S+/g,' ');const tokens=segmenter?[...segmenter.segment(text)].filter(s=>s.isWordLike).map(s=>s.segment):text.match(/[a-z]{3,}|[一-龯ァ-ヶ]{2,}/g)||[];
 new Set(tokens).forEach(term=>{if(stop.has(term)||term.length<2||/^\d+$/.test(term)||/^[ぁ-ん]+$/.test(term)||/^[a-z]{1,2}$/.test(term))return;if(!terms.has(term))terms.set(term,[]);terms.get(term).push(item);});});
 return [...terms].filter(([,list])=>list.length>=2).sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0])).slice(0,30).map(([en,items])=>({id:en,en,ja:en,items}));
 }
 window.galleryExploreModel={subjectGroups,toolGraph,wordGroups};
 window.renderGalleryExplore=({root,items,copy,url,image,matchTools,redraw})=>{
  let host=document.querySelector('[data-gallery-explore]');
  if(!host){host=node('section','','gallery-explore');host.dataset.galleryExplore='';root.before(host);}
  host.exploreCleanup?.();
  host.replaceChildren();
  let mode=new URLSearchParams(location.search).get('view')||'cards';
  if(!['cards','wall','subjects','words','tools'].includes(mode))mode='cards';
  const tabs=node('div','','explore-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',copy('Explore submissions','作品の見方'));
  const panel=node('div','','explore-panel');panel.id='gallery-explore-panel';
  const labels=[['cards','Cards','カード'],['wall','Image wall','作品の壁'],['subjects','Common threads','共通する関心'],['words','Language trails','言葉をたどる'],['tools','Tool connections','ツールのつながり']];
  const buttons=labels.map(([id,en,ja])=>{const b=node('button',copy(en,ja));b.type='button';b.setAttribute('role','tab');b.id=`explore-tab-${id}`;b.setAttribute('aria-controls',id==='cards'?'gallery-cards':'gallery-explore-panel');b.onclick=()=>{mode=id;const u=new URL(location.href);if(id==='cards')u.searchParams.delete('view');else u.searchParams.set('view',id);history.replaceState(null,'',u);redraw();document.getElementById(`explore-tab-${id}`)?.focus({preventScroll:true});};tabs.append(b);return b;});
  tabs.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let i=buttons.indexOf(document.activeElement);i=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:buttons.length-1))%buttons.length;buttons[i].focus();buttons[i].click();};
  root.id='gallery-cards';root.setAttribute('role','tabpanel');root.setAttribute('aria-labelledby','explore-tab-cards');host.append(tabs,panel);
  function workLink(item,wall=false){const a=node('a','',wall?'wall-work':'thread-work');a.href=url(item);a.setAttribute('aria-label',`${item.title||copy('Student work','学生作品')} · ${item.studentName||''}`);const media=node('div','','explore-media is-loading');const img=node('img');img.alt=item.title||copy('Student work','学生作品');img.loading='lazy';img.decoding='async';const direct=item.imageUrls?.[0]||item.imageUrl;if(direct)img.src=direct;else image(item,1).then(src=>{if(!a.isConnected)return;if(src)img.src=src;else img.onerror?.();}).catch(()=>img.onerror?.());img.onload=()=>media.classList.remove('is-loading');img.onerror=()=>{media.classList.remove('is-loading');media.classList.add('image-unavailable');img.remove();media.textContent=wall?'↗':copy('Open work','作品を開く');};media.append(img);const caption=node('div','','explore-caption');caption.append(node('strong',item.title||copy('Untitled','無題')),node('span',item.studentName||''));a.append(media);if(!wall)a.append(caption);return a;}
  function paint(){buttons.forEach((b,i)=>{const on=labels[i][0]===mode;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});root.hidden=mode!=='cards';panel.hidden=mode==='cards';panel.replaceChildren();panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',`explore-tab-${mode}`);if(mode==='cards')return;
   if(mode==='wall'){const wall=node('div','','image-wall');items.forEach(i=>wall.append(workLink(i,true)));panel.append(wall);return;}
   if(mode==='words'){
    panel.append(node('p',copy('Words that recur across different works—not repetitions within one text. Pick a word and follow the images behind it.','同じ文章の繰り返しではなく、別々の作品に登場する言葉。言葉を選んで、その先の作品へ。'),'explore-intro'));
    const terms=wordGroups(items),ledger=node('div','','word-ledger'),results=node('div','','word-results');const layout=node('div','','word-layout');
    if(!terms.length){panel.append(node('p',copy('No repeated terms in this selection yet.','この条件では共通する言葉がまだありません。')));return;}
    results.setAttribute('aria-live','polite');const choices=[];
    const wordControls=node('div','','word-explore-controls');const search=node('input');search.type='search';search.placeholder=copy('Find a word…','言葉を探す…');search.setAttribute('aria-label',copy('Find a recurring word','共通する言葉を探す'));const wander=node('button',copy('Take me somewhere','どこかへ、ひと跳び'));wander.type='button';wordControls.append(search,wander);panel.append(wordControls);
    search.oninput=()=>choices.forEach((b,i)=>{b.hidden=!terms[i].en.includes(search.value.toLowerCase().trim());});wander.onclick=()=>{const visible=choices.filter(b=>!b.hidden);visible[Math.floor(Math.random()*visible.length)]?.click();};
    terms.forEach((g,i)=>{const b=node('button','','word-trail');b.type='button';b.style.setProperty('--word-width',`${g.items.length/terms[0].items.length*100}%`);b.style.setProperty('--thread-color',palette[i%palette.length]);b.style.setProperty('--trail-offset',`${i%4*8}px`);b.append(node('span',g.en),node('small',String(g.items.length)));b.onclick=()=>{choices.forEach(n=>n.setAttribute('aria-pressed',String(n===b)));results.replaceChildren(node('h2',g.en));g.items.forEach((item,i)=>{const a=workLink(item);a.style.setProperty('--arrival',`${Math.min(i,7)*35}ms`);results.append(a);});};b.setAttribute('aria-pressed','false');choices.push(b);ledger.append(b);});layout.append(ledger,results);panel.append(layout);choices[0].click();panel.append(node('p',copy('Up to 30 recurring words, with common filler words removed. Japanese and English are counted separately; wording is not translated or inferred.','共通語を最大30語表示。一般的な補助語を除外。日英の語は別々に数え、翻訳・推測はしていません。'),'explore-method'));return;
   }
   const tools=mode==='tools';const model=tools?toolGraph(items,matchTools):null;const groups=tools?model.groups:subjectGroups(items);
   panel.append(node('p',tools?copy('A line joins tools named in the same submission. Thicker lines mean more shared works. Select a tool.','同じ作品で使われたツールを線で接続。太い線ほど共用された作品が多い。ツールを選んでみよう。'):copy('Shared subjects, traced through titles and descriptions in Japanese and English. Select a subject to discover the works behind it.','日英のタイトルと説明に登場する言葉から、共通する関心をたどる。テーマを選ぶと作品が見えます。'),'explore-intro'));
   if(!groups.length){panel.append(node('p',copy('No matching terms in these submissions yet.','この条件では共通する言葉がまだ見つかりません。')));return;}
   const layout=node('div','','explore-atlas');const graph=node('div','','thread-map floating-map');const svg=svgNode('svg',{viewBox:'0 0 900 650','aria-hidden':'true'});
   const points=groups.map((g,i)=>{const angle=i/groups.length*Math.PI*2-1.1;return {x:450+Math.cos(angle)*(160+i%3*45),y:325+Math.sin(angle)*(150+i%2*45),vx:0,vy:0};});
   const edges=[];
   groups.forEach((g,i)=>groups.slice(i+1).forEach((h,j)=>{const count=tools?model.edges.get([g.id,h.id].sort().join('|')):g.items.filter(item=>h.items.includes(item)).length;if(!count)return;const path=svgNode('path',{fill:'none',stroke:palette[i%palette.length],'stroke-width':Math.min(11,1+Math.sqrt(count)*1.7),'class':'floating-link'});const title=svgNode('title',{});title.textContent=`${copy(g.en,g.ja)} + ${copy(h.en,h.ja)} · ${count}`;path.append(title);svg.append(path);edges.push({a:i,b:i+j+1,count,path});}));graph.append(svg);
   const results=node('div','','thread-results');results.setAttribute('aria-live','polite');const groupButtons=[];let active=0,hovered=-1;
   function illuminate(index){const related=new Set([index]);edges.forEach(e=>{if(e.a===index)related.add(e.b);if(e.b===index)related.add(e.a);e.path.classList.toggle('is-lit',e.a===index||e.b===index);});groupButtons.forEach((b,i)=>b.classList.toggle('is-distant',index>=0&&!related.has(i)));}
   function select(g,index){active=index;groupButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));illuminate(index);results.replaceChildren(node('p',copy('FOLLOW THE CONNECTION','つながりをたどる'),'eyebrow'),node('h2',copy(g.en,g.ja)),node('p',copy(`${g.items.length} works`,`${g.items.length}点`),'thread-count'));
    const related=node('div','','thread-related');edges.filter(e=>e.a===index||e.b===index).sort((a,b)=>b.count-a.count).forEach(e=>{const target=e.a===index?e.b:e.a;const b=node('button',`${copy(groups[target].en,groups[target].ja)} · ${e.count}`);b.type='button';b.title=copy('Works shared with this connection','両方に共通する作品数');b.onclick=()=>select(groups[target],target);related.append(b);});results.append(related);g.items.forEach((item,i)=>{const link=workLink(item);link.style.setProperty('--arrival',`${Math.min(i,7)*35}ms`);results.append(link);});
   }
   let dragging=-1,moved=false;let paused=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
   groups.forEach((g,i)=>{const b=node('button','','thread-node');b.type='button';b.style.setProperty('--thread-color',palette[i%palette.length]);b.style.setProperty('--thread-size',`${Math.min(132,72+Math.sqrt(g.items.length)*8)}px`);b.append(node('strong',copy(g.en,g.ja)),node('span',String(g.items.length)));b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',copy(`${g.en}, ${g.items.length} works. Drag to move, select to explore.`,`${g.ja}、${g.items.length}点。ドラッグで移動、選択で作品を見る。`));b.onclick=e=>{if(!moved||e.detail===0)select(g,i);};
    b.onpointerenter=()=>{hovered=i;illuminate(i);};b.onpointerleave=()=>{hovered=-1;if(dragging<0)illuminate(active);};b.onfocus=()=>illuminate(i);b.onblur=()=>illuminate(active);
    let origin;
    function moveTo(e){const box=graph.getBoundingClientRect();points[i].x=Math.max(80,Math.min(820,(e.clientX-box.left)/box.width*900));points[i].y=Math.max(80,Math.min(570,(e.clientY-box.top)/box.height*650));points[i].vx=points[i].vy=0;draw();}
    b.onpointerdown=e=>{if(e.button!==0)return;dragging=i;moved=false;origin={x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId);b.classList.add('is-dragging');};
    b.onpointermove=e=>{if(dragging!==i)return;if(Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>4)moved=true;if(moved)moveTo(e);};
    const release=()=>{dragging=-1;b.classList.remove('is-dragging');illuminate(active);};b.onpointerup=release;b.onpointercancel=release;
    b.onkeydown=e=>{const delta={ArrowLeft:[-25,0],ArrowRight:[25,0],ArrowUp:[0,-25],ArrowDown:[0,25]}[e.key];if(!delta)return;e.preventDefault();points[i].x=Math.max(80,Math.min(820,points[i].x+delta[0]));points[i].y=Math.max(80,Math.min(570,points[i].y+delta[1]));points[i].vx=points[i].vy=0;draw();};
    groupButtons.push(b);graph.append(b);
   });
   const controls=node('div','','constellation-controls');const pause=node('button');pause.type='button';const scatter=node('button',copy('Stir the constellation','配置をゆらす'));scatter.type='button';
   const pauseLabel=()=>{pause.textContent=paused?copy('Resume motion','動きを再開'):copy('Pause motion','動きを止める');pause.setAttribute('aria-pressed',String(paused));};pauseLabel();pause.onclick=()=>{paused=!paused;pauseLabel();};scatter.onclick=()=>{points.forEach(p=>{p.x=130+Math.random()*640;p.y=100+Math.random()*450;p.vx=p.vy=0;});draw();};controls.append(node('span',copy('Drag a node. Follow a thread.','つかんで動かす。つながりをたどる。')),pause,scatter);
   layout.append(graph,results);panel.append(controls,layout);select(groups[0],0);
   function draw(){points.forEach((p,i)=>{groupButtons[i].style.left=`${p.x/9}%`;groupButtons[i].style.top=`${p.y/6.5}%`;});edges.forEach(e=>{const a=points[e.a],b=points[e.b];const bend=(e.a%2?1:-1)*18;e.path.setAttribute('d',`M ${a.x} ${a.y} Q ${(a.x+b.x)/2+bend} ${(a.y+b.y)/2-bend} ${b.x} ${b.y}`);});}
   let frame,visible=true,last=0,elapsed=0;
   function tick(now){if(!host.isConnected||!graph.isConnected)return;const dt=Math.min(2,(now-last)/16.67||1);last=now;
    if(!paused&&visible&&!document.hidden){elapsed+=dt;const radii=groupButtons.map(b=>b.offsetWidth/Math.max(1,graph.clientWidth)*450+12);
     for(let i=0;i<points.length;i++){const p=points[i];if(i===dragging)continue;p.vx+=(450-p.x)*.00055*dt+Math.sin(elapsed*.008+i*2.3)*.025*dt;p.vy+=(325-p.y)*.00055*dt+Math.cos(elapsed*.007+i*1.7)*.025*dt;
      for(let j=i+1;j<points.length;j++){const q=points[j],dx=q.x-p.x,dy=q.y-p.y,dist=Math.max(1,Math.hypot(dx,dy)),min=radii[i]+radii[j];const force=(dist<min?(min-dist)*.018:750/(dist*dist))*dt;const fx=dx/dist*force,fy=dy/dist*force;p.vx-=fx;p.vy-=fy;if(j!==dragging){q.vx+=fx;q.vy+=fy;}}
     }
     edges.forEach(e=>{const a=points[e.a],b=points[e.b],dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),target=210-Math.min(55,e.count*2),force=(d-target)*.00065*dt;const fx=dx/d*force,fy=dy/d*force;if(e.a!==dragging){a.vx+=fx;a.vy+=fy;}if(e.b!==dragging){b.vx-=fx;b.vy-=fy;}});
     points.forEach((p,i)=>{if(i===dragging)return;p.vx*=Math.pow(.93,dt);p.vy*=Math.pow(.93,dt);p.x=Math.max(radii[i]+12,Math.min(888-radii[i],p.x+p.vx*dt));p.y=Math.max(radii[i]+12,Math.min(638-radii[i],p.y+p.vy*dt));});draw();
    }frame=requestAnimationFrame(tick);
   }
   draw();frame=requestAnimationFrame(tick);const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;});observer.observe(graph);const onReduced=()=>{if(reduced.matches){paused=true;pauseLabel();}};reduced.addEventListener('change',onReduced);
   host.exploreCleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();reduced.removeEventListener('change',onReduced);host.exploreCleanup=null;};
   panel.append(node('p',tools?copy('Counts use the tools field only; unrecognised names are not included.','ツール欄の記載を集計。認識できない名称は含みません。'):copy('These are keyword matches, not AI classifications. Connections show overlapping submissions—not similarity scores.','キーワードによる分類です（AI判定ではありません）。線は同じ作品に登場した関心を示し、類似度ではありません。'),'explore-method'));
  }
  paint();
 };
})();
