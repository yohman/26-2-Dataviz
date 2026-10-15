(() => {
  const api = 'https://dataviz-gallery-likes.ykawano.workers.dev';
  const status = document.querySelector('#activity-status');
  const make = (tag,text,className) => { const n=document.createElement(tag); if(text)n.textContent=text; if(className)n.className=className; return n; };
  async function request(method='GET',body) {
    const id=localStorage.getItem('dataviz-heart-browser')||crypto.randomUUID();
    localStorage.setItem('dataviz-heart-browser',id);
    const response=await fetch(api+'/activities?week=4',{method,headers:{'X-Browser-ID':id,...(body?{'Content-Type':'application/json'}:{})},signal:AbortSignal.timeout(20000),...(body?{body:JSON.stringify(body)}:{})});
    const data=await response.json();
    if(!response.ok)throw new Error(response.status===409?'このグループ番号は別のブラウザから提出済みです。元のブラウザで更新するか、番号を確認してください。 / Group already submitted from another browser.':response.status===429?'1分ほど待って再試行してください。 / Please wait a minute and retry.':'送信・読み込みに失敗しました。再試行してください。 / Please retry.');
    return data;
  }
  async function compress(file) {
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024)throw new Error('15MB以下のJPG・PNG・WebPを選んでください。');
    const bitmap=await createImageBitmap(file);
    const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(bitmap.width*scale)); canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
    for(const quality of [.85,.7,.55,.4]) { const image=canvas.toDataURL('image/jpeg',quality); if(image.length<520000)return image; }
    throw new Error('画像が大きすぎます。小さなスクリーンショットで再試行してください。');
  }
  const form=document.querySelector('#activity-form');
  if(form) {
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const button=form.querySelector('[type=submit]'); button.disabled=true;
      status.textContent='画像を準備して送信しています… / Preparing and submitting…';
      try {
        const images=await Promise.all([form.elements.image1.files[0],form.elements.image2.files[0]].filter(Boolean).map(compress));
        await request('POST',{week:4,groupNumber:Number(form.elements.groupNumber.value),members:form.elements.members.value,title:form.elements.title.value,description:form.elements.description.value,images});
        status.replaceChildren(make('strong','提出しました。同じブラウザから再提出すると更新できます。 / Submitted.'));
        const link=make('a',' 作品を見る / View submissions →'); link.href='activity-results.html?week=4'; status.append(link);
      } catch(error) { status.textContent=error.message||'送信できませんでした。再試行してください。'; }
      finally {button.disabled=false;}
    });
    request().then(data=>{
      const mine=data.items.find(item=>item.mine);
      if(!mine||['groupNumber','members','title','description'].some(key=>form.elements[key].value))return;
      ['groupNumber','members','title','description'].forEach(key=>{form.elements[key].value=mine[key];});
      status.textContent='前回の提出を読み込みました。更新する場合は画像も選び直してください。 / Reselect images to update your submission.';
    }).catch(()=>{});
  }
  const results=document.querySelector('#activity-results');
  if(results) {
    let loading=false;
    async function load() {
      if(loading)return; loading=true;
      const refresh=document.querySelector('#activity-refresh'); refresh.disabled=true;
      status.textContent='作品を読み込んでいます… / Loading submissions…';
      try {
        const data=await request(); results.replaceChildren();
        data.items.forEach(item=>{
          const card=make('article','','activity-result');
          card.append(make('p',`Group ${String(item.groupNumber).padStart(2,'0')}`,'eyebrow'));
          const images=make('div','','activity-result-images');
          for(let slot=1;slot<=(item.hasSecondImage?2:1);slot++) {
            const href=`${api}/activity-image?week=4&group=${item.groupNumber}&slot=${slot}&v=${encodeURIComponent(item.updatedAt)}`;
            const link=make('a'); link.href=href; link.target='_blank'; link.rel='noopener';
            const img=make('img'); img.src=href; img.alt=`${item.title} · ${slot}`; img.loading='lazy';
            img.addEventListener('error',()=>{link.replaceChildren(make('span','画像を表示できません。クリックして再確認 / Open image'));});
            link.append(img); images.append(link);
          }
          card.append(images,make('h2',item.title),make('p',item.members),make('p',item.description));
          if(item.hasSecondImage)card.append(make('p','画像2枚 · 横にスクロール / Scroll for image 2','activity-note'));
          results.append(card);
        });
        status.textContent=data.items.length?`${data.items.length}グループの作品 · 画像をクリックすると拡大 / Click an image to enlarge`:'まだ提出はありません。 / No submissions yet.';
      } catch(error) {status.textContent=error.message;}
      finally {loading=false;refresh.disabled=false;}
    }
    document.querySelector('#activity-refresh').addEventListener('click',load);
    load();
  }
})();
