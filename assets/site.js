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
let submissionDeadlineTimer;
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

function parseInClassActivities(source) {
  const block = source.match(/^##\s+In Class Activities\s*\n([\s\S]*?)(?=^##\s+|$(?![\s\S]))/mi)?.[1] || '';
  return block.split(/^###\s+Activity\s+/gmi).slice(1).map(chunk => {
    const lines = chunk.split('\n');
    const number = Number(lines.shift()?.trim());
    const activity = { number, steps: [], steps_ja: [] };
    let list = '';
    lines.forEach(line => {
      const field = line.match(/^(title|title_ja|text|text_ja|link|link_label|link_label_ja):\s*(.*)$/);
      if (field) { activity[field[1]] = field[2].trim(); list = ''; return; }
      const listStart = line.match(/^(steps|steps_ja):\s*$/);
      if (listStart) { list = listStart[1]; return; }
      const item = line.match(/^\s*-\s+(.+)$/);
      if (item && list) activity[list].push(item[1].trim());
    });
    return activity;
  }).filter(activity => activity.number && activity.title && activity.title_ja && activity.text && activity.text_ja && activity.steps.length && activity.steps_ja.length);
}

function parseMoriCorner(source) {
  const block = source.match(/^##\s+Mori's Corner\s*\n([\s\S]*?)(?=^##\s+|$(?![\s\S]))/mi)?.[1] || '';
  const fields = {};
  block.split('\n').forEach(line => {
    const match = line.match(/^(title|title_ja|text|text_ja|link|link_label|link_label_ja|file|file_label|file_label_ja):\s*(.*)$/);
    if (match) fields[match[1]] = match[2].trim();
  });
  return fields;
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
  if (Boolean(meta.deliverables) !== Boolean(meta.deliverables_ja)) throw new Error(`${file}: deliverables and deliverables_ja must be provided together`);
  if (!acts[meta.act]) throw new Error(`${file}: unknown act ${meta.act}`);
  return { ...meta, week: Number(meta.week), materials: parseMaterials(match[2]), activities: parseInClassActivities(match[2]), mori: parseMoriCorner(match[2]) };
}

function safeResourceHref(value) {
  const href = String(value || '').trim();
  if (/^https?:\/\//i.test(href)) return encodeURI(href);
  if (/^(?:assets|content|data|lectures)\//.test(href) && !href.split('/').includes('..')) return encodeURI(href);
  if (/^[a-z-]+\.html(?:#[-\w]+)?$/i.test(href)) return encodeURI(href);
  return '';
}

function materialLinks(materials, context = {}) {
  return [...materials].sort((first, second) => Number(second.type === 'slides') - Number(first.type === 'slides')).map(material => {
    const href = safeResourceHref(material.href);
    if (!href) return '';
    const type = material.type || (href.includes('lectures/') ? 'slides' : href.startsWith('data/') ? 'data' : 'reference');
    const previewableSlides = type === 'slides' && /^lectures\/[A-Za-z0-9._-]+\.pdf$/i.test(href) && context.week;
    const linkHref = previewableSlides
      ? `viewer.html?file=${encodeURIComponent(href)}&title=${encodeURIComponent(material.label)}&week=${encodeURIComponent(`Week ${context.week}`)}&return=${encodeURIComponent(context.returnTo || `agenda.html#week-${context.week}`)}`
      : href;
    const external = /^https?:\/\//i.test(linkHref) ? ' target="_blank" rel="noopener"' : '';
    return `<a class="material-link material-link--${type}" href="${escapeHtml(linkHref)}"${external}>${escapeHtml(material.label)} ${external ? '↗' : '→'}</a>`;
  }).join('');
}

function classAgenda(week) {
  const raw = copy(week.schedule, week.schedule_ja);
  if (!raw) return '';
  const items = raw.split(';').map(item => item.split('|').map(part => part.trim())).filter(item => item.length === 3);
  if (!items.length) return '';
  return `<ol class="class-agenda" aria-label="${copy('Class timing', '授業の時間配分')}">${items.map(([time, title, description]) => `<li><time>${escapeHtml(time)}</time><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></li>`).join('')}</ol>`;
}

function createMoriCorner(week) {
  const note = week.mori || {};
  const corner = element('aside', '', 'mori-corner');
  corner.setAttribute('aria-label', copy("Mori's corner", 'モリのコーナー'));
  const avatar = document.createElement('img');
  avatar.src = 'assets/images/mori-avatar.webp';
  avatar.alt = copy('Illustrated portrait of Mori, the teaching assistant', 'TAのモリのイラスト');
  avatar.width = 96; avatar.height = 96; avatar.loading = 'lazy';
  corner.append(avatar);
  const content = element('div', '', 'mori-content');
  content.append(element('p', copy("MORI'S CORNER · YOUR TA", 'モリのコーナー · TA'), 'mori-kicker'));
  content.append(element('h3', copy(note.title || "Mori’s quiet suspicion", note.title_ja || 'モリの小さな疑い')));
  content.append(element('p', copy(note.text || 'Charts can be shy. If one looks obvious, ask it one more question—the interesting part may be hiding behind the average.', note.text_ja || 'グラフは少し人見知りです。「当たり前」に見えたら、もう一つ質問してみよう。面白いところは、平均値の後ろに隠れているかもしれません。'), 'mori-text'));
  const links = element('div', '', 'mori-links');
  const link = safeUrl(note.link) || safeResourceHref(note.link);
  const file = safeResourceHref(note.file);
  [[link, copy(note.link_label || 'Explore the link ↗', note.link_label_ja || 'リンクを開く ↗')],
    [file, copy(note.file_label || 'Open the file ↗', note.file_label_ja || 'ファイルを開く ↗')]].forEach(([href, label]) => {
    if (!href) return;
    const anchor = element('a', label); anchor.href = href;
    if (/^https?:\/\//.test(href)) { anchor.target = '_blank'; anchor.rel = 'noopener'; }
    links.append(anchor);
  });
  if (links.childElementCount) content.append(links);
  corner.append(content);
  return corner;
}

function activityTabs(week) {
  if (!week.activities?.length) return '';
  const tabs = week.activities.map((activity, index) => `<button type="button" role="tab" id="week-${week.week}-activity-${activity.number}-tab" aria-controls="week-${week.week}-activity-${activity.number}" aria-selected="${index === 0}" tabindex="${index === 0 ? '0' : '-1'}">${copy(`Activity ${activity.number}`, `アクティビティ ${activity.number}`)}</button>`).join('');
  const panels = week.activities.map((activity, index) => {
    const href = safeUrl(activity.link) || safeResourceHref(activity.link);
    const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener"' : '';
    const download = /^data\/[A-Za-z0-9._/-]+\.csv$/i.test(href) ? ' download' : '';
    const link = href ? `<a class="button activity-link" href="${escapeHtml(href)}"${external}${download}>${escapeHtml(copy(activity.link_label, activity.link_label_ja))}${external ? ' ↗' : ' ↓'}</a>` : '';
    const steps = copy(activity.steps, activity.steps_ja).map(step => `<li>${escapeHtml(step)}</li>`).join('');
    return `<section class="activity-panel" role="tabpanel" id="week-${week.week}-activity-${activity.number}" aria-labelledby="week-${week.week}-activity-${activity.number}-tab"${index === 0 ? '' : ' hidden'}>
      <p class="assignment-label">${copy('IN CLASS', '授業内')} · ${copy(`ACTIVITY ${activity.number}`, `アクティビティ ${activity.number}`)}</p>
      <h4>${escapeHtml(copy(activity.title, activity.title_ja))}</h4>
      <p>${escapeHtml(copy(activity.text, activity.text_ja))}</p>
      <ol class="activity-steps">${steps}</ol>${link}
    </section>`;
  }).join('');
  return `<article class="assignment-card assignment-card--in-class activity-tabs-card" data-activity-tabs><div class="activity-tab-list" role="tablist" aria-label="${copy('In-class activities', '授業内アクティビティ')}">${tabs}</div>${panels}</article>`;
}

function setupActivityTabs(root) {
  root.querySelectorAll('[data-activity-tabs]').forEach(component => {
    const tabs = [...component.querySelectorAll('[role="tab"]')];
    const select = selected => {
      tabs.forEach(tab => {
        const active = tab === selected;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        component.querySelector(`#${tab.getAttribute('aria-controls')}`).hidden = !active;
      });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        select(tabs[nextIndex]); tabs[nextIndex].focus();
      });
    });
  });
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

  let language = 'ja';
  try { language = localStorage.getItem('dv-language') || 'ja'; } catch { /* Japanese remains the fallback. */ }
  applyLanguage(language);
  languageButton.addEventListener('click', () => applyLanguage(language = language === 'en' ? 'ja' : 'en'));
}

function renderAgenda() {
  const root = document.querySelector('[data-agenda]');
  if (!root) return;
  const today = todayInTokyo();
  const previewAll = new URLSearchParams(location.search).get('preview') === 'all';
  const focusedWeek = weeks.find(week => week.course_date >= today) || weeks.at(-1);
  let html = '', active = '';
  weeks.forEach((week, index) => {
    if (week.act !== active) {
      active = week.act;
      if (index) html += `<div class="act-band" data-act="${active}"><div class="wrap"><h2>${active}</h2><p>${copy(...acts[active])}</p></div></div>`;
      html += '<section class="wrap week-list">';
    }
    const no = String(week.week).padStart(2, '0');
    const locked = !previewAll && today < availabilityDate(week.course_date);
    const classTime = week.date.match(/\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}/)?.[0] || '';
    const weekIndex = `<span class="week-index"><span class="week-number">${no}</span><span class="week-date"><span>${escapeHtml(compactDate(week.course_date))}</span><span>${escapeHtml(classTime)}</span></span></span>`;
    const slideMaterials = week.materials.filter(material => material.type === 'slides' || material.href.startsWith('lectures/'));
    const activityMaterials = week.materials.filter(material => !slideMaterials.includes(material));
    const returnTo = `agenda.html${previewAll ? '?preview=all' : ''}#week-${week.week}`;
    const image = safeResourceHref(week.image);
    const slideMaterial = slideMaterials[0];
    const slideFile = safeResourceHref(slideMaterial?.href);
    const slideLabel = copy('Preview lecture slides', '講義スライドをプレビュー');
    const slideHref = slideFile && /^lectures\/[A-Za-z0-9._-]+\.pdf$/i.test(slideFile)
      ? `viewer.html?file=${encodeURIComponent(slideFile)}&title=${encodeURIComponent(slideLabel)}&week=${encodeURIComponent(`Week ${week.week}`)}&return=${encodeURIComponent(returnTo)}`
      : '';
    const media = image ? `${slideHref ? `<a class="week-visual-link" href="${escapeHtml(slideHref)}" aria-label="${escapeHtml(slideLabel)}">` : ''}<figure class="week-visual"><img src="${escapeHtml(image)}" alt="" loading="lazy"><figcaption>${escapeHtml(slideLabel)}${slideHref ? '<b aria-hidden="true">→</b>' : ''}</figcaption></figure>${slideHref ? '</a>' : ''}` : '';
    const slides = !image && slideMaterials.length ? `<div class="lecture-slides">${materialLinks(slideMaterials.map(material => ({ ...material, label: slideLabel })), { week: week.week, returnTo })}</div>` : '';
    const activityLinks = activityMaterials.length ? `<div class="activity-materials"><p>${copy('MATERIALS FOR THIS ACTIVITY', 'この課題で使う資料')}</p><div>${materialLinks(activityMaterials)}</div></div>` : '';
    const status = week.week === focusedWeek?.week ? `<span class="week-status">${copy(week.course_date === today ? 'TODAY' : 'START HERE', week.course_date === today ? '今日' : 'ここから')}</span>` : '';
    const preview = `<span class="week-preview"><span><b>${copy('PRACTICE', '実践')}</b>${escapeHtml(copy(week.learn, week.learn_ja))}</span><span><b>${copy('TOOLS', 'ツール')}</b>${escapeHtml(copy(week.tools, week.tools_ja))}</span></span>`;
    const weekMain = `<span class="week-summary-main"><span class="week-meta"><span>${week.act}</span><span>${copy(`Week ${week.week}`, `第${week.week}週`)}</span>${locked ? '' : status}</span><span class="week-title">${escapeHtml(copy(week.title, week.title_ja))}</span>${locked ? '' : preview}</span>`;
    if (locked) {
      const opens = compactDate(availabilityDate(week.course_date));
      html += `<section class="week week--locked" id="week-${week.week}" aria-label="${escapeHtml(copy(`Week ${week.week}, available ${opens}`, `第${week.week}週、${opens}公開`))}"><div class="week-summary">${weekIndex}${weekMain}<span class="week-toggle week-toggle--locked">${escapeHtml(copy(`Opens ${opens}`, `${opens} 公開`))}</span></div></section>`;
      if (!weeks[index + 1] || weeks[index + 1].act !== active) html += '</section>';
      return;
    }
    const inClass = activityTabs(week) || (week.in_class ? `<article class="assignment-card assignment-card--in-class"><p class="assignment-label">${copy('IN CLASS', '授業内課題')}</p><h4>${copy('Try it with the class', 'クラスで試す')}</h4><p>${escapeHtml(copy(week.in_class, week.in_class_ja))}</p>${activityLinks}<div class="activity-tools"><span>${copy('TOOLS', '使うツール')}</span><strong>${escapeHtml(copy(week.tools, week.tools_ja))}</strong></div></article>` : '');
    const timing = classAgenda(week);
    const nextClassDate = weeks[index + 1]?.course_date || addDays(week.course_date, 7);
    const deadlineMs = submissionDeadlineMs(nextClassDate);
    const deadline = formatSubmissionDeadline(deadlineMs);
    const submission = configuredFormUrl()
      ? `<div class="assignment-submit" data-submission-deadline="${deadlineMs}" data-submit-url="${escapeHtml(formUrl(week.week, week.challenge_ja || week.challenge))}"><a class="button" target="_blank" rel="noopener" href="${escapeHtml(formUrl(week.week, week.challenge_ja || week.challenge))}">${copy('Submit homework', '宿題を提出する')}</a><p class="assignment-deadline"><strong>${copy('DEADLINE', '締切')}</strong> ${escapeHtml(deadline)}</p><p class="assignment-resubmit">${copy('Made a mistake or want to submit a better version? Submit again before the deadline. Your newest submission will be used.', '間違えた場合や、よりよい作品を提出したい場合は、締切まで何度でも再提出できます。最新の提出を使用します。')}</p></div>`
      : `<div class="assignment-submit"><p class="assignment-note">${copy('The submission link will appear here.', '提出リンクはここに表示されます。')}</p><p class="assignment-deadline"><strong>${copy('DEADLINE', '締切')}</strong> ${escapeHtml(deadline)}</p></div>`;
    html += `<details class="week" id="week-${week.week}"${week.week === focusedWeek?.week ? ' open' : ''}>
      <summary class="week-summary">${weekIndex}${weekMain}<span class="week-toggle"><span class="week-toggle-closed">${copy('Open week', '週の内容を見る')}</span><span class="week-toggle-open">${copy('Close week', '週の内容を閉じる')}</span><b aria-hidden="true">↓</b></span></summary>
      <div class="week-body">
        <section class="week-lecture"><div class="week-section-heading"><div><p class="week-section-label">${copy('LECTURE', '講義')}</p><h3>${copy('What to expect', '今週の講義')}</h3></div></div>
          ${timing}
          <div class="week-heading"><p class="lecture-summary">${escapeHtml(copy(week.look, week.look_ja))}</p><div class="week-lecture-aside">${media}${slides}</div></div>
        </section>
        <section class="week-assignments" aria-label="${copy('Assignments', '課題')}">
          <div class="assignment-grid">${inClass}<article class="assignment-card assignment-card--homework"><p class="assignment-label">${copy('HOMEWORK', '宿題')}</p><h4>${escapeHtml(copy(week.challenge, week.challenge_ja))}</h4><p>${escapeHtml(copy(week.homework, week.homework_ja))}</p><dl class="assignment-details"><div><dt>${copy('DELIVERABLES', '提出物')}</dt><dd>${escapeHtml(copy(week.deliverables || 'Visualization, title, concise explanation, project link, and one screenshot.', week.deliverables_ja || '可視化、タイトル、短い説明、作品リンク、スクリーンショット1枚。'))}</dd></div><div><dt>${copy('SUGGESTED TOOLS', 'おすすめのツール')}</dt><dd>${escapeHtml(copy(week.tools, week.tools_ja))}</dd></div></dl>${submission}</article></div>
        </section>
      </div></details>`;
    if (!weeks[index + 1] || weeks[index + 1].act !== active) html += '</section>';
  });
  root.innerHTML = html;
  const requestedWeek = location.hash.match(/^#week-(\d+)$/)?.[1];
  if (requestedWeek) {
    const requestedPanel = root.querySelector(`details#week-${requestedWeek}`);
    if (requestedPanel) requestedPanel.open = true;
  }
  root.querySelectorAll('details.week').forEach(node => {
    node.querySelector('.week-lecture-aside').append(createMoriCorner(weekFor(node.id.replace('week-', ''))));
  });
  setupActivityTabs(root);
  startSubmissionDeadlineClock(root);
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

function availabilityDate(courseDate) {
  const [year, month, day] = courseDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}

function addDays(isoDate, numberOfDays) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + numberOfDays));
  return date.toISOString().slice(0, 10);
}

function submissionDeadlineMs(nextClassDate) {
  return new Date(`${nextClassDate}T00:00:00+09:00`).getTime() - 60_000;
}

function formatSubmissionDeadline(deadlineMs) {
  const options = { timeZone: 'Asia/Tokyo', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  const locale = isJapanese() ? 'ja-JP' : 'en-US';
  return `${new Intl.DateTimeFormat(locale, { ...options, hour12: !isJapanese() }).format(new Date(deadlineMs))} JST`;
}

function submissionIsOpen(deadlineMs, nowMs = Date.now()) {
  return nowMs < deadlineMs;
}

function updateSubmissionDeadlines(root = document) {
  root.querySelectorAll('[data-submission-deadline]').forEach(wrapper => {
    const button = wrapper.querySelector('.button');
    if (!button) return;
    const open = submissionIsOpen(Number(wrapper.dataset.submissionDeadline));
    button.textContent = open ? copy('Submit homework', '宿題を提出する') : copy('Submissions closed', '提出は締め切りました');
    button.classList.toggle('button--disabled', !open);
    button.setAttribute('aria-disabled', String(!open));
    if (open) {
      button.href = wrapper.dataset.submitUrl;
      button.target = '_blank';
      button.rel = 'noopener';
      button.removeAttribute('tabindex');
    } else {
      button.removeAttribute('href');
      button.removeAttribute('target');
      button.removeAttribute('rel');
      button.setAttribute('tabindex', '-1');
    }
  });
}

function startSubmissionDeadlineClock(root) {
  if (submissionDeadlineTimer) clearInterval(submissionDeadlineTimer);
  updateSubmissionDeadlines(root);
  submissionDeadlineTimer = setInterval(() => updateSubmissionDeadlines(root), 30_000);
}

function compactDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const englishDay = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date).toUpperCase();
  const japaneseDay = new Intl.DateTimeFormat('ja-JP', { weekday: 'short', timeZone: 'UTC' }).format(date);
  return copy(`${month}/${day} ${englishDay}`, `${month}/${day} ${japaneseDay}`);
}

function renderHome() {
  const root = document.querySelector('[data-this-week]');
  if (!root) return;
  const current = weeks.find(week => week.course_date >= todayInTokyo()) || weeks.at(-1);
  if (!current) return;
  const no = String(current.week).padStart(2, '0');
  const previewAll = new URLSearchParams(location.search).get('preview') === 'all';
  const locked = !previewAll && todayInTokyo() < availabilityDate(current.course_date);
  const href = `agenda.html${previewAll ? '?preview=all' : ''}#week-${current.week}`;
  root.href = href;
  root.setAttribute('aria-label', copy(`Open week ${current.week}`, `第${current.week}週を開く`));
  root.innerHTML = locked
    ? `<p class="eyebrow">${copy('THIS WEEK', '今週')}</p><p class="next-number">${no}</p><h2>${escapeHtml(copy(current.title, current.title_ja))}</h2><p>${escapeHtml(copy(`Details open ${compactDate(availabilityDate(current.course_date))}.`, `内容は${compactDate(availabilityDate(current.course_date))}に公開します。`))}</p><span class="next-cta">${copy('See the schedule →', '日程を見る →')}</span>`
    : `<p class="eyebrow">${copy('THIS WEEK', '今週')}</p><p class="next-number">${no}</p><h2>${escapeHtml(copy(current.challenge, current.challenge_ja))}</h2><p>${escapeHtml(copy(current.homework, current.homework_ja))}</p><span class="next-cta">${copy('Open this week →', 'この週を開く →')}</span>`;
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
    script.src = `${COURSE_CONFIG.GALLERY_API_URL}?callback=courseGalleryReceive&t=${Date.now()}`;
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
  let snapshot;
  try {
    const embedded = document.querySelector('#gallery-snapshot')?.textContent.trim();
    if (embedded) snapshot = JSON.parse(embedded);
    else {
      const response = await fetch('data/gallery-public.json', { cache: 'default' });
      if (!response.ok) throw new Error(`Gallery snapshot HTTP ${response.status}`);
      snapshot = await response.json();
    }
    if (!Array.isArray(snapshot.items)) throw new Error('Invalid gallery snapshot');
    items = snapshot.items;
    status.textContent = copy(`${items.length} works · refreshed about every 5–10 minutes.`, `${items.length} 点の作品 · 約5〜10分ごとに更新。`);
  } catch (error) {
    console.warn('Gallery snapshot:', error);
    try {
      items = await loadGalleryItems();
      status.textContent = copy(`${items.length} latest works.`, `最新の作品 ${items.length} 点。`);
    } catch (feedError) {
      status.replaceChildren(element('span', copy('Student work is temporarily unavailable. ', '学生作品を読み込めませんでした。')));
      const retry = element('button', copy('Try again', '再読み込み'), 'gallery-retry');
      retry.type = 'button';
      retry.addEventListener('click', renderGallery);
      status.append(retry);
      root.replaceChildren();
      root.dataset.rendering = '';
      console.error('Gallery feed:', feedError);
      return;
    }
  }
  root.dataset.rendering = '';
  const controls = document.querySelector('[data-gallery-filters]');
  controls.replaceChildren();
  const controlBar = controls.closest('.gallery-controls');
  if (!items.length) {
    controlBar?.setAttribute('hidden', '');
    status.textContent = copy('No submissions yet.', '提出作品はまだありません。');
    root.replaceChildren();
    return;
  }
  controlBar?.removeAttribute('hidden');
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
      const data = item.imageUrl || await loadGalleryImage(Number(item.imageIndex));
      if (!placeholder.isConnected) return;
      if (/^assets\/gallery\/[a-f0-9]{24}\.(?:png|jpg|webp|gif)$/.test(data) || /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(data)) {
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
  if (!document.querySelector('[data-agenda], [data-this-week]')) return;
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

function setupMapViewer() {
  const trigger = document.querySelector('.history-map-trigger');
  if (!trigger) return;
  if (trigger.matches('a[href]')) return;
  const source = trigger.querySelector('.history-map-image');
  const overlay = element('div', '', 'map-lightbox');
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `<div class="map-lightbox-toolbar"><strong class="map-lightbox-title"></strong><button type="button" data-map-zoom-out>−</button><span class="map-lightbox-level">100%</span><button type="button" data-map-zoom-in>+</button><button type="button" data-map-reset></button><button type="button" data-map-close></button></div><div class="map-lightbox-viewport"><img class="map-lightbox-image" alt=""></div>`;
  document.body.append(overlay);
  const viewport = overlay.querySelector('.map-lightbox-viewport');
  const image = overlay.querySelector('.map-lightbox-image');
  const level = overlay.querySelector('.map-lightbox-level');
  const closeButton = overlay.querySelector('[data-map-close]');
  const pageContent = [...document.body.children].filter(node => node !== overlay && !['SCRIPT', 'STYLE'].includes(node.tagName));
  let scale = 1, offsetX = 0, offsetY = 0, dragging = false, startX = 0, startY = 0;

  const applyTransform = () => {
    image.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    level.textContent = `${Math.round(scale * 100)}%`;
  };
  const reset = () => { scale = 1; offsetX = 0; offsetY = 0; applyTransform(); };
  const zoom = amount => { scale = Math.min(6, Math.max(.6, scale * amount)); applyTransform(); };
  const updateLabels = () => {
    overlay.setAttribute('aria-label', copy('Zoomable Minard map', '拡大・移動できるミナールの地図'));
    overlay.querySelector('.map-lightbox-title').textContent = copy('Napoleon’s 1812 campaign · Minard, 1869', 'ナポレオンの1812年ロシア遠征 · ミナール、1869年');
    overlay.querySelector('[data-map-zoom-out]').setAttribute('aria-label', copy('Zoom out', '縮小'));
    overlay.querySelector('[data-map-zoom-in]').setAttribute('aria-label', copy('Zoom in', '拡大'));
    overlay.querySelector('[data-map-reset]').textContent = copy('Reset', 'リセット');
    closeButton.textContent = copy('Close', '閉じる');
    trigger.setAttribute('aria-label', copy('Open the Minard map in a zoomable full-screen viewer', 'ミナールの地図を全画面で開き、拡大・移動する'));
  };
  const open = () => {
    updateLabels();
    image.src = source.src;
    image.alt = source.alt;
    overlay.hidden = false;
    document.body.classList.add('map-lightbox-open');
    pageContent.forEach(node => { node.inert = true; });
    reset();
    closeButton.focus();
  };
  const close = () => {
    overlay.hidden = true;
    document.body.classList.remove('map-lightbox-open');
    pageContent.forEach(node => { node.inert = false; });
    trigger.focus();
  };

  trigger.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  overlay.querySelector('[data-map-zoom-in]').addEventListener('click', () => zoom(1.25));
  overlay.querySelector('[data-map-zoom-out]').addEventListener('click', () => zoom(.8));
  overlay.querySelector('[data-map-reset]').addEventListener('click', reset);
  viewport.addEventListener('wheel', event => { event.preventDefault(); zoom(event.deltaY < 0 ? 1.12 : .89); }, { passive: false });
  viewport.addEventListener('pointerdown', event => {
    dragging = true; startX = event.clientX - offsetX; startY = event.clientY - offsetY;
    viewport.classList.add('is-dragging'); viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', event => {
    if (!dragging) return;
    offsetX = event.clientX - startX; offsetY = event.clientY - startY; applyTransform();
  });
  const stopDragging = event => {
    dragging = false; viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  };
  viewport.addEventListener('pointerup', stopDragging);
  viewport.addEventListener('pointercancel', stopDragging);
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') close();
    if (event.key === '+' || event.key === '=') zoom(1.25);
    if (event.key === '-') zoom(.8);
    if (event.key === '0') reset();
  });
  updateLabels();
}

document.addEventListener('DOMContentLoaded', () => {
  setupShell();
  setupMapViewer();
  loadWeeks();
});
