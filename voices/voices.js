import { openTextEntry } from './open-text.mjs';
import { createVoiceAtlas } from './voice-atlas.mjs?v=open-box-20261106b';
import { createArrivalTracker, captureLayout, animateArrivals, reducedMotion } from './arrival-motion.mjs';
const API='https://dataviz-gallery-likes.ykawano.workers.dev/voices';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const themes={money:['お金・生活費','Money & living costs','#ee7766'],education:['学校・教育','Education','#eac65d'],work:['仕事・時間','Work & time','#7dc28a'],identity:['偏見・差別','Bias & discrimination','#cea1c7'],access:['移動・アクセス','Access & mobility','#86c4c1'],environment:['環境・地域','Environment','#c0ce79'],care:['健康・ケア','Health & care','#eba378'],voice:['ルール・声','Rules & representation','#b5b9ea'],other:['その他','Other','#b7b6a3']};
const words={
brand:['声を、かたちに。','Make voices visible.'],eyebrow:['SMALL INJUSTICES. SHARED VOICES.','SMALL INJUSTICES. SHARED VOICES.'],hero:['それ、\nおかしくない？','Does that\nfeel fair?'],intro:['日常の「不公平」を持ち寄る。ひとりの声が、みんなの問いになる。','Bring the unfairness you notice. Let one person’s experience become a question we share.'],joinTitle:['声を届ける','Add your voice'],roomCode:['セッションコード','Session code'],join:['参加する →','Join →'],hostTitle:['みんなの声を集める','Bring people together'],sessionTitle:['セッション名','Session title'],create:['新しいセッションを作る','Create a session'],reuse:['授業・ワークショップ・対話の場で。セッションごとに声を分けられます。','For classes, workshops, and conversations. Every session keeps its own voices.'],demo:['デモを見る（架空の声）','Explore a demo (fictional voices)'],demoBanner:['デモ：架空の声です。実際の投稿ではありません。','DEMO · These voices are fictional, not participant submissions.'],invite:['参加リンク・QR','Invite / QR'],speak:['声を届ける ＋','Add your voice ＋'],host:['ホスト','HOST'],export:['CSVを書き出す','Export CSV'],hostLink:['ホスト用リンクを保存','Save private host link'],showHidden:['非表示の声も確認','Include hidden voices'],wall:['声の壁','Voice wall'],clusters:['集まる声','Clusters'],map:['不公平の地図','Impact map'],network:['つながり','Connections'],listen:['ひとつずつ聴く','Listen'],pause:['更新を一時停止','Pause updates'],resume:['更新を再開','Resume updates'],voices:['の声','voices'],themes:['何が気になる？','What matters here?'],themeNote:['テーマは投稿者が選択（最大2つ）。合計は投稿数を超えることがあります。','Themes are chosen by contributors, up to two each. Counts can exceed the number of voices.'],questionLabel:['この声から、次の問いへ。','From these voices, a new question.'],nextQuestion:['別の問い ↗','Another question ↗'],search:['声を検索','Search voices'],allThemes:['すべてのテーマ','All themes'],allVoices:['すべての声','All voices'],urgent:['切実な声（4–5）','High urgency (4–5)'],shared:['共感が集まる声（2以上）','Shared concern (2+ echoes)'],unheard:['まだ共感が付いていない声','No echoes yet'],changeLens:['変えたいことがある声','Hopes for change'],reset:['リセット','Reset'],notPoll:['これは参加した人の経験です。世論調査ではありません。大きな声だけが、大切な声とは限りません。','These are experiences from people who participated, not a representative poll. A small voice can matter just as much as a large one.'],course:['データ可視化の授業へ ↗','Data visualization course ↗'],footer:['ひとりの声 → 共通の問い → 変える一歩','One voice → a shared question → a step toward change'],yourVoice:['YOUR VOICE MATTERS','YOUR VOICE MATTERS'],formTitle:['何が、不公平だと思う？','What feels unfair?'],privacy:['匿名で画面に公開されます。人の名前・連絡先・個人が特定される情報は書かないでください。身近な小さなことでもOK。','Your response appears publicly on screen without your name. Leave out names, contact details, and identifying information. Small everyday experiences count.'],headline:['ひとことで','In a few words'],detail:['何が起きている？（任意）','What is happening? (optional)'],chooseThemes:['関係するテーマ（1〜2つ）','Choose one or two themes'],reach:['誰に関わる？','Who does it affect?'],me:['主に自分','Mostly me'],community:['身近な人・地域','My community'],society:['社会全体','Wider society'],urgency:['自分にとっての切実さ','How urgent does it feel to you?'],low:['気になる','It bothers me'],high:['放っておけない','It cannot wait'],change:['どう変わってほしい？（任意）','What would you like to change? (optional)'],submit:['この声を届ける →','Send my voice →'],hope:['こう変わってほしい','A hope for change'],joinUrl:['参加リンク','Participation link'],copy:['リンクをコピー','Copy link'],shareNote:['このリンクを配布するか、QRコードを投影してください。','Share this link or project the QR code.'],emptyTitle:['まだ、声は届いていません。','The first voice is still to come.'],emptyText:['QRコードで参加して、身近な「不公平」をひとつ。小さなことでも、ここから。','Join through the QR code and share one thing that feels unfair. It can start small.'],noMatch:['この条件に合う声はありません。','No voices match these filters.'],loading:['声を読み込んでいます…','Loading voices…'],live:['ライブ · 届いた声を更新中','Live · new voices appear automatically'],paused:['更新を一時停止中。投稿の受付は続いています。','Display paused. People can still submit.'],offline:['接続を確認中。表示中の声を保持しています。','Reconnecting. Previously loaded voices remain visible.'],retry:['再接続','Reconnect'],closed:['受付は終了しています。届いた声は引き続き見られます。','Submissions are closed. You can still explore the voices.'],openIntake:['受付を再開','Reopen submissions'],closeIntake:['投稿の受付を閉じる','Close submissions'],echo:['私もそう思う','I feel this too'],echoed:['共感しています ✓','This resonates with me ✓'],echoCount:['共感','echoes'],hide:['画面から非表示にする','Hide from the wall'],restore:['表示を戻す','Restore to wall'],saved:['届きました。あなたの声が画面に加わります。','Your voice is on its way to the wall. Thank you.'],another:['もうひとつの声を届ける','Add another voice'],posting:['届けています…','Sending…'],chooseError:['テーマを1〜2つ選んでください。','Choose one or two themes.'],networkEmpty:['2つのテーマを選んだ投稿が届くと、つながりが見えます。','Connections appear when a voice belongs to two themes.'],hostSecret:['このホスト用リンクは、あなただけで保管してください。公開用ではありません。','Keep this host link private. It grants session controls.'],copyDone:['コピーしました。','Copied.'],error:['通信できませんでした。少し待って再度お試しください。','Could not connect. Please try again shortly.'],badRoom:['セッションが見つかりません。コードをご確認ください。','Session not found. Please check the code.'],needStorage:['この操作にはブラウザの保存機能が必要です。プライベートモードの設定をご確認ください。','Browser storage is needed for this action. Please check your private browsing settings.']};
Object.assign(words,{
  intro:['その違和感を、黙らせない。','Don’t swallow what feels unfair.'],
  joinTitle:['声を残す ↗','Leave a voice ↗'],hostTitle:['場をひらく','Open a space'],
  speak:['声を残す ＋','Leave a voice ＋'],invite:['招く ↗','Invite ↗'],
  demo:['声のうねりを体験する（デモ）↗','Step into the voices (demo) ↗'],
  demoBanner:['DEMO / 架空の声の風景です','DEMO / A landscape of fictional voices'],
  wander:['歩く','Wander'],threads:['つながる','Threads'],listen:['聴く','Listen'],
  tour:['散歩する ↗','Let it wander ↗'],tourStop:['ここで立ち止まる','Stay here'],
  findPath:['別の道を探す。','Find another path.'],moreViews:['別の見え方','Other ways of seeing'],
  readSpace:['この空間の読み方','Reading this space'],toolsTitle:['場の道具','Tools for this space'],
  live:['声が届く場所','Listening, live'],paused:['ひと息 / 声は受付中','Paused · still accepting voices'],
  wall:['一覧で読む','Read all voices'],network:['テーマの関係','Theme relationships']
});
const captions={wall:['一人ひとりの言葉。大きさは本人の切実さ、色は最初に選んだテーマ。','Each person’s words. Text size represents self-reported urgency; color represents their first theme.'],clusters:['共通のテーマで集まる声。円をクリックすると、その声を聴けます。','Voices gather around their first theme. Select a circle to listen to its story.'],map:['横：影響する範囲。縦：本人の切実さ。少しずらした位置に意味はありません。','Horizontal: perceived reach. Vertical: self-reported urgency. Small offsets only prevent overlap.'],network:['投稿者が選んだ2つのテーマを結ぶ。同じ投稿に現れるテーマの関係。','Links join the two themes a contributor selected. They show co-occurrence, not causation.'],listen:['ひとつの声を、急がずに。','One voice at a time. Let it land.']};
const keys={wall:['色＝テーマ · 文字の大きさ＝切実さ1〜5 · ↗＝共感した人数（このブラウザで各声に1回）','Color = theme · text size = urgency 1–5 · ↗ = echoes (one per voice per browser)'],clusters:['色＝最初のテーマ · 円の面積＝1＋共感数 · 点線＝このブラウザで共感 · 距離＝テーマごとの配置（測定値ではありません）','Color = first theme · circle area = 1 + echoes · dashed ring = your echo · distance organizes themes; it is not a measured value'],map:['色＝最初のテーマ · 円の面積＝1＋共感数 · 切実さ・範囲は投稿者の自己評価','Color = first theme · circle area = 1 + echoes · urgency and reach are self-reported'],network:['円の面積＝テーマへの投稿数 · 線の太さ＝その組み合わせの投稿数 · 距離＝見やすさのための配置','Node area = theme mentions · line width = voices sharing that pair · distances are for layout only'],listen:['「私もそう思う」は支持の大きさではなく、この場での共感の数です。','Echoes express resonance in this session, not a vote on whose experience matters.']};
Object.assign(captions,{
  wander:['言葉の風景を、ドラッグして歩く。声を選ぶと、その経験が開きます。','Drag to wander through the words. Select a voice to read the experience behind it.'],
  threads:['共通のテーマを選んだ声に、道が生まれます。','Paths connect voices whose contributors selected a shared theme.']
});
Object.assign(keys,{
  wander:['文字の大きさ＝本人の切実さ。色＝最初に選んだテーマ。切実さ5の声は文字にも色を使います。自由記述の声には分類や評価を付けず、標準サイズで表示します。空間は地理や統計的距離ではありません。','Type size represents self-reported urgency. Color identifies the first chosen theme; urgency-5 headlines also carry that color. Open-text voices have no assigned theme or rating and use a standard type size. Space is a composition, not geographic or statistical distance.'],
  threads:['線は、共通のテーマを選んだ声どうしを結びます。読みやすさのため近くの関係を一部表示。意味をAIで推測した線ではありません。','Lines connect voices sharing a participant-chosen theme. A selection of nearby relationships is shown for legibility; no AI-inferred relationships are used.']
});
const questions=[['これは「不便」？ それとも「不公平」？ 違いは何だろう。','Is this an inconvenience or an injustice? What makes the difference?'],['誰には見えていて、誰には見えていない？','Who can see this problem, and who cannot?'],['この声を裏づけるデータは、どこにありそう？','What data could help investigate this experience?'],['ここに参加していない人の声は、何だろう。','Whose experience is missing from this room?'],['ひとつ変えられるなら、何から始める？','If one thing could change, where would we start?'],['同じルールなのに、違う影響を受ける人は？','Who is affected differently by the same rule?']];
let lang='ja';try{lang=localStorage.getItem('voices-language')||localStorage.getItem('dv-language')||'ja';}catch{}if(!['ja','en'].includes(lang))lang='ja';
const t=k=>words[k]?.[lang==='ja'?0:1]??k, tn=k=>themes[k]?.[lang==='ja'?0:1]||k;
const setText=(el,value)=>{if(el)el.textContent=value;};
let code=new URLSearchParams(location.search).get('room')||'', demo=new URLSearchParams(location.search).has('demo');
let entries=[], room=null, revision=null, view='wander', paused=false, loaded=false, isHost=false, hostKey='', busy=false, selected=null, question=0, listenIndex=0, auto=false, simulation=null, failed=false;
const arrivals=createArrivalTracker(), clusterPositions=new Map();
let atlas=null;
let arriving=new Set(), noticeTimer;
function announce(ids){
  if(!ids.length)return;
  const fresh=entries.filter(e=>ids.includes(e.id)&&!e.hidden), shown=filtered().filter(e=>ids.includes(e.id));
  if(!fresh.length)return;
  const newest=shown.at(-1), notice=$('#arrival-notice');
  setText($('#arrival-label'),lang==='ja'?`＋${fresh.length} 新しい声${shown.length===fresh.length?'':` · この表示では${shown.length}件`}`:`＋${fresh.length} new ${fresh.length===1?'voice':'voices'}${shown.length===fresh.length?'':` · ${shown.length} in this view`}`);
  setText($('#arrival-voice'),newest?.headline||(lang==='ja'?'ほかのテーマに、新しい声が届きました。':'A new voice arrived in another theme.'));
  $('#arrival-voice').disabled=!newest;$('#arrival-voice').onclick=()=>newest&&openDetail(newest);
  notice.hidden=false;
  if(!reducedMotion())notice.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'});
  clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{notice.hidden=true;},6500);
}
let browser='';try{browser=localStorage.getItem('voices-browser')||crypto.randomUUID();localStorage.setItem('voices-browser',browser);}catch{browser=crypto.randomUUID();}
const safeStore=(key,value)=>{try{localStorage.setItem(key,value);return true;}catch{return false;}};
function hostKeys(){try{return JSON.parse(localStorage.getItem('voices-hosts')||'{}');}catch{return {};}}
const link=(mode='join')=>{const u=new URL(['localhost','127.0.0.1'].includes(location.hostname)?'https://yohman.github.io/26-2-Dataviz/voices/':'./',location.href);u.searchParams.set('room',code);if(mode==='join')u.searchParams.set('join','1');return u.href;};
async function api(method='GET',body=null,query='') {
  const response=await fetch(`${API}${code?`?room=${code}`:''}${query?`${code?'&':'?'}${query}`:''}`,{method,headers:{'Content-Type':'application/json','X-Browser-ID':browser,...(hostKey?{'X-Host-Key':hostKey}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000),cache:'no-store'});
  const data=await response.json();if(!response.ok){const e=new Error(data.error);e.status=response.status;throw e;}return data;
}
function language(){
  document.documentElement.lang=lang;document.title=lang==='ja'?'声を、かたちに。 · Voices for Justice':'Voices for Justice';
  $$('[data-i]').forEach(el=>setText(el,t(el.dataset.i)));$('#language').textContent=lang==='ja'?'EN':'日本語';$('#search').placeholder=t('search');$('#voice-text').placeholder=lang==='ja'?'ここに、自由に書いてください。':'Write freely here.';
  const filter=$('#theme-filter').value;$('#theme-filter').replaceChildren(new Option(t('allThemes'),'all'),...Object.keys(themes).map(k=>new Option(tn(k),k)));$('#theme-filter').value=filter||'all';
  setText($('#discussion'),questions[question][lang==='ja'?0:1]);setText($('#pause'),t(paused?'resume':'pause'));if(room){updateRoom();render();}savedRooms();if(selected)renderDetail();
}
function savedRooms(){const root=$('#saved-rooms');root.replaceChildren();for(const [k,v] of Object.entries(hostKeys())){const a=document.createElement('a');a.href=`?room=${k}`;a.textContent=`↗ ${v.title}`;a.style.display='block';a.style.margin='10px 0';root.append(a);}}
function updateRoom(){setText($('#room-title'),room.title);setText($('#room-label'),`VOICES FOR JUSTICE / ${code.toUpperCase()}`);$('#host-tools').hidden=!isHost;$('#demo-banner').hidden=!demo;$('#demo-arrival').hidden=!demo;setText($('#demo-arrival'),lang==='ja'?'＋ デモの声を1つ追加':'＋ Add a demo voice');setText($('#close-session'),t(room.open?'closeIntake':'openIntake'));$('#contribute').disabled=!room.open;connection();}
function connection(){setText($('#connection'),demo?t('demoBanner'):failed?t('offline'):paused?t('paused'):!room?.open?t('closed'):t('live'));$('#connection').classList.toggle('error',failed);}
async function load(force=false){
  if(demo||busy||paused&&!force)return;busy=true;
  try{
    let data=await api('GET',null,!force&&revision!==null?`revision=${revision}`:'');
    room=data.room;isHost=data.host;
    if(!data.unchanged){let all=data.items;const snapshotRevision=data.room.revision;while(data.nextCursor){data=await api('GET',null,`cursor=${data.nextCursor}`);all.push(...data.items);}entries=all;revision=data.room.revision===snapshotRevision?snapshotRevision:null;loaded=true;const fresh=arrivals.update(entries);render(fresh);announce(fresh);}
    failed=false;updateRoom();if(selected){selected=entries.find(e=>e.id===selected.id);if(selected)renderDetail();else $('#detail-dialog').close();}
  }catch(e){failed=true;connection();if(e.status===404){setText($('#room-title'),t('badRoom'));}if(!loaded)render();}finally{busy=false;}
}
function filtered(){const q=$('#search').value.trim().toLocaleLowerCase(),cat=$('#theme-filter').value,lens=$('#lens').value;return entries.filter(e=>(!e.hidden||isHost&&$('#show-hidden').checked)&&(!q||[e.headline,e.detail,e.change,...e.categories.map(tn)].join(' ').toLocaleLowerCase().includes(q))&&(cat==='all'||e.categories.includes(cat))&&(lens==='all'||lens==='urgent'&&e.urgency>=4||lens==='shared'&&e.resonance>=2||lens==='unheard'&&!e.resonance||lens==='change'&&e.change));}
const tone=e=>themes[e.categories[0]]?.[2]||'#eac65d';
function render(newIds=[]){
  arriving=new Set(newIds);
  const previousLayout=captureLayout($('#visual'));
  if(!room)return;const items=filtered(),visible=entries.filter(e=>!e.hidden);setText($('#total'),loaded?visible.length:'—');setText($('#visible-count'),loaded?`${items.length} / ${visible.length}`:'');
  const rated=visible.filter(e=>Number.isInteger(e.urgency)&&e.urgency>0),urgent=rated.filter(e=>e.urgency>=4).length,hopes=visible.filter(e=>e.change).length;
  setText($('#insight-summary'),!loaded?t('loading'):lang==='ja'?`自由記述の声は、分類・評価なしでそのまま表示します。${rated.length?`以前の評価付き投稿：${rated.length}件（切実さ4–5：${urgent}件）。`:''}`:`Open-text voices appear without assigned themes or ratings.${rated.length?` Earlier rated submissions: ${rated.length} (${urgent} high urgency).`:''}`);
  const max=Math.max(1,...Object.keys(themes).map(k=>visible.filter(e=>e.categories.includes(k)).length));$('#theme-bars').replaceChildren();
  Object.keys(themes).forEach(k=>{const n=visible.filter(e=>e.categories.includes(k)).length,b=document.createElement('button');b.type='button';b.className='theme-bar';b.style.setProperty('--tone',themes[k][2]);b.setAttribute('aria-pressed',String($('#theme-filter').value===k));const s=document.createElement('span'),count=document.createElement('b');s.append(document.createTextNode(tn(k)));count.textContent=loaded?n:'—';s.append(count);const track=document.createElement('i'),bar=document.createElement('b');bar.style.width=`${n/max*100}%`;track.append(bar);b.append(s,track);b.onclick=()=>{$('#theme-filter').value=$('#theme-filter').value===k?'all':k;render();atlas?.home();};$('#theme-bars').append(b);});
  setText($('#view-caption'),captions[view][lang==='ja'?0:1]);setText($('#visual-key'),keys[view][lang==='ja'?0:1]);simulation?.stop();
  const wandering=view==='wander'||view==='threads',root=$('#visual');
  root.hidden=wandering;$('#scene').hidden=!wandering;
  $('#tour').hidden=!wandering;['atlas-out','atlas-home','atlas-in'].forEach(id=>$('#'+id).hidden=!wandering);
  setText($('#wander-hint'),wandering?(lang==='ja'?'ドラッグして歩く。声に触れる。':'Drag to wander. Touch a voice.'):'');
  if(wandering){
    if(!atlas&&window.d3)atlas=createVoiceAtlas($('#scene'),{themes,openVoice:openDetail,language:()=>lang,onTourChange:active=>{setText($('#tour'),t(active?'tourStop':'tour'));$('#tour').setAttribute('aria-pressed',String(active));}});
    atlas?.update(items,{arrivals:newIds,mode:view,loading:!loaded,failed,total:visible.length});atlas?.pause(paused);
    $('#tour').disabled=reducedMotion();return;
  }
  atlas?.pause(true);root.replaceChildren();
  if(!loaded||!items.length){const empty=document.createElement('div');empty.className='empty';if(!loaded){const spin=document.createElement('span');spin.className='spinner';empty.append(spin);const p=document.createElement('p');p.textContent=t(failed?'error':'loading');empty.append(p);if(failed){const b=document.createElement('button');b.textContent=t('retry');b.onclick=()=>load(true);empty.append(b);}}else{const mark=document.createElement('div');mark.className='empty-mark';mark.textContent='!';const h=document.createElement('h2');h.textContent=t(visible.length?'noMatch':'emptyTitle');const p=document.createElement('p');p.textContent=visible.length?'':t('emptyText');empty.append(mark,h,p);}root.append(empty);return;}
  if(view==='wall')drawWall(items,root);else if(view==='listen')drawListen(items,root);else if(view==='network')drawNetwork(items,root);else drawBubbles(items,root);
  animateArrivals(root,previousLayout,newIds);
  if(newIds.length&&!reducedMotion())$('#total').animate([{transform:'scale(1)'},{transform:'scale(1.14)',offset:.4},{transform:'scale(1)'}],{duration:800});
}
function drawWall(items,root){const grid=document.createElement('div');grid.className='wall-grid';[...items].reverse().forEach(e=>{const b=document.createElement('button');b.className=`voice-card${e.hidden?' is-hidden':''}${arriving.has(e.id)?' is-new':''}`;b.dataset.voiceId=e.id;b.dataset.motionKey=e.id;b.style.setProperty('--tone',tone(e));b.style.setProperty('--tint',tone(e)+'0d');b.style.setProperty('--size',`${1.05+(e.urgency??3)*.12}rem`);const cat=document.createElement('p');cat.className='card-theme';cat.textContent=e.categories.map(tn).join(' / ');const h=document.createElement('h3');h.textContent=e.headline;const foot=document.createElement('div');foot.className='card-foot';const urgency=document.createElement('span');urgency.textContent=e.urgency?`${t('urgency')} ${e.urgency}/5`:'';const count=document.createElement('span');count.textContent=`${e.mine?'↗✓':'↗'} ${e.resonance}`;foot.append(urgency,count);b.append(cat,h,foot);b.onclick=()=>openDetail(e);grid.append(b);});root.append(grid);}
const seed=id=>[...id].reduce((s,c)=>(s*31+c.charCodeAt(0))>>>0,0)/4294967296;
const radius=e=>Math.sqrt(1+e.resonance)*8;
function svgRoot(root,height=600){if(!window.d3){root.textContent=lang==='ja'?'可視化ライブラリを読み込めません。声の壁で閲覧できます。':'Visualization library unavailable. Use Voice wall.';return null;}return d3.select(root).append('svg').attr('viewBox',`0 0 1000 ${height}`).attr('role','group').attr('aria-label',t(view));}
function drawBubbles(items,root){
  items=items.filter(e=>view==='map'?e.reach&&e.urgency:e.categories.length);
  if(!items.length){const p=document.createElement('p');p.className='network-note';p.textContent=lang==='ja'?'この表示に必要な分類・評価はありません。自由記述の声は「歩く」や「聴く」で表示できます。':'These voices have no theme or rating data. Read them in Wander or Listen.';root.append(p);return;}
  const svg=svgRoot(root);if(!svg)return;
  const centers={}, motion=!reducedMotion();
  if(view==='clusters'){
    Object.keys(themes).forEach((k,i)=>{
      const x=150+(i%3)*350,y=85+Math.floor(i/3)*190;centers[k]=[x,y+55];
      if(items.some(e=>e.categories[0]===k))svg.append('text').attr('x',x).attr('y',y-28).attr('text-anchor','middle').attr('fill',themes[k][2]).attr('font-size',16).attr('font-weight',700).text(tn(k));
    });
  }else{
    for(let u=1;u<=5;u++){const y=510-(u-1)*105;svg.append('line').attr('x1',95).attr('x2',940).attr('y1',y).attr('y2',y).attr('stroke','#384238').attr('stroke-dasharray','3 7');svg.append('text').attr('x',68).attr('y',y+5).attr('class','axis-label').text(u);}
    ['me','community','society'].forEach((k,i)=>svg.append('text').attr('x',210+i*330).attr('y',555).attr('text-anchor','middle').attr('class','axis-label').text(t(k)));
    svg.append('text').attr('x',40).attr('y',24).attr('class','axis-label').text(t('urgency'));
  }
  const nodes=items.map(e=>{
    const target=view==='map'?[210+(e.reach-1)*330+(seed(e.id)-.5)*60,510-(e.urgency-1)*105+(seed(e.id.slice(3))-.5)*18]:centers[e.categories[0]];
    const previous=clusterPositions.get(e.id),fresh=arriving.has(e.id)&&motion;
    return {...e,r:radius(e),tx:target[0],ty:target[1],x:view==='map'?target[0]:previous?.x??target[0]+(seed(e.id)-.5)*(fresh?280:100),y:view==='map'?target[1]:previous?.y??target[1]-(fresh?95:0)};
  });
  const circles=svg.selectAll('g.bubble').data(nodes).join('g').attr('class','bubble').attr('role','button').attr('tabindex',0).attr('aria-label',d=>d.headline).attr('data-voice-id',d=>d.id).on('click',(_,d)=>openDetail(d)).on('keydown',(ev,d)=>{if(['Enter',' '].includes(ev.key)){ev.preventDefault();openDetail(d);}});
  circles.append('circle').attr('r',d=>Math.max(25,d.r)).attr('fill','transparent').attr('pointer-events','all');
  circles.append('circle').attr('class',d=>arriving.has(d.id)?'arrival-mark':null).attr('r',d=>d.r).attr('fill',d=>tone(d)+'bd').attr('stroke',d=>d.mine?'#eac65d':tone(d)).attr('stroke-dasharray',d=>d.mine?'3 3':null).attr('stroke-width',1.5);
  circles.filter(d=>arriving.has(d.id)).append('circle').attr('class','arrival-ring').attr('r',d=>d.r+7).attr('fill','none').attr('stroke',d=>tone(d)).attr('stroke-width',2);
  circles.append('title').text(d=>`${d.headline}\n${t('echoCount')}: ${d.resonance}`);
  if(view==='map'){
    circles.attr('transform',d=>`translate(${d.x},${d.y-(arriving.has(d.id)&&motion?100:0)})`);
    if(motion)circles.filter(d=>arriving.has(d.id)).transition().duration(1400).ease(d3.easeCubicOut).attr('transform',d=>`translate(${d.x},${d.y})`);
    return;
  }
  const paint=()=>circles.attr('transform',d=>{
    d.x=Math.max(d.r,Math.min(1000-d.r,d.x));d.y=Math.max(d.r,Math.min(590-d.r,d.y));clusterPositions.set(d.id,{x:d.x,y:d.y});return `translate(${d.x},${d.y})`;
  });
  paint();
  simulation=d3.forceSimulation(nodes).alpha(arriving.size ? .8 : .15).force('x',d3.forceX(d=>d.tx).strength(.12)).force('y',d3.forceY(d=>d.ty).strength(.12)).force('collide',d3.forceCollide(d=>d.r+3).iterations(3)).on('tick',paint);
  if(!motion){simulation.stop();for(let i=0;i<120;i++)simulation.tick();paint();}
}
function drawNetwork(items,root){
  const svg=svgRoot(root);if(!svg)return;
  const counts={},pairs={},affected=new Set(),affectedPairs=new Set();
  items.forEach(e=>{
    e.categories.forEach(c=>{counts[c]=(counts[c]||0)+1;if(arriving.has(e.id))affected.add(c);});
    if(e.categories.length===2){const pair=[...e.categories].sort().join('|');pairs[pair]=(pairs[pair]||0)+1;if(arriving.has(e.id))affectedPairs.add(pair);}
  });
  // Fixed theme positions prevent unrelated nodes jumping when a theme appears.
  const order=Object.keys(themes),nodes=order.filter(k=>counts[k]).map(k=>{const angle=order.indexOf(k)/order.length*2*Math.PI-Math.PI/2;return {id:k,x:500+220*Math.cos(angle),y:290+220*Math.sin(angle)};}),byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
  Object.entries(pairs).forEach(([key,n])=>{
    const [a,b]=key.split('|'),s=byId[a],target=byId[b];
    const line=svg.append('line').attr('x1',s.x).attr('y1',s.y).attr('x2',target.x).attr('y2',target.y).attr('stroke','#b8afa0').attr('stroke-width',1+n*2);
    if(affectedPairs.has(key))line.attr('class','arrival-link').style('--length',`${Math.hypot(s.x-target.x,s.y-target.y)}px`);
    line.append('title').text(`${tn(a)} / ${tn(b)}: ${n}`);
    svg.append('text').attr('x',(s.x+target.x)/2).attr('y',(s.y+target.y)/2).attr('font-size',12).attr('fill','#a7af9e').text(n);
  });
  const g=svg.selectAll('g').data(nodes).join('g').attr('transform',d=>`translate(${d.x},${d.y})`).attr('class','bubble').attr('role','button').attr('tabindex',0).attr('aria-label',d=>tn(d.id)).on('click',(_,d)=>{$('#theme-filter').value=d.id;view='wall';selectView();render();}).on('keydown',(e,d)=>{if(e.key==='Enter'){$('#theme-filter').value=d.id;view='wall';selectView();render();}});
  g.append('circle').attr('class',d=>affected.has(d.id)?'arrival-mark':null).attr('r',d=>Math.sqrt(counts[d.id])*12).attr('fill',d=>themes[d.id][2]+'cc');
  g.filter(d=>affected.has(d.id)).append('circle').attr('class','arrival-ring').attr('r',d=>Math.sqrt(counts[d.id])*12+8).attr('fill','none').attr('stroke',d=>themes[d.id][2]).attr('stroke-width',2);
  g.append('text').attr('text-anchor','middle').attr('dy',5).attr('fill','#111512').attr('font-size',16).text(d=>counts[d.id]);
  g.append('text').attr('text-anchor','middle').attr('y',d=>Math.sqrt(counts[d.id])*12+22).attr('font-size',18).attr('fill',d=>themes[d.id][2]).text(d=>tn(d.id));
  if(!Object.keys(pairs).length){const p=document.createElement('p');p.className='network-note';p.textContent=t('networkEmpty');root.append(p);}
}
function drawListen(items,root){listenIndex=((listenIndex%items.length)+items.length)%items.length;const e=items[listenIndex],stage=document.createElement('div');stage.className='listen-stage';const theme=document.createElement('p');theme.className='listen-theme';theme.textContent=e.categories.map(tn).join(' / ');const quote=document.createElement('blockquote');quote.textContent=e.headline;quote.style.color=tone(e);const controls=document.createElement('div');controls.className='listen-controls';const prev=document.createElement('button'),next=document.createElement('button'),play=document.createElement('button'),more=document.createElement('button');prev.textContent='←';prev.setAttribute('aria-label',lang==='ja'?'前の声':'Previous voice');next.textContent='→';next.setAttribute('aria-label',lang==='ja'?'次の声':'Next voice');play.textContent=auto?(lang==='ja'?'自動送りを停止':'Stop autoplay'):(lang==='ja'?'8秒ずつ自動送り':'Autoplay · 8 seconds');more.textContent=lang==='ja'?'この声を聴く ↗':'Read this voice ↗';prev.onclick=()=>{listenIndex--;render();};next.onclick=()=>{listenIndex++;render();};play.onclick=()=>{auto=!auto;render();};more.onclick=()=>openDetail(e);const n=document.createElement('span');n.textContent=`${listenIndex+1} / ${items.length}`;controls.append(prev,n,next,play,more);stage.append(theme,quote,controls);root.append(stage);}
function selectView(){$$('#view-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));}
function openDetail(e){selected=entries.find(item=>item.id===e.id)||e;renderDetail();if(!$('#detail-dialog').open)$('#detail-dialog').showModal();}
function renderDetail(){const e=selected;setText($('#detail-category'),e.categories.length?e.categories.map(tn).join(' / '):(lang==='ja'?'あなたの言葉、そのまま。':'In your own words.'));setText($('#detail-headline'),e.headline);setText($('#detail-body'),e.detail);setText($('#detail-change'),e.change);$('#detail-change-wrap').hidden=!e.change;setText($('#detail-meta'),`${e.urgency?`${t('urgency')}: ${e.urgency}/5 · `:''}${e.reach?`${t(['me','community','society'][e.reach-1])} · `:''}${new Intl.DateTimeFormat(lang,{dateStyle:'short',timeStyle:'short'}).format(new Date(e.createdAt))}`);setText($('#resonate'),`${t(e.mine?'echoed':'echo')} · ${e.resonance}`);$('#resonate').setAttribute('aria-pressed',String(e.mine));$('#hide-entry').hidden=!isHost||demo;setText($('#hide-entry'),t(e.hidden?'restore':'hide'));}
$('#language').onclick=()=>{lang=lang==='ja'?'en':'ja';safeStore('voices-language',lang);language();};
$('#join-form').onsubmit=e=>{e.preventDefault();location.href=`?room=${$('#room-code').value.trim().toLowerCase()}&join=1`;};
$('#create-form').onsubmit=async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;try{if(!safeStore('voices-storage-check','1'))throw new Error(t('needStorage'));const old=code;code='';const data=await api('POST',{action:'create',title:$('#session-title').value});code=old;const keys=hostKeys();keys[data.code]={key:data.hostKey,title:data.title};if(!safeStore('voices-hosts',JSON.stringify(keys)))throw new Error(t('needStorage'));location.href=`?room=${data.code}`;}catch(err){setText($('#lobby-error'),err.message===t('needStorage')?err.message:t('error'));button.disabled=false;}};
$('#demo').onclick=()=>location.href='?demo';
let demoArrivalIndex=0;
$('#demo-arrival').onclick=()=>{
  if(!demo)return;
  const samples=[['学ぶ時間にも、格差がある。','Even time to study is unequal.',['education','money']],['誰でも移動できる街に。','A city everyone can move through.',['access','care']],['私たちの声も、決める場に。','Our voices belong where decisions are made.',['voice','identity']]];
  const sample=samples[demoArrivalIndex++%samples.length];
  entries.push({id:`demo-arrival-${crypto.randomUUID()}`,seq:entries.length+1,headline:sample[lang==='ja'?0:1],detail:t('demoBanner'),change:'',categories:sample[2],reach:2,urgency:4,resonance:0,mine:false,hidden:false,createdAt:new Date().toISOString()});
  const fresh=arrivals.update(entries);render(fresh);announce(fresh);
};
$('#contribute').onclick=()=>{$('#submit-dialog').showModal();};
$$('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
let submissionId=crypto.randomUUID();
$('#voice-form').onsubmit=async e=>{
  e.preventDefault();const text=$('#voice-text').value,voice=openTextEntry(text);if(!voice){setText($('#submit-status'),lang==='ja'?'ひとこと、書いてください（500文字以内）。':'Write a voice of up to 500 characters.');return;}
  $('#send').disabled=true;setText($('#submit-status'),t('posting'));
  try{
    if(demo){entries.push({...voice,id:submissionId,seq:entries.length+1,resonance:0,mine:false,hidden:false,createdAt:new Date().toISOString()});const fresh=arrivals.update(entries);render(fresh);announce(fresh);}
    else await api('POST',{id:submissionId,text});
    submissionId=crypto.randomUUID();$('#voice-form').reset();setText($('#submit-status'),t('saved'));setText($('#send'),t('another'));await load(true);
  }catch(err){setText($('#submit-status'),err.status===409?t('closed'):t('error'));}
  finally{$('#send').disabled=false;}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;view=b.dataset.view;auto=false;selectView();$('#explore-dialog').close();render();});
$('#explore-open').onclick=()=>{$('#explore-dialog').showModal();$('#search').focus();};
$('#tools-open').onclick=()=>$('#tools-dialog').showModal();
$('#tools-share').onclick=()=>{$('#tools-dialog').close();$('#share').click();};
$$('[data-entry]').forEach(b=>b.onclick=()=>{$$('[data-entry-panel]').forEach(panel=>panel.hidden=panel.dataset.entryPanel!==b.dataset.entry);$('#entry-dialog').showModal();});
$('#atlas-out').onclick=()=>atlas?.zoomBy(.82);$('#atlas-in').onclick=()=>atlas?.zoomBy(1.22);$('#atlas-home').onclick=()=>atlas?.home();$('#tour').onclick=()=>atlas?.toggleTour();
['search','theme-filter','lens','show-hidden'].forEach(id=>$('#'+id).addEventListener(id==='search'?'input':'change',()=>{listenIndex=0;render();if(view==='wander'||view==='threads')atlas?.home();}));
$('#reset').onclick=()=>{$('#search').value='';$('#theme-filter').value='all';$('#lens').value='all';render();atlas?.home();};
$('#pause').onclick=()=>{paused=!paused;setText($('#pause'),t(paused?'resume':'pause'));connection();atlas?.pause(paused);if(!paused)load(true);};
$('#next-question').onclick=()=>{question=(question+1)%questions.length;setText($('#discussion'),questions[question][lang==='ja'?0:1]);};
$('#fullscreen').onclick=()=>{document.body.classList.toggle('present');$('#fullscreen').setAttribute('aria-pressed',String(document.body.classList.contains('present')));render();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$$('dialog[open]').length){document.body.classList.remove('present');$('#fullscreen').setAttribute('aria-pressed','false');}});
$('#share').onclick=()=>{const url=demo?new URL('?demo',location.href).href:link();$('#join-url').value=url;setText($('#share-code'),demo?'DEMO':code.toUpperCase());$('#qr').replaceChildren();if(window.QRCode)new QRCode($('#qr'),{text:url,width:240,height:240,colorDark:'#302d29',colorLight:'#faf8f2',correctLevel:QRCode.CorrectLevel.M});$('#share-dialog').showModal();};
async function copy(value){try{await navigator.clipboard.writeText(value);return true;}catch{return false;}}
$('#copy-link').onclick=async()=>{setText($('#copy-status'),await copy($('#join-url').value)?t('copyDone'):(lang==='ja'?'上のリンクを選択してコピーしてください。':'Select and copy the link above.'));};
$('#resonate').onclick=async()=>{const e=selected;$('#resonate').disabled=true;try{if(demo){e.mine=!e.mine;e.resonance+=e.mine?1:-1;render();renderDetail();}else{await api('PUT',{id:e.id,active:!e.mine});await load(true);}}catch{setText($('#detail-status'),t('error'));}finally{$('#resonate').disabled=false;}};
$('#hide-entry').onclick=async()=>{try{await api('PATCH',{id:selected.id,hidden:!selected.hidden});await load(true);}catch{setText($('#detail-status'),t('error'));}};
$('#close-session').onclick=async()=>{try{await api('PATCH',{open:!room.open});await load(true);}catch{setText($('#connection'),t('error'));}};
$('#host-link').onclick=()=>{const u=new URL(link('wall'));u.hash=`host=${hostKey}`;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([`${t('hostSecret')}\n\n${u.href}\n`],{type:'text/plain'}));a.download=`voices-${code}-PRIVATE-host.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
$('#export').onclick=()=>{const rows=[['id','headline','detail','change','themes','reach','urgency','echoes','hidden','created_at'],...entries.map(e=>[e.id,e.headline,e.detail,e.change,e.categories.map(tn).join(' / '),e.reach,e.urgency,e.resonance,e.hidden,e.createdAt])];const cell=v=>{let s=String(v??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));a.download=`voices-${code}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
function demoData(){const examples=[['奨学金を返すために、学ぶ時間がなくなる','I work so much to repay my loans that I have no time to study','money','education',2,5],['駅にエレベーターがない','My station has no elevator','access','care',2,4],['同じ仕事なのに、給料が違う','The same work gets different pay','work','identity',3,5],['バイトのシフトが前日に変わる','My work shift changes the day before','work','voice',1,4],['制服のルールを決める場に、生徒はいない','Students have no say in uniform rules','education','voice',2,3],['暑い日に、木陰がない通学路','No shade on the walk to school','environment','access',2,3],['家族のケアをしていることが伝わらない','People do not see the care I give my family','care','education',1,5],['「女の子だから」と選択肢が狭まる','“Because you’re a girl” limits my choices','identity','work',3,5],['地方では車がないと何もできない','Without a car, rural life feels impossible','access','money',2,4],['授業で発言する人だけが評価される','Only the students who speak up get noticed','education','voice',1,3],['安いものを買うと、環境に悪いと言われる','Affordable choices get called unsustainable','money','environment',3,3],['外国人というだけで部屋を借りにくい','It is harder to rent because I am foreign','identity','money',3,5],['休める人と、休めない人がいる','Some people can take time off. Others cannot.','work','care',2,4],['公園で座る場所が減っている','There are fewer places to sit in the park','access','environment',2,2],['「みんな同じ」が本当に平等？','Does “the same for everyone” mean fair?','voice','identity',3,4]];entries=examples.map((e,i)=>({id:`demo-${i}`,seq:i+1,headline:e[lang==='ja'?0:1],detail:lang==='ja'?'デモ用の架空の声です。':'A fictional voice for demonstration.',change:i%3?lang==='ja'?'当事者の声を聞く場がほしい。':'A place where affected people can be heard.':'',categories:[e[2],e[3]],reach:e[4],urgency:e[5],resonance:(i*7)%12,mine:false,hidden:false,createdAt:new Date().toISOString()}));room={title:lang==='ja'?'日常の「不公平」':'The unfairness around us',open:true};code='demo';loaded=true;isHost=false;}
async function start(){language();if(!code&&!demo)return;$('#lobby').hidden=true;$('#session').hidden=false;document.body.classList.add('has-session');if(demo){demoData();arrivals.update(entries);updateRoom();render();return;}if(!/^[a-f0-9]{8}$/.test(code)){setText($('#room-title'),t('badRoom'));return;}
  const fragment=new URLSearchParams(location.hash.slice(1)),provided=fragment.get('host');if(provided){hostKey=provided;history.replaceState(null,'',location.pathname+location.search);const all=hostKeys();all[code]={key:hostKey,title:all[code]?.title||code};safeStore('voices-hosts',JSON.stringify(all));}else hostKey=hostKeys()[code]?.key||'';
  room={title:t('loading'),open:true};render();await load(true);if(isHost){const all=hostKeys();all[code]={key:hostKey,title:room.title};safeStore('voices-hosts',JSON.stringify(all));}if(new URLSearchParams(location.search).has('join')&&room?.open&&!failed)$('#submit-dialog').showModal();
}
let autoTick=0, participantPoll=0;const participant=new URLSearchParams(location.search).has('join');
setInterval(()=>{if(!document.hidden){if(!$('#submit-dialog').open&&(!participant||Date.now()-participantPoll>=15000)){load();participantPoll=Date.now();}if(auto&&view==='listen'&&!$$('dialog[open]').length&&Date.now()-autoTick>8000){listenIndex++;render();autoTick=Date.now();}}},2800);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load(true);});
start();
