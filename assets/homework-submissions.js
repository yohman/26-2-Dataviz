(() => {
  const api='https://dataviz-gallery-likes.ykawano.workers.dev/homework';
  const form=document.querySelector('#homework-form'), status=document.querySelector('#homework-status'), button=form.querySelector('[type=submit]');
  const week=Number(new URLSearchParams(location.search).get('week'));
  const text=(ja,en)=>window.courseLanguage==='en'?en:ja;
  const isIndividualRevision=week===8;
  const isStudioRevision=week===9;
  const isMidterm=week===10;
  const label=(el,ja,en)=>{
    el.querySelector('[data-course-lang="ja"]').textContent=ja;
    el.querySelector('[data-course-lang="en"]').textContent=en;
  };
  if(isIndividualRevision) {
    label(form.elements.description.labels[0],'今日の見せ合いを受けて、何をなぜ変えましたか？ グループ名も書いてください。','What did you change after today’s show-and-tell, and why? Include your group name.');
    label(form.elements.image1.labels[0],'改訂した可視化の画像（1枚）','Image of your revised graphic (one image)');
    label(form.elements.image1.closest('fieldset').querySelector('legend'),'改訂した可視化','Revised graphic');
    form.elements.image2.labels[0].hidden=true;
    form.elements.image2.disabled=true;
  }
  if(isStudioRevision) {
    const hint=document.querySelector('#homework-week-note');
    label(hint,'グループの代表者が1回提出します。学籍番号と氏名は代表者のものを入力してください。','One person submits for the group. Use the submitting student’s own ID and name.');
    hint.hidden=false;
    label(form.elements.description.labels[0],
      'グループ名を冒頭に書く。どんな案を組み合わせたか、なぜその問いにしたか、図のどこから答えが読み取れるかを3〜5文で説明する。',
      'Start with your group name. In 3–5 sentences, explain which ideas you combined, why you chose the question, and where the graphic shows the answer.');
    label(form.elements.title.labels[0],'作品タイトル（問いの形で）','Your question title');
    label(form.elements.image1.labels[0],'問いをタイトルにした完成版','Final graphic with its question title');
    label(form.elements.image2.labels[0],'班でつくった最初の試作','First group draft');
    form.elements.image2.required=true;
  }
  if(isMidterm) {
    const hint=document.querySelector('#homework-week-note');
    label(document.querySelector('main h1'),'中間発表の作品を提出する','Submit your midterm graphic');
    label(hint,'代表者が、班の最終版の図を1枚提出します。学籍番号と氏名は代表者のものを入力してください。Googleスライドを添える場合は、教員が閲覧できる設定にしてください。',
      'One representative submits one final graphic for the group. Enter the representative’s own ID and name. If you add a Google Slides link, make sure the instructor can view it.');
    hint.hidden=false;
    label(form.elements.title.labels[0],'作品タイトル（問いの形で）','Your inquiry as a title');
    label(form.elements.description.labels[0],'班名を冒頭に書く。何を組み合わせ、最終版のどこから問いの答えが読み取れるかを短く説明する。',
      'Start with your group name. Briefly explain what you combined and where the final graphic answers your question.');
    label(form.elements.notebookUrl.labels[0],'Googleスライドのリンク（任意）','Google Slides link (optional)');
    form.elements.notebookUrl.placeholder='https://docs.google.com/presentation/d/…';
    form.elements.tools.placeholder='Tableau, Python, Flourish…';
    label(form.elements.image1.closest('fieldset').querySelector('legend'),'班の最終版','Final group graphic');
    label(form.elements.image1.labels[0],'最終版の図（1枚）','Upload one image of the final graphic');
    form.elements.image2.labels[0].hidden=true;
    form.elements.image2.disabled=true;
  }
  let schedule, deadlineTimer, pending;
  const browser=localStorage.getItem('dataviz-heart-browser') || crypto.randomUUID();
  localStorage.setItem('dataviz-heart-browser',browser);
  const gallery=document.querySelector('#homework-gallery'); gallery.href=`gallery.html?week=${week}`;
  async function request(body) {
    const response=await fetch(`${api}?week=${week}`,{method:body?'POST':'GET',headers:{'X-Browser-ID':browser,...(body?{'Content-Type':'application/json'}:{})},cache:'no-store',signal:AbortSignal.timeout(30000),...(body?{body:JSON.stringify(body)}:{})});
    const result=await response.json(); if(!response.ok) throw new Error(result.error || text('送信できません。再試行してください。','Please retry.')); return result;
  }
  function updateDeadline() {
    if(isIndividualRevision) document.querySelector('#homework-week').textContent=text('第8週 · 個人で改訂','Week 8 · Individual revision');
    else if(isStudioRevision) document.querySelector('#homework-week').textContent=text('第9週 · グループで一つの図、一つの問い','Week 9 · One group graphic, one question');
    else if(isMidterm) document.querySelector('#homework-week').textContent=text('第10週 · 中間グループ発表','Week 10 · Midterm group presentations');
    else if(schedule) document.querySelector('#homework-week').textContent=schedule.challenge;
    if(!schedule) return;
    const open=Date.now()>=schedule.opensAt && Date.now()<schedule.deadline;
    const date=new Intl.DateTimeFormat(window.courseLanguage==='en'?'en-GB':'ja-JP',{timeZone:'Asia/Tokyo',dateStyle:'full',timeStyle:'short'});
    const opening=isMidterm&&Date.now()<schedule.opensAt?`${text('受付開始','Opens')}: ${date.format(schedule.opensAt)} JST · `:'';
    const lastMinute=isMidterm?schedule.deadline-1:schedule.deadline;
    document.querySelector('#homework-deadline').textContent=`${opening}${text('締切','Deadline')}: ${date.format(lastMinute)} JST${open||opening?'':text(' · 受付時間外',' · Submissions closed')}`;
    button.disabled=!open;
  }
  async function compress(file) {
    if(!file || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>15*1024*1024) throw new Error(text('15MB以下のJPG・PNG・WebPを選んでください。','Choose a JPG, PNG, or WebP below 15 MB.'));
    const bitmap=await createImageBitmap(file), scale=Math.min(1,2000/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    for(const quality of [.9,.8,.65,.5,.35]) {const data=canvas.toDataURL('image/jpeg',quality);if(data.length<1100000)return data;}
    throw new Error(text('画像が大きすぎます。小さな画像で再試行してください。','Try a smaller image.'));
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();button.disabled=true;status.textContent=text('画像を準備して送信しています…','Preparing images and submitting…');
    try {
      const fields=['studentId','studentName','title','tools','projectUrl','notebookUrl','description'];
      const body=Object.fromEntries(fields.map(key=>[key,form.elements[key].value.trim()])); body.week=week;
      const savedKey=`dataviz-revision-${week}-${body.studentId.toLowerCase()}`;
      body.revisionToken=form.elements.revisionCode.value.trim() || localStorage.getItem(savedKey) || crypto.randomUUID();
      localStorage.setItem(savedKey,body.revisionToken);
      const imageInputs=isIndividualRevision||isMidterm?['image1']:['image1','image2'];
      const images=imageInputs.map(name=>form.elements[name].files[0]).filter(Boolean);
      if(isStudioRevision&&images.length!==2) throw new Error(text('完成版と最初の試作の画像を両方選んでください。','Choose both the final graphic and the first group draft.'));
      body.images=await Promise.all(images.map(compress));
      const signature=JSON.stringify(body);
      if(!pending || pending.signature!==signature)pending={signature,id:crypto.randomUUID()};
      body.requestId=pending.id;
      const result=await request(body);
      form.elements.revisionCode.value=body.revisionToken;
      status.replaceChildren(document.createTextNode(text('提出しました。修正コードを保存してください。 ','Submitted. Save your revision code. ')));
      const link=document.createElement('a');link.href=`gallery-work.html?id=${encodeURIComponent(result.id)}&week=${week}`;link.textContent=text('作品を見る →','View work →');status.append(link);
      pending=null;
    } catch(error) {status.textContent=error.message || text('通信に失敗しました。再試行してください。','Connection failed. Please retry.');}
    finally {updateDeadline();}
  });
  updateDeadline();
  request().then(data=>{schedule=data;updateDeadline();deadlineTimer=setInterval(updateDeadline,15000);}).catch(error=>{status.textContent=error.message;});
  new MutationObserver(updateDeadline).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('pagehide',()=>clearInterval(deadlineTimer));
})();
