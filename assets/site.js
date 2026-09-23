/* Weekly teaching content is edited in content/weeks/*.md. */
const COURSE_CONFIG = {
  GOOGLE_FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSctVgkCDhtkaG8UscBrVJVteqBiCFXHCB_tlQFscdM8wU4xAg/viewform',
  GOOGLE_FORM_WEEK_ENTRY_ID: 'entry.155622460',
  GALLERY_API_URL: 'https://script.google.com/macros/s/REPLACE_WITH_WEB_APP_ID/exec'
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

const sampleSubmissions = [
  { timestamp: '2026-10-13T10:00:00Z', studentId: 'demo-a', studentName: 'Aiko S.', week: 3, title: 'After the Rain', description: 'A comparison of evacuation-center capacity after severe rainfall.', tools: 'Tableau', projectUrl: '#', imageUrl: '', consent: true },
  { timestamp: '2026-10-21T10:00:00Z', studentId: 'demo-b', studentName: 'Ren K.', week: 4, title: 'Same summary, different city', description: 'A Datasaurus-inspired look at neighborhood averages.', tools: 'Python', projectUrl: '#', imageUrl: '', consent: true },
  { timestamp: '2026-11-11T10:00:00Z', studentId: 'demo-c', studentName: 'Mina T.', week: 7, title: 'Five minutes from shade', description: 'Walking access to cool public places in summer.', tools: 'Kepler.gl, GeoJSON', projectUrl: '#', imageUrl: '', consent: true }
];

const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const isJapanese = () => window.courseLanguage === 'ja';
const copy = (english, japanese) => isJapanese() ? japanese : english;
const weekFor = number => weeks.find(week => week.week === Number(number));
const actForWeek = number => weekFor(number)?.act || '';
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
    html += `<details class="week" id="week-${week.week}"${week.week === focusedWeek?.week ? ' open' : ''}><summary class="week-summary"><span class="week-index"><span class="week-number">${no}</span><span class="week-date">${escapeHtml(copy(week.date, week.date_ja))}</span></span><span class="week-summary-main"><span class="week-meta"><span>${week.act}</span><span>${copy(`Week ${week.week}`, `第${week.week}週`)}</span>${status}</span><span class="week-title">${escapeHtml(copy(week.title, week.title_ja))}</span>${preview}</span><span class="week-toggle"><span class="week-toggle-closed">${copy('Open week', '週の内容を見る')}</span><span class="week-toggle-open">${copy('Close week', '週の内容を閉じる')}</span><b aria-hidden="true">↓</b></span></summary><div class="week-body">${route}<section class="week-lecture"><div class="week-section-heading"><div><p class="week-section-label">${copy('LECTURE', '講義')}</p><h3>${copy('What to expect', '今週の講義')}</h3></div><p>${copy('Start here before you begin the work.', 'まずここから始めましょう。')}</p></div><div class="week-heading"><div class="week-grid"><div><h3>${copy('WE WILL LOOK AT', '見るもの')}</h3><p>${escapeHtml(copy(week.look, week.look_ja))}</p></div><div><h3>${copy('WE WILL PRACTICE', '実践すること')}</h3><p>${escapeHtml(copy(week.learn, week.learn_ja))}</p></div></div>${media}</div><aside class="week-tools"><p>${copy('TOOLS YOU’LL USE', '使うツール')}</p><strong>${escapeHtml(copy(week.tools, week.tools_ja))}</strong></aside><div class="week-materials"><span>${copy('START HERE', 'まず開く')}</span>${materialLinks(week.materials)}</div></section><section class="week-assignments"><div class="week-assignment-heading"><div><p class="week-section-label">${copy('ASSIGNMENTS', '課題')}</p><h3>${copy('Try it together, then continue at home.', '一緒に試して、授業後に続けよう。')}</h3></div><p>${copy('The left card is for class. The right card is your next step after class.', '左のカードは授業内、右のカードは授業後の次のステップです。')}</p></div><div class="assignment-grid">${inClass}<article class="assignment-card assignment-card--homework"><p class="assignment-label">${copy('HOMEWORK', '宿題')}</p><h4>${escapeHtml(copy(week.challenge, week.challenge_ja))}</h4><p>${escapeHtml(copy(week.homework, week.homework_ja))}</p><dl class="assignment-details"><div><dt>${copy('DELIVERABLES', '提出物')}</dt><dd>${copy('Visualization, title, concise explanation, and source link.', '可視化、タイトル、短い説明、出典リンク。')}</dd></div><div><dt>${copy('SUGGESTED TOOLS', 'おすすめのツール')}</dt><dd>${escapeHtml(copy(week.tools, week.tools_ja))}</dd></div></dl>${submission}</article></div></section></div></details>`;
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

function normalizeSubmission(item) {
  return { ...item, week: Number(item.week), consent: item.consent === true || String(item.consent).toLowerCase() === 'true' };
}

function latestPublic(rows) {
  const latest = new Map();
  rows.map(normalizeSubmission).filter(item => item.consent && item.studentId && item.week).forEach(item => {
    const key = `${item.studentId}-${item.week}`;
    const previous = latest.get(key);
    if (!previous || new Date(item.timestamp) > new Date(previous.timestamp)) latest.set(key, item);
  });
  return [...latest.values()];
}

function option(value, label) { const item = document.createElement('option'); item.value = value; item.textContent = label; return item; }
function safeUrl(value) {
  if (value === '#') return '#';
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function element(tag, text, className) { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; }

async function renderGallery() {
  const root = document.querySelector('[data-gallery]');
  if (!root || root.dataset.rendering === 'true') return;
  root.dataset.rendering = 'true';
  const status = document.querySelector('[data-gallery-status]');
  let items = sampleSubmissions;
  status.textContent = copy('Loading student work…', '学生作品を読み込んでいます…');
  try {
    if (!COURSE_CONFIG.GALLERY_API_URL.includes('REPLACE')) {
      const response = await fetch(COURSE_CONFIG.GALLERY_API_URL);
      if (!response.ok) throw new Error('Endpoint unavailable');
      items = await response.json();
      status.textContent = copy('Latest public student work.', '最新の公開許可済み学生作品。');
    } else status.textContent = copy('Demo gallery: connect the read-only endpoint to show this semester’s work.', 'デモギャラリー：この学期の作品を表示するには読み取り専用エンドポイントを接続してください。');
  } catch {
    status.textContent = copy('Gallery endpoint unavailable. Showing demo work.', 'ギャラリーのエンドポイントに接続できません。デモ作品を表示しています。');
  }
  root.dataset.rendering = '';
  items = latestPublic(Array.isArray(items) ? items : []);
  const controls = document.querySelector('[data-gallery-filters]');
  controls.replaceChildren();
  const filters = [
    ['week', copy('Week', '週'), [['all', copy('All weeks', 'すべての週')], ...weeks.map(week => [String(week.week), copy(`Week ${week.week}`, `第${week.week}週`)])]],
    ['challenge', copy('Challenge', '課題'), [['all', copy('All challenges', 'すべての課題')], ...weeks.map(week => [String(week.week), copy(week.title, week.title_ja)])]],
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
  function paint() {
    const shown = items.filter(item => (selects.week.value === 'all' || String(item.week) === selects.week.value)
      && (selects.challenge.value === 'all' || String(item.week) === selects.challenge.value)
      && (selects.tool.value === 'all' || String(item.tools).split(',').map(tool => tool.trim()).includes(selects.tool.value))
      && (selects.act.value === 'all' || actForWeek(item.week) === selects.act.value));
    root.replaceChildren();
    if (!shown.length) { root.append(element('p', copy('No public submissions match these filters yet.', 'このフィルターに一致する公開作品はまだありません。'), 'gallery-status')); return; }
    shown.forEach(item => {
      const card = element('article', '', 'gallery-card'); card.dataset.week = item.week; card.dataset.act = actForWeek(item.week);
      const imageUrl = safeUrl(item.imageUrl);
      if (imageUrl) { const image = document.createElement('img'); image.src = imageUrl; image.alt = `${item.title || challengeForWeek(item.week)} student visualization`; card.append(image); }
      else card.append(element('div', '', 'gallery-placeholder'));
      card.append(element('p', `${copy(`WEEK ${item.week}`, `第${item.week}週`)} · ${challengeForWeek(item.week)}`, 'meta'));
      card.append(element('h2', item.title || copy('Untitled work', '無題の作品')));
      card.append(element('p', item.studentName || copy('Student', '学生')));
      card.append(element('p', item.description || ''));
      card.append(element('p', `${copy('Tools:', 'ツール:')} ${item.tools || '—'}`));
      const projectUrl = safeUrl(item.projectUrl);
      if (projectUrl) { const link = element('a', copy('Open work ↗', '作品を開く ↗')); link.href = projectUrl; link.target = '_blank'; link.rel = 'noopener'; card.append(link); }
      root.append(card);
    });
  }
  Object.values(selects).forEach(select => select.addEventListener('change', paint));
  paint();
}

function renderCourse() {
  renderAgenda();
  renderHome();
  renderGallery();
}

async function loadWeeks() {
  if (!document.querySelector('[data-agenda], [data-gallery], [data-next-week]')) return;
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
