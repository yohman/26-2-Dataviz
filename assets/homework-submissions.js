(() => {
  const api='https://dataviz-gallery-likes.ykawano.workers.dev/homework';
  const form=document.querySelector('#homework-form'), status=document.querySelector('#homework-status'), button=form.querySelector('[type=submit]');
  const week=Number(new URLSearchParams(location.search).get('week'));
  const text=(ja,en)=>window.courseLanguage==='en'?en:ja;
  let schedule, deadlineTimer, pending;
  const browser=localStorage.getItem('dataviz-heart-browser') || crypto.randomUUID();
  localStorage.setItem('dataviz-heart-browser',browser);
  const gallery=document.querySelector('#homework-gallery'); gallery.href=`gallery.html?week=${week}`;
  async function request(body) {
    const response=await fetch(`${api}?week=${week}`,{method:body?'POST':'GET',headers:{'X-Browser-ID':browser,...(body?{'Content-Type':'application/json'}:{})},cache:'no-store',signal:AbortSignal.timeout(30000),...(body?{body:JSON.stringify(body)}:{})});
    const result=await response.json(); if(!response.ok) throw new Error(result.error || text('送信できません。再試行してください。','Please retry.')); return result;
  }
  function updateDeadline() {
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
      body.images=await Promise.all([form.elements.image1.files[0],form.elements.image2.files[0]].filter(Boolean).map(compress));
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
  request().then(data=>{schedule=data;document.querySelector('#homework-week').textContent=data.challenge;updateDeadline();deadlineTimer=setInterval(updateDeadline,15000);}).catch(error=>{status.textContent=error.message;});
  new MutationObserver(updateDeadline).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('pagehide',()=>clearInterval(deadlineTimer));
})();
