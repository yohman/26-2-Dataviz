const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external=(href,body,attrs='')=>`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" ${attrs}>${body}</a>`;

export function renderWeek9(slide,{ja=true}={}) {
  const lang=ja?'ja':'en',t=value=>value?.[lang]??value??'';
  const title=esc(t(slide.title));
  if(slide.kind==='title-comparison') {
    return `<section class="w9-title-comparison"><p>${esc(t(slide.before))}</p><h1>${title}</h1></section>`;
  }
  if(slide.kind==='archive') {
    return `<figure class="w9-archive w9-archive--${esc(slide.id)}">${external(slide.sources[0].href,
      `<img src="${esc(slide.image)}" alt="${esc(t(slide.alt))}" referrerpolicy="no-referrer" ${slide.id==='pocket-map'?'fetchpriority="high"':''}><span class="w9-image-fallback" hidden>${ja?'原図を開く':'Open the original'} ↗</span>`)}
      <figcaption><b>${esc(slide.year)}</b> ${esc(t(slide.credit))}</figcaption></figure>`;
  }
  if(slide.kind==='one-stop'||slide.kind==='walk') {
    const walking=slide.kind==='walk';
    return `<div class="w9-route-slide${walking?' w9-route-slide--walk':''}">
      <div class="w9-route"><span>Leicester Square</span><span>Covent Garden</span></div>
      <h1>${title}</h1>${walking
      ?`<div class="w9-walk-detail"><span>320 m</span>${external(slide.sources[0].href,ja?'TfLの徒歩地図 ↗':'TfL walking map ↗')}</div>`
      :`<p>${ja?'電車に乗る？ 歩く？':'Train or walk?'}</p>`}</div>`;
  }
  if(slide.kind==='activity'||slide.kind==='homework') {
    return `<section class="w9-task${slide.kind==='homework'?' w9-task--homework':''}">
    <div class="w9-task-head"><h1>${title}</h1>${slide.duration?`<span>${esc(slide.duration)} <small>${ja?'分':'min'}</small></span>`:''}</div>
    <ol>${t(slide.steps).map(step=>`<li>${esc(step)}</li>`).join('')}</ol>
    ${slide.kind==='homework'?`<div class="w9-submit"><a href="homework-submit.html?week=9">${ja?'宿題を提出する':'Submit homework'} ↗</a><time datetime="2026-12-03T23:59:00+09:00">${ja?'12月3日（木）23:59':'Thu, Dec. 3 · 23:59'} JST</time></div>`:''}
    </section>`;
  }
  return '';
}

export function bindWeek9(slide) {
  const img=slide.querySelector('.w9-archive img');
  if(!img)return;
  const fallback=()=>{img.hidden=true;slide.querySelector('.w9-image-fallback').hidden=false;};
  img.addEventListener('error',fallback,{once:true});
  if(img.complete&&!img.naturalWidth)fallback();
}
