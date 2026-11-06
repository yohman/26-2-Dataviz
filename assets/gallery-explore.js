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
  host.replaceChildren();
  let mode=new URLSearchParams(location.search).get('view')||'cards';
  if(!['cards','wall','subjects','words','tools'].includes(mode))mode='cards';
  const tabs=node('div','','explore-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',copy('Explore submissions','作品の見方'));
  const panel=node('div','','explore-panel');panel.id='gallery-explore-panel';
  const labels=[['cards','Cards','カード'],['wall','Image wall','作品の壁'],['subjects','Common threads','共通する関心'],['words','Language trails','言葉をたどる'],['tools','Tool connections','ツールのつながり']];
  const buttons=labels.map(([id,en,ja])=>{const b=node('button',copy(en,ja));b.type='button';b.setAttribute('role','tab');b.id=`explore-tab-${id}`;b.setAttribute('aria-controls',id==='cards'?'gallery-cards':'gallery-explore-panel');b.onclick=()=>{mode=id;const u=new URL(location.href);if(id==='cards')u.searchParams.delete('view');else u.searchParams.set('view',id);history.replaceState(null,'',u);redraw();document.getElementById(`explore-tab-${id}`)?.focus({preventScroll:true});};tabs.append(b);return b;});
  tabs.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let i=buttons.indexOf(document.activeElement);i=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:buttons.length-1))%buttons.length;buttons[i].focus();buttons[i].click();};
  root.id='gallery-cards';root.setAttribute('role','tabpanel');root.setAttribute('aria-labelledby','explore-tab-cards');host.append(tabs,panel);
  function workLink(item,wall=false){const a=node('a','',wall?'wall-work':'thread-work');a.href=url(item);const media=node('div','','explore-media is-loading');const img=node('img');img.alt=item.title||copy('Student work','学生作品');img.loading='lazy';img.decoding='async';const direct=item.imageUrls?.[0]||item.imageUrl;if(direct)img.src=direct;else image(item,1).then(src=>{if(a.isConnected&&src)img.src=src;}).catch(()=>{});img.onload=()=>media.classList.remove('is-loading');img.onerror=()=>{media.classList.remove('is-loading');media.classList.add('image-unavailable');img.remove();media.textContent=copy('Open work','作品を開く');};media.append(img);const caption=node('div','','explore-caption');caption.append(node('strong',item.title||copy('Untitled','無題')),node('span',item.studentName||''));a.append(media,caption);return a;}
  function paint(){buttons.forEach((b,i)=>{const on=labels[i][0]===mode;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});root.hidden=mode!=='cards';panel.hidden=mode==='cards';panel.replaceChildren();panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',`explore-tab-${mode}`);if(mode==='cards')return;
   if(mode==='wall'){panel.append(node('p',copy('A wall of perspectives. Open any work to look closer.','ひとつひとつ、違う視点。作品を開いて、じっくり見る。'),'explore-intro'));const wall=node('div','','image-wall');items.forEach(i=>wall.append(workLink(i,true)));panel.append(wall);return;}
   if(mode==='words'){
    panel.append(node('p',copy('Words that recur across different works—not repetitions within one text. Pick a word and follow the images behind it.','同じ文章の繰り返しではなく、別々の作品に登場する言葉。言葉を選んで、その先の作品へ。'),'explore-intro'));
    const terms=wordGroups(items),ledger=node('div','','word-ledger'),results=node('div','','word-results');const layout=node('div','','word-layout');
    if(!terms.length){panel.append(node('p',copy('No repeated terms in this selection yet.','この条件では共通する言葉がまだありません。')));return;}
    results.setAttribute('aria-live','polite');const choices=[];
    terms.forEach((g,i)=>{const b=node('button','','word-trail');b.type='button';b.style.setProperty('--word-width',`${g.items.length/terms[0].items.length*100}%`);b.style.setProperty('--thread-color',palette[i%palette.length]);b.append(node('span',g.en),node('small',String(g.items.length)));b.onclick=()=>{choices.forEach(n=>n.setAttribute('aria-pressed',String(n===b)));results.replaceChildren(node('h2',g.en));g.items.forEach(item=>results.append(workLink(item)));};b.setAttribute('aria-pressed','false');choices.push(b);ledger.append(b);});layout.append(ledger,results);panel.append(layout);choices[0].click();panel.append(node('p',copy('Up to 30 recurring words, with common filler words removed. Japanese and English are counted separately; wording is not translated or inferred.','共通語を最大30語表示。一般的な補助語を除外。日英の語は別々に数え、翻訳・推測はしていません。'),'explore-method'));return;
   }
   const tools=mode==='tools';const model=tools?toolGraph(items,matchTools):null;const groups=tools?model.groups:subjectGroups(items);
   panel.append(node('p',tools?copy('A line joins tools named in the same submission. Thicker lines mean more shared works. Select a tool.','同じ作品で使われたツールを線で接続。太い線ほど共用された作品が多い。ツールを選んでみよう。'):copy('Shared subjects, traced through titles and descriptions in Japanese and English. Select a subject to discover the works behind it.','日英のタイトルと説明に登場する言葉から、共通する関心をたどる。テーマを選ぶと作品が見えます。'),'explore-intro'));
   if(!groups.length){panel.append(node('p',copy('No matching terms in these submissions yet.','この条件では共通する言葉がまだ見つかりません。')));return;}
   const layout=node('div','','explore-atlas');const graph=node('div','','thread-map');const svg=svgNode('svg',{viewBox:'0 0 900 650','aria-hidden':'true'});const points=groups.map((g,i)=>{const angle=i/groups.length*Math.PI*2-Math.PI/2;return {x:450+Math.cos(angle)*310,y:325+Math.sin(angle)*230};});
   groups.forEach((g,i)=>groups.slice(i+1).forEach((h,j)=>{const count=tools?model.edges.get([g.id,h.id].sort().join('|')):g.items.filter(item=>h.items.includes(item)).length;if(!count)return;const a=points[i],b=points[i+j+1];svg.append(svgNode('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:palette[i%palette.length],'stroke-width':Math.min(15,1+Math.sqrt(count)*2),opacity:'.22'}));}));graph.append(svg);
   const results=node('div','','thread-results');results.setAttribute('aria-live','polite');const groupButtons=[];
   function select(g,index){groupButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));results.replaceChildren(node('p',copy('SELECTED THREAD','選んだつながり'),'eyebrow'),node('h2',copy(g.en,g.ja)),node('p',copy(`${g.items.length} works · a submission can belong to several threads.`,`${g.items.length}点 · ひとつの作品が複数のテーマに属することがあります。`),'thread-count'));g.items.forEach(item=>results.append(workLink(item)));}
   groups.forEach((g,i)=>{const b=node('button','','thread-node');b.type='button';b.style.left=`${points[i].x/9}%`;b.style.top=`${points[i].y/6.5}%`;b.style.setProperty('--thread-color',palette[i%palette.length]);b.style.setProperty('--thread-size',`${Math.min(132,72+Math.sqrt(g.items.length)*8)}px`);b.append(node('strong',copy(g.en,g.ja)),node('span',String(g.items.length)));b.onclick=()=>select(g,i);b.setAttribute('aria-pressed','false');groupButtons.push(b);graph.append(b);});
   layout.append(graph,results);panel.append(layout);select(groups[0],0);
   panel.append(node('p',tools?copy('Counts use the tools field only; unrecognised names are not included.','ツール欄の記載を集計。認識できない名称は含みません。'):copy('These are keyword matches, not AI classifications. Connections show overlapping submissions—not similarity scores.','キーワードによる分類です（AI判定ではありません）。線は同じ作品に登場した関心を示し、類似度ではありません。'),'explore-method'));
  }
  paint();
 };
})();
