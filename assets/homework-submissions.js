(() => {
  const api='https://dataviz-gallery-likes.ykawano.workers.dev/homework';
  const form=document.querySelector('#homework-form'), status=document.querySelector('#homework-status'), button=form.querySelector('[type=submit]');
  const week=Number(new URLSearchParams(location.search).get('week'));
  const text=(ja,en)=>window.courseLanguage==='en'?en:ja;
  const isIndividualRevision=week===8;
  const isStudioRevision=week===9;
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
      'グループ名を冒頭に書く。見る人に試してもらったこと、変更した点、見やすくなった点や見えにくくなった点を3〜5文で説明する。',
      'Start with your group name. In 3–5 sentences, explain the viewer’s task, what you changed after testing, and what became easier or harder to see.');
    label(form.elements.image1.labels[0],'改訂版（ギャラリーに最初に表示）','Revised graphic (shown first in the gallery)');
    label(form.elements.image2.labels[0],'試した版（改訂前）','Tested graphic (before the change)');
    form.elements.image2.required=true;
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
    else if(isStudioRevision) document.querySelector('#homework-week').textContent=text('第9週 · 改訂の前と後','Week 9 · Before & after');
    else if(schedule) document.querySelector('#homework-week').textContent=schedule.challenge;
    if(!schedule) return;
    const open=Date.now()>=schedule.opensAt && Date.now()<schedule.deadline;
    const date=new Intl.DateTimeFormat(window.courseLanguage==='en'?'en-GB':'ja-JP',{timeZone:'Asia/Tokyo',dateStyle:'full',timeStyle:'short'}).format(new Date(schedule.deadline));
    document.querySelector('#homework-deadline').textContent=`${text('締切','Deadline')}: ${date} JST${open?'':text(' · 受付時間外',' · Submissions closed')}`;
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
      const imageInputs=isIndividualRevision?['image1']:['image1','image2'];
      const images=imageInputs.map(name=>form.elements[name].files[0]).filter(Boolean);
      if(isStudioRevision&&images.length!==2) throw new Error(text('改訂版と試した版の画像を両方選んでください。','Choose both the revised and tested graphics.'));
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
