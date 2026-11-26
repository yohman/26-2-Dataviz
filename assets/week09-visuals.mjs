const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external=(href,body,attrs='')=>`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" ${attrs}>${body}</a>`;

export function renderWeek9(slide,{ja=true}={}) {
  const lang=ja?'ja':'en',t=value=>value?.[lang]??value??'';
  const title=esc(t(slide.title));
  if(slide.kind==='title-comparison') {
    return `<section class="w9-title-comparison"><p>${esc(t(slide.before))}</p><h1>${title}</h1>${slide.summary?`<p class="w9-title-summary">${esc(t(slide.summary))}</p>`:''}</section>`;
  }
  if(slide.kind==='combined-route') {
    return `<section class="w9-combined-route">
      <div class="w9-route-answer">
        <header><p>${ja?'地上にいるなら':'Already at street level?'}</p><h1>${ja?'歩こう。':'Walk.'}</h1></header>
        <dl>
          <div class="w9-walk-time"><dt>${ja?'地上を歩く':'Walk at street level'}</dt><dd><strong>${ja?'約5分':'~5 min'}</strong><small>${ja?'このルートは約380 m':'About 380 m on this route'}</small></dd></div>
          <div class="w9-rail-time"><dt>${ja?'地下鉄で1駅':'One stop on the Tube'}</dt><dd><strong>${ja?'乗車 約1分':'~1 min aboard'}</strong><small>${ja?'＋ ホームまで・待ち時間・出口まで':'+ getting in, waiting and getting out'}</small></dd></div>
        </dl>
      </div>
      <figure class="w9-geographic-map">
        <img src="${esc(slide.image)}" alt="${esc(t(slide.description))}" width="1040" height="900">
        <svg viewBox="0 0 1040 900" aria-hidden="true">
          <text class="w9-map-station" x="268" y="726">Leicester Square</text>
          <text class="w9-map-station" x="1020" y="224" text-anchor="end">Covent Garden</text>
          <text class="w9-map-road" x="340" y="584" transform="rotate(-30 340 584)">Cranbourn St</text>
          <text class="w9-map-road" x="615" y="400" transform="rotate(-35 615 400)">Long Acre</text>
        </svg>
        <figcaption>${external('https://www.openstreetmap.org/copyright','© OpenStreetMap contributors')}  /  ${external(slide.sources[0].href,'TfL')}</figcaption>
      </figure>
    </section>`;
  }
  if(slide.kind==='archive') {
    const opening=slide.id==='pocket-map'||slide.id==='beck-map';
    return `<figure class="w9-archive w9-archive--${esc(slide.id)}${opening?' w9-archive--opening':''}">${external(slide.sources[0].href,
      `<img src="${esc(slide.image)}" alt="${esc(t(slide.alt))}" referrerpolicy="no-referrer" ${slide.id==='pocket-map'?'fetchpriority="high"':''}><span class="w9-image-fallback" hidden>${ja?'原図を開く':'Open the original'} ↗</span>`)}
      ${opening?`<h1>${title}</h1>`:''}
      <figcaption><b>${esc(slide.year)}</b> ${esc(t(slide.credit))}</figcaption></figure>`;
  }
  if(slide.kind==='one-stop') {
    return `<div class="w9-route-slide">
      <div class="w9-route"><span>Leicester Square</span><span>Covent Garden</span></div>
      <p>${ja?'ピカデリー線で1駅':'One stop on the Piccadilly line'}</p>
      <h1>${title}</h1></div>`;
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
