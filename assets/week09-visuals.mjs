const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external=(href,body,attrs='')=>`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" ${attrs}>${body}</a>`;

export function renderWeek9(slide,{ja=true}={}) {
  const lang=ja?'ja':'en',t=value=>value?.[lang]??value??'';
  const title=esc(t(slide.title));
  if(slide.kind==='title-comparison') {
    return `<section class="w9-title-comparison"><p>${esc(t(slide.before))}</p><h1>${title}</h1>${slide.summary?`<p class="w9-title-summary">${esc(t(slide.summary))}</p>`:''}</section>`;
  }
  if(slide.kind==='combined-route') {
    const rail=esc(t(slide.rail)),walk=esc(t(slide.walk)),description=esc(t(slide.description));
    return `<section class="w9-combined-route">
      <h1>${title}</h1>
      <figure>
        <svg viewBox="0 0 1260 390" role="img" aria-label="${description}">
          <path class="w9-combined-rail" d="M205 142 H1055"/>
          <path class="w9-combined-walk" d="M205 142 C345 142 355 275 490 275 H770 C905 275 915 142 1055 142"/>
          <circle cx="205" cy="142" r="15"/><circle cx="1055" cy="142" r="15"/>
          <g text-anchor="middle">
            <text class="w9-combined-station" x="205" y="78">Leicester Square</text>
            <text class="w9-combined-station" x="1055" y="78">Covent Garden</text>
            <text class="w9-combined-rail-label" x="630" y="105">${rail}</text>
            <text class="w9-combined-walk-label" x="630" y="351">${walk}</text>
          </g>
        </svg>
        <figcaption>${ja?'模式図（縮尺なし）':'Schematic, not to scale'}<span> · </span>${external(slide.sources[0].href,ja?'TfLの徒歩地図 ↗':'TfL walking map ↗')}</figcaption>
      </figure>
    </section>`;
  }
  if(slide.kind==='archive') {
    return `<figure class="w9-archive w9-archive--${esc(slide.id)}">${external(slide.sources[0].href,
      `<img src="${esc(slide.image)}" alt="${esc(t(slide.alt))}" referrerpolicy="no-referrer" ${slide.id==='pocket-map'?'fetchpriority="high"':''}><span class="w9-image-fallback" hidden>${ja?'原図を開く':'Open the original'} ↗</span>`)}
      <figcaption><b>${esc(slide.year)}</b> ${esc(t(slide.credit))}</figcaption></figure>`;
  }
  if(slide.kind==='one-stop') {
    return `<div class="w9-route-slide">
      <div class="w9-route"><span>Leicester Square</span><span>Covent Garden</span></div>
      <h1>${title}</h1><p>${ja?'電車に乗る？ 歩く？':'Train or walk?'}</p></div>`;
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
