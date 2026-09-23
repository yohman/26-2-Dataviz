/* Weekly teaching content is edited in content/weeks/*.md. */
const COURSE_CONFIG = {
  GOOGLE_FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSctVgkCDhtkaG8UscBrVJVteqBiCFXHCB_tlQFscdM8wU4xAg/viewform',
  GOOGLE_FORM_WEEK_ENTRY_ID: 'entry.155622460',
  GALLERY_API_URL: 'https://script.google.com/macros/s/AKfycbyMs5EMzHkKXnHGE0LH-H4r1RnrZXYw77WiWO_vhb7gHL9ZFGzDYpJIwVhsookMCSmjsA/exec'
};

const acts = {
  SEE: ['Weeks 1–2 · Learn to notice', '第1〜2週 · 見ることを学ぶ'],
  MAKE: ['Weeks 3–7 · Build visual language', '第3〜7週 · 視覚言語をつくる'],
  QUESTION: ['Weeks 8–12 · Frame an argument', '第8〜12週 · 主張を組み立てる'],
  REVEAL: ['Weeks 13–14 · Make it public', '第13〜14週 · 社会に開く']
};

const weekFiles = [
  '01-why-visualize.md', '02-make-it-legible.md', '03-be-hans.md', '04-find-the-unexpected.md',
  '05-python-history-evidence.md', '06-dubois-public-argument.md', '07-shared-dataset.md',
  '08-share-discuss-build.md', '09-studio-test-improve.md', '10-midterm-presentations.md',
  '11-maps-spatial-thinking.md', '12-networks-multiview.md', '13-final-project-studio.md',
  '14-final-presentations.md'
];

let weeks = [];
let galleryItemsPromise;
const galleryImageCache = new Map();

const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const isJapanese = () => window.courseLanguage === 'ja';
const copy = (english, japanese) => isJapanese() ? japanese : english;
const weekFor = number => weeks.find(week => week.week === Number(number));
const actForWeek = number => weekFor(number)?.act || (number <= 2 ? 'SEE' : number <= 7 ? 'MAKE' : number <= 12 ? 'QUESTION' : 'REVEAL');
const challengeForWeek = number => {
  const week = weekFor(number);
  return week ? copy(week.challenge, week.challenge_ja) : '';
};

function parseMaterials(source) {
  const block = source.match(/^##\s+Materials\s*\n([\s\S]*?)(?=^##\s+|$(?![\s\S]))/mi)?.[1] || '';
  return [...block.matchAll(/^-\s+\[([^\]]+)\]\(([^)]+)\)\s*(?:\{(slides|data|reference)\})?\s*$/gmi)]
    .map(([, label, href, type]) => ({ label: label.trim(), href: href.trim(), type: type || '' }));
}

function parseWeek(source, file) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing front matter`);
  const meta = {};
  match[1].split('\n').forEach(line => {
    const separator = line.indexOf(':');
    if (separator >= 0) meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
  });
  const required = ['week', 'act', 'course_date', 'date', 'date_ja', 'title', 'title_ja', 'look', 'look_ja', 'learn', 'learn_ja', 'homework', 'homework_ja', 'challenge', 'challenge_ja', 'tools', 'tools_ja'];
  const missing = required.filter(key => !meta[key]);
  if (missing.length) throw new Error(`${file}: missing ${missing.join(', ')}`);
  if (Boolean(meta.in_class) !== Boolean(meta.in_class_ja)) throw new Error(`${file}: in_class and in_class_ja must be provided together`);
  if (!acts[meta.act]) throw new Error(`${file}: unknown act ${meta.act}`);
  return { ...meta, week: Number(meta.week), materials: parseMaterials(match[2]) };
}

function safeResourceHref(value) {
  const href = String(value || '').trim();
  if (/^https?:\/\//i.test(href)) return encodeURI(href);
  if (/^(?:assets|data|lectures)\//.test(href) || /^[a-z-]+\.html(?:#[-\w]+)?$/i.test(href)) return encodeURI(href);
  return '';
}

function materialLinks(materials) {
  return [...materials].sort((first, second) => Number(second.type === 'slides') - Number(first.type === 'slides')).map(material => {
    const href = safeResourceHref(material.href);
    if (!href) return '';
    const type = material.type || (href.includes('lectures/') ? 'slides' : href.startsWith('data/') ? 'data' : 'reference');
    const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener"' : '';
    return `<a class="material-link material-link--${type}" href="${escapeHtml(href)}"${external}>${escapeHtml(material.label)} ↗</a>`;
  }).join('');
}

function setupShell() {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  menuButton?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a').forEach(link => {
    if (link.getAttribute('href') === current) link.setAttribute('aria-current', 'page');
  });

  const translations = window.COURSE_TRANSLATIONS?.ja || {};
  const title = document.title;
  const nodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.nodeValue.trim() && !['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName)
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  while (walker.nextNode()) nodes.push({ node: walker.currentNode, english: walker.currentNode.nodeValue });
  const languageButton = document.createElement('button');
  languageButton.className = 'language-toggle';
  languageButton.type = 'button';
  nav?.append(languageButton);

  function applyLanguage(language) {
    window.courseLanguage = language;
    document.documentElement.lang = language;
    nodes.forEach(({ node, english }) => {
      const key = english.trim();
      node.nodeValue = language === 'ja' && translations[key] ? english.replace(key, translations[key]) : english;
    });
    document.title = language === 'ja' && translations[title] ? translations[title] : title;
    languageButton.textContent = language === 'ja' ? 'EN' : 'JP';
    languageButton.setAttribute('aria-label', language === 'ja' ? 'Switch to English' : '日本語に切り替える');
    try { localStorage.setItem('dv-language', language); } catch { /* Storage may be blocked. */ }
    if (weeks.length) renderCourse();
    if (document.querySelector('[data-gallery]')) renderGallery();
  }

  let language = 'en';
  try { language = localStorage.getItem('dv-language') || 'en'; } catch { /* English remains the fallback. */ }
  applyLanguage(language);
  languageButton.addEventListener('click', () => applyLanguage(language = language === 'en' ? 'ja' : 'en'));
}

function renderAgenda() {
  const root = document.querySelector('[data-agenda]');
  if (!root) return;
  const today = todayInTokyo();
  const focusedWeek = weeks.find(week => week.course_date >= today) || weeks.at(-1);
  let html = '', active = '';
  weeks.forEach((week, index) => {
    if (week.act !== active) {
      active = week.act;
      html += `<div class="act-band" data-act="${active}"><div class="wrap"><h2>${active}</h2><p>${copy(...acts[active])}</p></div></div><section class="wrap week-list">`;
    }
    const no = String(week.week).padStart(2, '0');
    const image = safeResourceHref(week.image);
    const media = image ? `<figure class="week-visual"><img src="${escapeHtml(image)}" alt="" loading="lazy"><figcaption>${copy('From the lecture slides', '講義スライドより')}</figcaption></figure>` : `<figure class="week-visual week-visual--placeholder"><figcaption>${copy('Add a project image, prototype, or dataset preview here.', 'プロジェクト画像、プロトタイプ、データのプレビューをここに追加。')}</figcaption></figure>`;
    const status = week.week === focusedWeek?.week ? `<span class="week-status">${copy(week.course_date === today ? 'TODAY' : 'START HERE', week.course_date === today ? '今日' : 'ここから')}</span>` : '';
    const preview = `<span class="week-preview"><span><b>${copy('PRACTICE', '実践')}</b>${escapeHtml(copy(week.learn, week.learn_ja))}</span><span><b>${copy('TOOLS', 'ツール')}</b>${escapeHtml(copy(week.tools, week.tools_ja))}</span></span>`;
    const route = `<section class="week-route" aria-label="${copy('This week at a glance', '今週の流れ')}"><div><span>01</span><p><b>${copy('LECTURE', '講義')}</b><small>${copy('Look and learn', '見る・学ぶ')}</small></p></div><div><span>02</span><p><b>${copy('TOOLS', 'ツール')}</b><small>${escapeHtml(copy(week.tools, week.tools_ja))}</small></p></div><div><span>03</span><p><b>${copy('IN CLASS', '授業内')}</b><small>${copy('Try it together', '一緒に試す')}</small></p></div><div><span>04</span><p><b>${copy('HOMEWORK', '宿題')}</b><small>${copy('Continue after class', '授業後に続ける')}</small></p></div></section>`;
    const inClass = week.in_class ? `<article class="assignment-card assignment-card--in-class"><p class="assignment-label">${copy('IN CLASS', '授業内課題')}</p><h4>${copy('Try it with the class', 'クラスで試す')}</h4><p>${escapeHtml(copy(week.in_class, week.in_class_ja))}</p></article>` : '';
    const submission = configuredFormUrl()
      ? `<div class="assignment-submit"><a class="button" target="_blank" rel="noopener" href="${formUrl(week.week, week.challenge_ja || week.challenge)}">${copy('Submit homework', '宿題を提出する')}</a></div>`
      : `<p class="assignment-note">${copy('The submission link will appear here.', '提出リンクはここに表示されます。')}</p>`;
    html += `<details class="week" id="week-${week.week}"${week.week === focusedWeek?.week ? ' open' : ''}><summary class="week-summary"><span class="week-index"><span class="week-number">${no}</span><span class="week-date">${escapeHtml(copy(week.date, week.date_ja))}</span></span><span class="week-summary-main"><span class="week-meta"><span>${week.act}</span><span>${copy(`Week ${week.week}`, `第${week.week}週`)}</span>${status}</span><span class="week-title">${escapeHtml(copy(week.title, week.title_ja))}</span>${preview}</span><span class="week-toggle"><span class="week-toggle-closed">${copy('Open week', '週の内容を見る')}</span><span class="week-toggle-open">${copy('Close week', '週の内容を閉じる')}</span><b aria-hidden="true">↓</b></span></summary><div class="week-body">${route}<section class="week-lecture"><div class="week-section-heading"><div><p class="week-section-label">${copy('LECTURE', '講義')}</p><h3>${copy('What to expect', '今週の講義')}</h3></div><p>${copy('Start here before you begin the work.', 'まずここから始めましょう。')}</p></div><div class="week-heading"><div class="week-grid"><div><h3>${copy('WE WILL LOOK AT', '見るもの')}</h3><p>${escapeHtml(copy(week.look, week.look_ja))}</p></div><div><h3>${copy('WE WILL PRACTICE', '実践すること')}</h3><p>${escapeHtml(copy(week.learn, week.learn_ja))}</p></div></div>${media}</div><aside class="week-tools"><p>${copy('TOOLS YOU’LL USE', '使うツール')}</p><strong>${escapeHtml(copy(week.tools, week.tools_ja))}</strong></aside><div class="week-materials"><span>${copy('START HERE', 'まず開く')}</span>${materialLinks(week.materials)}</div></section><section class="week-assignments"><div class="week-assignment-heading"><div><p class="week-section-label">${copy('ASSIGNMENTS', '課題')}</p><h3>${copy('Try it together, then continue at home.', '一緒に試して、授業後に続けよう。')}</h3></div><p>${copy('The left card is for class. The right card is your next step after class.', '左のカードは授業内、右のカードは授業後の次のステップです。')}</p></div><div class="assignment-grid">${inClass}<article class="assignment-card assignment-card--homework"><p class="assignment-label">${copy('HOMEWORK', '宿題')}</p><h4>${escapeHtml(copy(week.challenge, week.challenge_ja))}</h4><p>${escapeHtml(copy(week.homework, week.homework_ja))}</p><dl class="assignment-details"><div><dt>${copy('DELIVERABLES', '提出物')}</dt><dd>${copy('Visualization, title, concise explanation, project link, and one screenshot.', '可視化、タイトル、短い説明、作品リンク、スクリーンショット1枚。')}</dd></div><div><dt>${copy('SUGGESTED TOOLS', 'おすすめのツール')}</dt><dd>${escapeHtml(copy(week.tools, week.tools_ja))}</dd></div></dl>${submission}</article></div></section></div></details>`;
    if (!weeks[index + 1] || weeks[index + 1].act !== active) html += '</section>';
  });
  root.innerHTML = html;
}

function configuredFormUrl() {
  return /^https:\/\/docs\.google\.com\/forms\//.test(COURSE_CONFIG.GOOGLE_FORM_URL) && !COURSE_CONFIG.GOOGLE_FORM_URL.includes('REPLACE');
}

function formUrl(week, challengeJa) {
  const params = new URLSearchParams();
  params.set(COURSE_CONFIG.GOOGLE_FORM_WEEK_ENTRY_ID, `第${week}週｜${challengeJa}`);
  return `${COURSE_CONFIG.GOOGLE_FORM_URL}?usp=pp_url&${params}`;
}

function todayInTokyo() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts();
  const value = type => parts.find(part => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function renderHome() {
  const root = document.querySelector('[data-next-week]');
  if (!root) return;
  const next = weeks.find(week => week.course_date >= todayInTokyo()) || weeks.at(-1);
  if (!next) return;
  const no = String(next.week).padStart(2, '0');
  root.innerHTML = `<p class="eyebrow">${copy('NEXT WEEK', '次の週')}</p><p class="next-number">${no}</p><h2>${escapeHtml(copy(next.challenge, next.challenge_ja))}</h2><p>${escapeHtml(copy(next.homework, next.homework_ja))}</p><a href="agenda.html#week-${next.week}">${copy('Open this week →', 'この週を開く →')}</a>`;
}

function option(value, label) { const item = document.createElement('option'); item.value = value; item.textContent = label; return item; }
function safeUrl(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function element(tag, text, className) { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; }

function requestGalleryItems() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    let settled = false;
    const timer = setTimeout(() => finish(new Error('Gallery feed timed out')), 12000);
    function finish(error, payload) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.remove();
      delete window.courseGalleryReceive;
      if (error || !Array.isArray(payload?.items)) reject(error || new Error('Invalid gallery data'));
      else resolve(payload.items);
    }
    window.courseGalleryReceive = payload => finish(null, payload);
    script.onerror = () => finish(new Error('Gallery feed unavailable'));
    script.src = `${COURSE_CONFIG.GALLERY_API_URL}?callback=courseGalleryReceive`;
    document.head.append(script);
  });
}

function loadGalleryItems() {
  if (!galleryItemsPromise) galleryItemsPromise = (async () => {
    if (COURSE_CONFIG.GALLERY_API_URL.includes('REPLACE')) throw new Error('Gallery feed is not configured');
    for (let attempt = 0; attempt < 3; attempt++) {
      try { return await requestGalleryItems(); }
      catch (error) {
        if (attempt === 2) throw error;
        await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  })().catch(error => { galleryItemsPromise = null; throw error; });
  return galleryItemsPromise;
}

function requestGalleryImage(index) {
  return new Promise((resolve, reject) => {
    const callback = `courseGalleryImageReceive_${index}`;
    const script = document.createElement('script');
    let settled = false;
    const timer = setTimeout(() => finish(new Error('Screenshot timed out')), 15000);
    function finish(error, payload) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.remove();
      delete window[callback];
      if (error || payload?.index !== index) reject(error || new Error('Invalid screenshot'));
      else resolve(payload.data || '');
    }
    window[callback] = payload => finish(null, payload);
    script.onerror = () => finish(new Error('Screenshot unavailable'));
    script.src = `${COURSE_CONFIG.GALLERY_API_URL}?image=${index}&callback=${callback}`;
    document.head.append(script);
  });
}

function loadGalleryImage(index) {
  if (!Number.isInteger(index) || index < 0) return Promise.resolve('');
  if (galleryImageCache.has(index)) return galleryImageCache.get(index);
  const promise = (async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const data = await requestGalleryImage(index);
        if (data) return data;
      } catch (error) {
        if (attempt === 2) console.error('Gallery screenshot:', error);
      }
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
    }
    return '';
  })().then(data => {
    if (!data) galleryImageCache.delete(index);
    return data;
  });
  galleryImageCache.set(index, promise);
  if (galleryImageCache.size > 24) galleryImageCache.delete(galleryImageCache.keys().next().value);
  return promise;
}

async function renderGallery() {
  const root = document.querySelector('[data-gallery]');
  if (!root || root.dataset.rendering === 'true') return;
  root.dataset.rendering = 'true';
  const status = document.querySelector('[data-gallery-status]');
  status.textContent = copy('Loading student work…', '学生作品を読み込んでいます…');
  let items;
  try {
    items = await loadGalleryItems();
    status.textContent = copy(`${items.length} latest public works.`, `最新の公開作品 ${items.length} 点。`);
  } catch (error) {
    status.replaceChildren(element('span', copy('Student work is temporarily unavailable. ', '学生作品を読み込めませんでした。')));
    const retry = element('button', copy('Try again', '再読み込み'), 'gallery-retry');
    retry.type = 'button';
    retry.addEventListener('click', renderGallery);
    status.append(retry);
    root.replaceChildren();
    root.dataset.rendering = '';
    console.error('Gallery feed:', error);
    return;
  }
  root.dataset.rendering = '';
  const controls = document.querySelector('[data-gallery-filters]');
  controls.replaceChildren();
  const filters = [
    ['week', copy('Week', '週'), [['all', copy('All weeks', 'すべての週')], ...Array.from({ length: 14 }, (_, index) => [String(index + 1), copy(`Week ${index + 1}`, `第${index + 1}週`)])]],
    ['challenge', copy('Challenge', '課題'), [['all', copy('All challenges', 'すべての課題')], ...[...new Map(items.map(item => [item.week, item.challenge])).entries()].sort((a, b) => a[0] - b[0]).map(([week, challenge]) => [String(week), challenge])]],
    ['tool', copy('Tool', 'ツール'), [['all', copy('All tools', 'すべてのツール')], ...[...new Set(items.flatMap(item => String(item.tools || '').split(',').map(tool => tool.trim()).filter(Boolean)))].sort().map(tool => [tool, tool])]],
    ['act', copy('Course act', '授業の段階'), [['all', copy('All acts', 'すべての段階')], ...Object.keys(acts).map(act => [act, act])]]
  ];
  const selects = {};
  filters.forEach(([name, label, values]) => {
    const wrapper = element('label', label, 'gallery-filter');
    const select = document.createElement('select'); select.name = name;
    values.forEach(([value, text]) => select.append(option(value, text)));
    wrapper.append(select); controls.append(wrapper); selects[name] = select;
  });
  let imageObserver;
  function paint() {
    imageObserver?.disconnect();
    const shown = items.filter(item => (selects.week.value === 'all' || String(item.week) === selects.week.value)
      && (selects.challenge.value === 'all' || String(item.week) === selects.challenge.value)
      && (selects.tool.value === 'all' || String(item.tools).split(',').map(tool => tool.trim()).includes(selects.tool.value))
      && (selects.act.value === 'all' || actForWeek(item.week) === selects.act.value));
    root.replaceChildren();
    if (!shown.length) { root.append(element('p', copy('No public submissions match these filters yet.', 'このフィルターに一致する公開作品はまだありません。'), 'gallery-status')); return; }
    const showImage = async (placeholder, item) => {
      const data = await loadGalleryImage(Number(item.imageIndex));
      if (!placeholder.isConnected) return;
      if (/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(data)) {
        const image = document.createElement('img'); image.src = data;
        image.alt = copy(`Screenshot of ${item.title || 'student work'}`, `${item.title || '学生作品'}のスクリーンショット`);
        image.loading = 'lazy'; placeholder.replaceWith(image);
      } else {
        placeholder.replaceChildren(element('span', copy('Screenshot unavailable. ', '画像を表示できません。')));
        const retry = element('button', copy('Try again', '再読み込み'), 'gallery-retry');
        retry.type = 'button';
        retry.addEventListener('click', () => {
          retry.remove();
          placeholder.firstChild.textContent = copy('Loading screenshot…', '画像を読み込んでいます…');
          showImage(placeholder, item);
        });
        placeholder.append(retry);
      }
    };
    if ('IntersectionObserver' in window) imageObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      imageObserver.unobserve(entry.target);
      showImage(entry.target, shown[Number(entry.target.dataset.itemIndex)]);
    }), { rootMargin: '400px' });
    shown.forEach((item, index) => {
      const card = element('article', '', 'gallery-card'); card.dataset.week = item.week; card.dataset.act = actForWeek(item.week);
      const placeholder = element('div', copy('Loading screenshot…', '画像を読み込んでいます…'), 'gallery-placeholder');
      placeholder.dataset.itemIndex = index; card.append(placeholder);
      const weekLink = element('a', `${copy(`WEEK ${item.week}`, `第${item.week}週`)} · ${challengeForWeek(item.week) || String(item.challenge || '').replace(/^第\d+週｜/, '')}`, 'meta');
      weekLink.href = `agenda.html#week-${item.week}`; card.append(weekLink);
      card.append(element('h2', item.title || copy('Untitled work', '無題の作品')));
      card.append(element('p', item.studentName || copy('Student', '学生')));
      card.append(element('p', item.description || ''));
      card.append(element('p', `${copy('Tools:', 'ツール:')} ${item.tools || '—'}`));
      if (item.submittedAt) card.append(element('p', `${copy('Submitted:', '提出日:')} ${item.submittedAt}`, 'gallery-date'));
      const projectUrl = safeUrl(item.projectUrl);
      if (projectUrl) { const link = element('a', copy('Open work ↗', '作品を開く ↗')); link.href = projectUrl; link.target = '_blank'; link.rel = 'noopener'; card.append(link); }
      root.append(card);
      if (imageObserver) imageObserver.observe(placeholder);
      else showImage(placeholder, item);
    });
  }
  Object.values(selects).forEach(select => select.addEventListener('change', paint));
  paint();
}

function renderCourse() {
  renderAgenda();
  renderHome();
}

async function loadWeeks() {
  if (!document.querySelector('[data-agenda], [data-next-week]')) return;
  document.querySelectorAll('[data-agenda]').forEach(root => {
    root.innerHTML = `<p class="gallery-status">${copy('Loading course content…', '授業内容を読み込んでいます…')}</p>`;
  });
  try {
    const loaded = await Promise.all(weekFiles.map(file => fetch(`content/weeks/${file}`, { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error(`${file}: could not load`);
      return response.text().then(source => parseWeek(source, file));
    })));
    weeks = loaded.sort((first, second) => first.week - second.week);
    if (weeks.length !== 14 || weeks.some((week, index) => week.week !== index + 1)) throw new Error('Week files must cover Weeks 01–14 in order.');
    renderCourse();
  } catch (error) {
    const message = copy('Course content could not load. Please try again shortly.', '授業内容を読み込めませんでした。少し待ってからもう一度試してください。');
    document.querySelectorAll('[data-agenda]').forEach(root => {
      root.innerHTML = `<p class="gallery-status">${escapeHtml(message)}</p>`;
    });
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupShell();
  loadWeeks();
});
