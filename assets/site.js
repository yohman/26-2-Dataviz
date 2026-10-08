/* Weekly teaching content is edited in content/weeks/*.md. */
const COURSE_CONFIG = {
  GOOGLE_FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSctVgkCDhtkaG8UscBrVJVteqBiCFXHCB_tlQFscdM8wU4xAg/viewform',
  GOOGLE_FORM_WEEK_ENTRY_ID: 'entry.155622460',
  GALLERY_API_URL: 'https://script.google.com/macros/s/AKfycbx0QJbdytCdRNdCTGPsMhfkMC3HFRImz9-VUCebCoZ6XjdVlieGwDDzmpxuxg0ORVZb5Q/exec'
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
let galleryWorkItems;
let galleryWorkRefreshStarted = false;
let galleryWorkLiveStatus = 'pending';

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
      const field = line.match(/^(title|title_ja|text|text_ja|link|link_label|link_label_ja|results_link|results_label|results_label_ja):\s*(.*)$/);
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
  if (/^[a-z0-9-]+\.html(?:\?[-a-z0-9_~.%=&+]+)?(?:#[-\w]+)?$/i.test(href)) return href;
  return '';
}

function materialLinks(materials, context = {}) {
  return [...materials].sort((first, second) => Number(second.type === 'slides') - Number(first.type === 'slides')).map(material => {
    const href = safeResourceHref(material.href);
    if (!href) return '';
    const external = /^https?:\/\//i.test(href);
    const extension = href.split(/[?#]/)[0].split('.').pop().toLowerCase();
    const lecture = material.type === 'slides' || /^lectures\/.+\.pdf$/i.test(href);
    const webpage = external || extension === 'html';
    const fileType = webpage ? 'LINK' : extension.toUpperCase();
    const params = new URLSearchParams({ file: href, title: material.label });
    params.set('return', context.returnTo || (context.week ? `agenda.html#week-${context.week}` : 'agenda.html'));
    if (context.week) params.set('week', `Week ${context.week}`);
    const previewPage = extension === 'csv' ? 'csv-preview.html' : extension === 'ipynb' ? 'notebook-preview.html' : extension === 'pdf' ? 'viewer.html' : '';
    const previewHref = !external && previewPage ? `${previewPage}?${params}` : href;
    const label = copy(material.label, window.COURSE_TRANSLATIONS?.ja?.[material.label] || material.label);
    const openLabel = external || !previewPage ? copy('Open', '開く') : copy('Preview', 'プレビュー');
    return `<div class="course-resource" title="${escapeHtml(label)}"><strong class="course-resource-name">${escapeHtml(label)}</strong><span class="course-resource-type">${escapeHtml(fileType)}</span><div class="course-resource-actions"><a class="course-resource-preview" href="${escapeHtml(previewHref)}" aria-label="${escapeHtml(`${label} · ${openLabel}`)}"${external ? ' target="_blank" rel="noopener"' : ''}>${openLabel}${external ? ' ↗' : ''}</a>${webpage || lecture ? '' : `<a class="course-resource-download" href="${escapeHtml(href)}" download aria-label="${escapeHtml(label)} · ${copy('Download', 'ダウンロード')}">${copy('Download', 'ダウンロード')}</a>`}</div></div>`;
  }).join('');
}

function classAgenda(week) {
  const raw = copy(week.schedule, week.schedule_ja);
  if (!raw) return '';
  const items = raw.split(';').map(item => item.split('|').map(part => part.trim())).filter(item => item.length === 3);
  if (!items.length) return '';
  return `<ol class="class-agenda class-agenda--${items.length}" aria-label="${copy('Class timing', '授業の時間配分')}">${items.map(([time, title, description]) => `<li><time>${escapeHtml(time)}</time><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></li>`).join('')}</ol>`;
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

function activityTabs(week, sharedMaterials = '') {
  if (!week.activities?.length) return '';
  const tabs = week.activities.map((activity, index) => `<button type="button" role="tab" id="week-${week.week}-activity-${activity.number}-tab" aria-controls="week-${week.week}-activity-${activity.number}" aria-selected="${index === 0}" tabindex="${index === 0 ? '0' : '-1'}">${copy(`Activity ${activity.number}`, `アクティビティ ${activity.number}`)}</button>`).join('');
  const panels = week.activities.map((activity, index) => {
    const href = safeUrl(activity.link) || safeResourceHref(activity.link);
    const link = href ? materialLinks([{ href, label: copy(activity.link_label, activity.link_label_ja) }], { week: week.week }) : '';
    const resultsHref = safeUrl(activity.results_link) || safeResourceHref(activity.results_link);
    const resultsLink = resultsHref ? materialLinks([{ href: resultsHref, label: copy(activity.results_label, activity.results_label_ja) }], { week: week.week }) : '';
    const steps = copy(activity.steps, activity.steps_ja).map(step => `<li>${escapeHtml(step)}</li>`).join('');
    return `<section class="activity-panel" role="tabpanel" id="week-${week.week}-activity-${activity.number}" aria-labelledby="week-${week.week}-activity-${activity.number}-tab"${index === 0 ? '' : ' hidden'}>
      <p class="assignment-label">${copy('IN CLASS', '授業内')} · ${copy(`ACTIVITY ${activity.number}`, `アクティビティ ${activity.number}`)}</p>
      <h4>${escapeHtml(copy(activity.title, activity.title_ja))}</h4>
      <p>${escapeHtml(copy(activity.text, activity.text_ja))}</p>
      <ol class="activity-steps">${steps}</ol><div class="activity-actions">${link}${resultsLink}</div>
    </section>`;
  }).join('');
  return `<article class="assignment-card assignment-card--in-class activity-tabs-card" data-activity-tabs><div class="activity-tab-list" role="tablist" aria-label="${copy('In-class activities', '授業内アクティビティ')}">${tabs}</div>${panels}${sharedMaterials}</article>`;
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
  const guideGroups = [...document.querySelectorAll('.guide-grid--week article')].map(article => ({
    article, materials: [...article.querySelectorAll('a')].map(anchor => ({
      href: anchor.getAttribute('href')?.startsWith('viewer.html') ? new URL(anchor.href).searchParams.get('file') : anchor.getAttribute('href'),
      label: anchor.textContent.trim().replace(/\s*[→↓↗]\s*$/, '').replace('Preview the lecture slides', 'Lecture slides').replace('Open the group spreadsheet', 'Group spreadsheet')
    }))
  }));
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  menuButton?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a').forEach(link => {
    if (link.getAttribute('href') === current || (current === 'gallery-work.html' && link.getAttribute('href') === 'gallery.html')) link.setAttribute('aria-current', 'page');
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
    if (document.querySelector('[data-gallery-work]')) renderGalleryWork();
    if (document.querySelector('[data-csv-preview]')) renderCsvPreview();
    if (document.querySelector('[data-notebook-preview]')) renderNotebookPreview();
    guideGroups.forEach(({ article, materials }) => {
      article.querySelectorAll('a, .guide-resource-list').forEach(node => node.remove());
      const list = element('div', '', 'guide-resource-list');
      list.innerHTML = materialLinks(materials, { week: 1, returnTo: 'resources.html' });
      article.append(list);
    });
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
  const localPreview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const previewAll = localPreview || new URLSearchParams(location.search).get('preview') === 'all';
  const focusedWeek = weeks.find(week => week.course_date >= today) || weeks.at(-1);
  const jumpLinks = weeks.map(week => {
    const past = week.course_date < today;
    const current = !past && week.week === focusedWeek?.week;
    const state = past ? copy('CLASS HELD', '授業済') : current ? copy(week.course_date === today ? 'TODAY' : 'NEXT', week.course_date === today ? '今日' : '次回') : '';
    const stateClass = past ? 'agenda-week-link--past' : current ? 'agenda-week-link--current' : 'agenda-week-link--future';
    return `<a class="agenda-week-link ${stateClass}" href="#week-${week.week}" aria-label="${escapeHtml(copy(`Week ${week.week}, ${compactDate(week.course_date)}${state ? `, ${state}` : ''}`, `第${week.week}週、${compactDate(week.course_date)}${state ? `、${state}` : ''}`))}"${current ? ' aria-current="step"' : ''}><span class="agenda-week-no">${String(week.week).padStart(2, '0')}</span><time datetime="${week.course_date}">${escapeHtml(compactDate(week.course_date))}</time>${state ? `<span class="agenda-week-state">${state}</span>` : ''}</a>`;
  }).join('');
  const intro = `<section class="agenda-intro wrap" aria-labelledby="agenda-title"><div class="agenda-intro-heading"><div><p class="eyebrow">2026–2 / ${copy('14 WEEKS', '全14週')}</p><h1 id="agenda-title">${copy('Agenda', '授業の予定')}</h1></div><p>${copy('Choose a week to see its lecture, activities, and homework.', '週を選ぶと、講義・授業内課題・宿題を確認できます。')}</p></div><nav class="agenda-week-nav" aria-label="${copy('Jump to a week', '各週へのショートカット')}">${jumpLinks}</nav></section>`;
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
    const activityLinks = activityMaterials.length ? `<div class="activity-materials"><p>${copy('MATERIALS FOR THIS ACTIVITY', 'この課題で使う資料')}</p><div>${materialLinks(activityMaterials, { week: week.week, returnTo })}</div></div>` : '';
    const status = week.week === focusedWeek?.week ? `<span class="week-status">${copy(week.course_date === today ? 'TODAY' : 'START HERE', week.course_date === today ? '今日' : 'ここから')}</span>` : '';
    const preview = `<span class="week-preview"><span><b>${copy('PRACTICE', '実践')}</b>${escapeHtml(copy(week.learn, week.learn_ja))}</span><span><b>${copy('TOOLS', 'ツール')}</b>${escapeHtml(copy(week.tools, week.tools_ja))}</span></span>`;
    const weekMain = `<span class="week-summary-main"><span class="week-meta"><span>${week.act}</span><span>${copy(`Week ${week.week}`, `第${week.week}週`)}</span>${locked ? '' : status}</span><span class="week-title">${escapeHtml(copy(week.title, week.title_ja))}</span>${locked ? '' : preview}</span>`;
    if (locked) {
      const opens = compactDate(availabilityDate(week.course_date));
      html += `<section class="week week--locked" id="week-${week.week}" aria-label="${escapeHtml(copy(`Week ${week.week}, available ${opens}`, `第${week.week}週、${opens}公開`))}"><div class="week-summary">${weekIndex}${weekMain}<span class="week-toggle week-toggle--locked">${escapeHtml(copy(`Opens ${opens}`, `${opens} 公開`))}</span></div></section>`;
      if (!weeks[index + 1] || weeks[index + 1].act !== active) html += '</section>';
      return;
    }
    const inClass = activityTabs(week, activityLinks) || (week.in_class ? `<article class="assignment-card assignment-card--in-class"><p class="assignment-label">${copy('IN CLASS', '授業内課題')}</p><h4>${copy('Try it with the class', 'クラスで試す')}</h4><p>${escapeHtml(copy(week.in_class, week.in_class_ja))}</p>${activityLinks}<div class="activity-tools"><span>${copy('TOOLS', '使うツール')}</span><strong>${escapeHtml(copy(week.tools, week.tools_ja))}</strong></div></article>` : '');
    const timing = classAgenda(week);
    const nextClassDate = weeks[index + 1]?.course_date || addDays(week.course_date, 7);
    const deadlineMs = submissionDeadlineMs(nextClassDate);
    const deadline = formatSubmissionDeadline(deadlineMs);
    const submission = configuredFormUrl()
      ? `<div class="assignment-submit" data-submission-deadline="${deadlineMs}" data-submit-url="${escapeHtml(formUrl(week.week, week.challenge_ja || week.challenge))}"><a class="button" target="_blank" rel="noopener" href="${escapeHtml(formUrl(week.week, week.challenge_ja || week.challenge))}">${copy('Submit homework', '宿題を提出する')}</a><p class="assignment-deadline"><strong>${copy('DEADLINE', '締切')}</strong> ${escapeHtml(deadline)}</p><p class="assignment-resubmit">${copy('Made a mistake or want to submit a better version? Submit again before the deadline. Your newest submission will be used.', '間違えた場合や、よりよい作品を提出したい場合は、締切まで何度でも再提出できます。最新の提出を使用します。')}</p></div>`
      : `<div class="assignment-submit"><p class="assignment-note">${copy('The submission link will appear here.', '提出リンクはここに表示されます。')}</p><p class="assignment-deadline"><strong>${copy('DEADLINE', '締切')}</strong> ${escapeHtml(deadline)}</p></div>`;
    html += `<details class="week" id="week-${week.week}"${localPreview || week.week === focusedWeek?.week ? ' open' : ''}>
      <summary class="week-summary">${weekIndex}${weekMain}<span class="week-toggle"><span class="week-toggle-closed">${copy('Open week', '週の内容を見る')}</span><span class="week-toggle-open">${copy('Close week', '週の内容を閉じる')}</span><b aria-hidden="true">↓</b></span></summary>
      <div class="week-body">
        <section class="week-lecture"><div class="week-section-heading"><div><p class="week-section-label">${copy('LECTURE', '講義')}</p><h3>${copy('What to expect', '今週の講義')}</h3></div></div>
          ${timing}
          <div class="week-heading"><p class="lecture-summary">${escapeHtml(copy(week.look, week.look_ja))}</p><div class="week-lecture-aside">${media}${slides}</div></div>
        </section>
        <section class="week-assignments" aria-label="${copy('Assignments', '課題')}">
          <div class="assignment-grid">${inClass}<article class="assignment-card assignment-card--homework"><p class="assignment-label">${copy('HOMEWORK', '宿題')}</p><h4>${escapeHtml(copy(week.challenge, week.challenge_ja))}</h4><p>${escapeHtml(copy(week.homework, week.homework_ja))}</p><dl class="assignment-details"><div><dt>${copy('DELIVERABLES', '提出物')}</dt><dd>${escapeHtml(copy(week.deliverables || 'Visualization, title, concise explanation, project link, and one screenshot.', week.deliverables_ja || '可視化、タイトル、短い説明、作品リンク、スクリーンショット1枚。'))}</dd></div><div><dt>${copy('SUGGESTED TOOLS', 'おすすめのツール')}</dt><dd>${escapeHtml(copy(week.tools, week.tools_ja))}</dd></div></dl>${submission}<div class="homework-gallery-link" data-homework-gallery-week="${week.week}"></div></article></div>
        </section>
      </div></details>`;
    if (!weeks[index + 1] || weeks[index + 1].act !== active) html += '</section>';
  });
  root.innerHTML = intro + html;
  root.querySelectorAll('.agenda-week-link').forEach(link => link.addEventListener('click', () => {
    const panel = root.querySelector(`details${link.getAttribute('href')}`);
    if (panel) panel.open = true;
  }));
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
  syncHomeworkGalleryLinks(root);
}

function galleryWeekCounts(items) {
  const counts = new Map();
  items.forEach(item => {
    const week = Number(item.week);
    if (Number.isInteger(week) && week >= 1 && week <= weekFiles.length) counts.set(week, (counts.get(week) || 0) + 1);
  });
  return counts;
}

function updateHomeworkGalleryLinks(root, items) {
  const counts = galleryWeekCounts(items);
  root.querySelectorAll('[data-homework-gallery-week]').forEach(slot => {
    const week = Number(slot.dataset.homeworkGalleryWeek);
    slot.replaceChildren();
    if (!counts.has(week)) return;
    const link = element('a', copy(`View Week ${week} gallery (${counts.get(week)}) →`, `第${week}週のギャラリーを見る（${counts.get(week)}点）→`));
    link.href = `gallery.html?week=${week}`;
    slot.append(link);
  });
}

async function syncHomeworkGalleryLinks(root) {
  try {
    const response = await fetch('data/gallery-public.json');
    if (!response.ok) throw new Error(`Gallery snapshot HTTP ${response.status}`);
    const snapshot = await response.json();
    if (Array.isArray(snapshot.items)) updateHomeworkGalleryLinks(root, snapshot.items);
  } catch (error) { console.warn('Homework gallery snapshot:', error); }
  try { updateHomeworkGalleryLinks(root, await loadGalleryItems()); }
  catch (error) { console.warn('Homework gallery refresh:', error); }
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

async function renderNotebookPreview() {
  const root = document.querySelector('[data-notebook-preview]');
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const file = safeResourceHref(params.get('file'));
  const title = params.get('title') || 'Notebook';
  const back = safeResourceHref(params.get('return')) || 'agenda.html';
  root.innerHTML = `<div class="csv-preview-status" role="status"><span class="gallery-work-spinner" aria-hidden="true"></span>${copy('Loading notebook…', 'ノートブックを読み込んでいます…')}</div>`;
  try {
    if (!file || !/^data\/.+\.ipynb$/i.test(file)) throw new Error('Invalid notebook');
    const response = await fetch(file);
    if (!response.ok) throw new Error(`Notebook HTTP ${response.status}`);
    const notebook = await response.json();
    if (!Array.isArray(notebook.cells)) throw new Error('Invalid notebook cells');
    const text = value => Array.isArray(value) ? value.join('') : String(value || '');
    const cells = notebook.cells.map((cell, index) => {
      const output = (cell.outputs || []).map(item => {
        const plain = text(item.text || item.data?.['text/plain'] || item.traceback);
        const png = text(item.data?.['image/png']);
        return `${plain ? `<pre class="notebook-output">${escapeHtml(plain)}</pre>` : ''}${png && /^[A-Za-z0-9+/=\s]+$/.test(png) ? `<img class="notebook-output-image" src="data:image/png;base64,${png.replace(/\s/g, '')}" alt="${copy('Notebook chart output', 'ノートブックのグラフ出力')}">` : ''}`;
      }).join('');
      return `<section class="notebook-cell"><span class="notebook-cell-label">${cell.cell_type === 'code' ? `In [${cell.execution_count ?? ' '}]` : copy('Text', 'テキスト')}</span><div><pre class="${cell.cell_type === 'code' ? 'notebook-code' : 'notebook-text'}">${escapeHtml(text(cell.source))}</pre>${output}</div></section>`;
    }).join('');
    root.innerHTML = `<header class="csv-preview-heading"><p class="eyebrow">JUPYTER NOTEBOOK</p><h1>${escapeHtml(title)}</h1><p class="csv-preview-summary">${notebook.cells.length} ${copy('cells', 'セル')}</p><div class="csv-preview-actions"><a class="button" href="${escapeHtml(file)}" download>${copy('Download', 'ダウンロード')}</a><a class="text-link" href="${escapeHtml(back)}">${copy('← Back to the week', '← 授業ページに戻る')}</a></div></header><article class="notebook-preview">${cells}</article>`;
    document.title = `${title} · ${copy('Notebook preview', 'ノートブックプレビュー')}`;
  } catch (error) {
    console.error('Notebook preview:', error);
    root.innerHTML = `<div class="csv-preview-error"><p>${copy('The notebook could not be loaded.', 'ノートブックを読み込めませんでした。')}</p><a href="${escapeHtml(back)}">${copy('Back to the week', '授業ページに戻る')}</a></div>`;
  }
}

function parseCsvText(text) {
  const records = [];
  let record = [], field = '', quoted = false;
  const source = String(text || '').replace(/^\uFEFF/, '');
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') { field += '"'; index++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field === '') quoted = true;
    else if (char === ',') { record.push(field); field = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index++;
      record.push(field); records.push(record); record = []; field = '';
    } else field += char;
  }
  if (field || record.length || source.endsWith(',')) { record.push(field); records.push(record); }
  while (records.length && records.at(-1).every(value => value === '')) records.pop();
  return records;
}

async function renderCsvPreview() {
  const root = document.querySelector('[data-csv-preview]');
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const file = safeResourceHref(params.get('file'));
  const title = params.get('title') || file?.split('/').pop() || 'CSV';
  const returnTo = safeResourceHref(params.get('return')) || 'agenda.html';
  root.replaceChildren();
  if (!file || !/^data\/.+\.csv$/i.test(file)) {
    root.append(element('p', copy('That CSV file is not available for preview.', 'このCSVファイルはプレビューできません。'), 'csv-preview-status'));
    return;
  }
  const loading = element('div', '', 'csv-preview-status');
  loading.setAttribute('role', 'status');
  loading.append(element('span', '', 'gallery-work-spinner'), element('span', copy('Loading CSV…', 'CSVを読み込んでいます…')));
  root.append(loading);
  try {
    const response = await fetch(file, { cache: 'default' });
    if (!response.ok) throw new Error(`CSV HTTP ${response.status}`);
    const records = parseCsvText(await response.text());
    if (!records.length) throw new Error('CSV contains no rows');
    const headers = records[0].map((value, index) => value || `Column ${index + 1}`);
    const rows = records.slice(1);
    const pageSize = 25;
    let page = 0;
    const section = element('section', '', 'csv-preview');
    const heading = element('header', '', 'csv-preview-heading');
    heading.append(element('p', copy('DATA PREVIEW', 'データプレビュー'), 'eyebrow'));
    heading.append(element('h1', title));
    heading.append(element('p', copy(`${rows.length.toLocaleString()} rows · ${headers.length.toLocaleString()} columns`, `${rows.length.toLocaleString()}行 · ${headers.length.toLocaleString()}列`), 'csv-preview-summary'));
    const actions = element('div', '', 'csv-preview-actions');
    const download = element('a', copy('Download CSV ↓', 'CSVをダウンロード ↓'), 'button');
    download.href = file; download.download = file.split('/').pop();
    const back = element('a', copy('← Back to the week', '← 授業ページに戻る'), 'text-link');
    back.href = returnTo;
    actions.append(download, back); heading.append(actions);
    const tableRegion = element('div', '', 'csv-preview-table-region');
    tableRegion.setAttribute('role', 'region');
    tableRegion.setAttribute('aria-label', copy('Scrollable CSV table', 'スクロールできるCSV表'));
    tableRegion.tabIndex = 0;
    const table = element('table', '', 'csv-preview-table');
    table.append(element('caption', title));
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headers.forEach(header => { const cell = element('th', header); cell.scope = 'col'; cell.title = header; headRow.append(cell); });
    thead.append(headRow); table.append(thead);
    const tbody = document.createElement('tbody'); table.append(tbody); tableRegion.append(table);
    const pagination = element('nav', '', 'csv-preview-pagination');
    pagination.setAttribute('aria-label', copy('Table pages', '表のページ移動'));
    const previous = element('button', copy('← Previous', '← 前へ')); previous.type = 'button';
    const pageStatus = element('span', '', 'csv-preview-page-status'); pageStatus.setAttribute('aria-live', 'polite');
    const next = element('button', copy('Next →', '次へ →')); next.type = 'button';
    pagination.append(previous, pageStatus, next);
    function showPage() {
      const start = page * pageSize;
      const pageRows = rows.slice(start, start + pageSize);
      tbody.replaceChildren(...pageRows.map(values => {
        const row = document.createElement('tr');
        headers.forEach((_, index) => row.append(element('td', values[index] || '')));
        return row;
      }));
      const end = Math.min(start + pageRows.length, rows.length);
      pageStatus.textContent = rows.length
        ? copy(`Rows ${start + 1}–${end} of ${rows.length} · Page ${page + 1} of ${Math.max(1, Math.ceil(rows.length / pageSize))}`, `全${rows.length}行中 ${start + 1}–${end}行目 · ${page + 1} / ${Math.max(1, Math.ceil(rows.length / pageSize))}ページ`)
        : copy('No data rows', 'データ行はありません');
      previous.disabled = page === 0;
      next.disabled = start + pageSize >= rows.length;
      tableRegion.scrollTop = 0;
    }
    previous.addEventListener('click', () => { if (page > 0) { page--; showPage(); } });
    next.addEventListener('click', () => { if ((page + 1) * pageSize < rows.length) { page++; showPage(); } });
    showPage();
    section.append(heading, tableRegion, pagination);
    root.replaceChildren(section);
    document.title = `${copy('CSV preview', 'CSVプレビュー')} · ${title} · 2026–2 Data Visualization`;
  } catch (error) {
    console.error('CSV preview:', error);
    const message = element('div', '', 'csv-preview-error');
    message.append(element('p', copy('The CSV could not be loaded.', 'CSVを読み込めませんでした。')));
    const retry = element('button', copy('Try again', '再読み込み'), 'button');
    retry.type = 'button'; retry.addEventListener('click', renderCsvPreview);
    message.append(retry); root.replaceChildren(message);
  }
}

function option(value, label) { const item = document.createElement('option'); item.value = value; item.textContent = label; return item; }
function safeUrl(value) {
  try { const url = new URL(/^www\./i.test(value) ? `https://${value}` : value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function element(tag, text, className) { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; }

const galleryUrlPattern = /(?:https?:\/\/|www\.)(?:(?!https?:\/\/)[^\s<>"'「」])+/gi;
const trimGalleryUrl = value => value.replace(/[.,;:!?。、；：！？)\]}>」』]+$/u, '');

function galleryUrls(value) {
  return [...new Set([...String(value || '').matchAll(galleryUrlPattern)]
    .map(match => safeUrl(trimGalleryUrl(match[0]))).filter(Boolean))];
}

function appendGalleryText(node, value) {
  const text = String(value || '');
  let position = 0;
  for (const match of text.matchAll(galleryUrlPattern)) {
    const label = trimGalleryUrl(match[0]);
    const href = safeUrl(label);
    if (!href) continue;
    node.append(document.createTextNode(text.slice(position, match.index)));
    const link = element('a', label); link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
    node.append(link);
    position = match.index + label.length;
  }
  node.append(document.createTextNode(text.slice(position)));
}

const galleryItemKey = item => `${item.week}-${item.imageIndex}`;
const galleryPublicFields = ['week', 'challenge', 'submittedAt', 'studentName', 'title', 'tools', 'projectUrl', 'description', 'imageIndex', 'imageCount'];
const sameGalleryItems = (a, b) => a.length === b.length && a.every((item, index) =>
  galleryPublicFields.every(field => (item[field] ?? '') === (b[index][field] ?? '')));
const gallerySessionKey = 'dataviz-gallery-items-v1';
function rememberGalleryItems(items) {
  try { sessionStorage.setItem(gallerySessionKey, JSON.stringify({ savedAt: Date.now(), items })); }
  catch { /* Gallery still works without browser storage. */ }
}
function recentGalleryItems() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(gallerySessionKey) || 'null');
    return cached && Date.now() - cached.savedAt < 10 * 60 * 1000 && Array.isArray(cached.items) ? cached.items : null;
  } catch { return null; }
}
const galleryImageCount = item => Number(item.imageCount) === 2 ? 2 : 1;
const galleryLikesUrl = 'https://dataviz-gallery-likes.ykawano.workers.dev/likes';
let galleryLikesPromise;
let galleryLikesBrowser;
const galleryLikesState = new Map();
async function galleryLikesRequest(method = 'GET', body) {
  galleryLikesBrowser ||= localStorage.getItem('dataviz-heart-browser') || crypto.randomUUID();
  localStorage.setItem('dataviz-heart-browser', galleryLikesBrowser);
  const response = await fetch(galleryLikesUrl, {
    method, signal: AbortSignal.timeout(5000),
    headers: { 'X-Browser-ID': galleryLikesBrowser, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!response.ok) throw new Error(`Likes HTTP ${response.status}`);
  return response.json();
}
function galleryHeart(item) {
  const id = galleryItemKey(item);
  const button = element('button', '', 'gallery-heart'); button.type = 'button';
  button.dataset.heartId = id;
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg><span class="gallery-heart-count"></span>';
  const paint = state => {
    button.disabled = !state;
    button.classList.toggle('is-loading', !state);
    button.classList.toggle('is-liked', Boolean(state?.liked));
    button.setAttribute('aria-pressed', String(Boolean(state?.liked)));
    button.setAttribute('aria-label', copy(state?.liked ? 'Unlike' : 'Like', state?.liked ? 'いいねを取り消す' : 'いいね'));
    button.querySelector('span').textContent = state ? String(state.count) : '';
  };
  const sync = state => {
    galleryLikesState.set(id, state);
    document.querySelectorAll('[data-heart-id]').forEach(other => {
      if (other.dataset.heartId === id) other.dispatchEvent(new CustomEvent('heart-update', { detail: state }));
    });
  };
  button.addEventListener('heart-update', event => paint(event.detail));
  paint(galleryLikesState.get(id));
  const load = async () => {
    paint(galleryLikesState.get(id));
    try {
      galleryLikesPromise ||= galleryLikesRequest().then(data => {
        data.items.forEach(state => galleryLikesState.set(state.id, state));
        return data;
      }).catch(error => { galleryLikesPromise = null; throw error; });
      await galleryLikesPromise;
      paint(galleryLikesState.get(id) || { count: 0, liked: false });
      button.title = '';
    } catch {
      button.disabled = false; button.classList.remove('is-loading');
      button.querySelector('span').textContent = '↻';
      button.title = copy('Unable to load likes. Click to retry.', 'いいねを読み込めません。クリックして再試行。');
    }
  };
  button.addEventListener('click', async () => {
    if (button.title) { await load(); return; }
    const old = galleryLikesState.get(id) || { count: 0, liked: false };
    const liked = !old.liked;
    sync({ count: old.count + (liked ? 1 : -1), liked });
    button.disabled = true;
    try { sync(await galleryLikesRequest('PUT', { id, liked })); }
    catch { sync(old); button.title = copy('Save failed. Click to reload and retry.', '保存できませんでした。クリックして再読み込み。'); }
    finally { button.disabled = false; }
  });
  load();
  return button;
}
const galleryImageSource = (item, slot) => item.imageUrls?.[slot - 1] || (slot === 1 ? item.imageUrl : '') || loadGalleryImage(Number(item.imageIndex), slot);

function galleryImageControls(count, onSelect) {
  if (count < 2) return { element: null, select: () => {} };
  const controls = element('div', '', 'gallery-image-navigation');
  const previous = element('button', '‹', 'gallery-image-arrow gallery-image-arrow--previous');
  const next = element('button', '›', 'gallery-image-arrow gallery-image-arrow--next');
  previous.type = next.type = 'button';
  previous.setAttribute('aria-label', copy('Previous image', '前の画像'));
  next.setAttribute('aria-label', copy('Next image', '次の画像'));
  const dots = element('div', '', 'gallery-image-dots');
  const buttons = Array.from({ length: count }, (_, index) => {
    const dot = element('button', '', 'gallery-image-dot');
    dot.type = 'button';
    dot.setAttribute('aria-label', copy(`Image ${index + 1} of ${count}`, `画像 ${index + 1} / ${count}`));
    dot.addEventListener('click', () => onSelect(index + 1));
    dots.append(dot);
    return dot;
  });
  let active = 1;
  previous.addEventListener('click', () => onSelect(active === 1 ? count : active - 1));
  next.addEventListener('click', () => onSelect(active === count ? 1 : active + 1));
  controls.append(previous, dots, next);
  return { element: controls, select(slot) {
    active = slot;
    buttons.forEach((dot, index) => dot.setAttribute('aria-current', String(index + 1 === slot)));
  } };
}

function galleryFilterItems(items, week, tool, chart) {
  const form = galleryForms.find(entry => entry.id === chart);
  return items.filter(item =>
    (week === 'all' || String(item.week) === String(week)) &&
    (!tool || matchedGalleryTools(item.tools).some(entry => entry.name === tool)) &&
    (!form || matchesGalleryForm(item, form)));
}

function galleryVisibleItems(items, week, tool, chart) {
  return galleryFilterItems(items, week, tool, chart);
}

function galleryPageUrl(item, week, tool, chart) {
  const params = new URLSearchParams({ id: galleryItemKey(item), week: String(week) });
  if (tool) params.set('tool', tool);
  if (chart) params.set('chart', chart);
  return `gallery-work.html?${params}`;
}

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

function requestGalleryImage(index, slot = 1) {
  return new Promise((resolve, reject) => {
    const callback = `courseGalleryImageReceive_${index}_${slot}`;
    const script = document.createElement('script');
    let settled = false;
    const timer = setTimeout(() => finish(new Error('Screenshot timed out')), 15000);
    function finish(error, payload) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.remove();
      delete window[callback];
      if (error || payload?.index !== index || payload?.slot !== slot) reject(error || new Error('Invalid screenshot'));
      else resolve(payload.data || '');
    }
    window[callback] = payload => finish(null, payload);
    script.onerror = () => finish(new Error('Screenshot unavailable'));
    script.src = `${COURSE_CONFIG.GALLERY_API_URL}?image=${index}&slot=${slot}&callback=${callback}`;
    document.head.append(script);
  });
}

function loadGalleryImage(index, slot = 1) {
  if (!Number.isInteger(index) || index < 0) return Promise.resolve('');
  const key = `${index}-${slot}`;
  if (galleryImageCache.has(key)) return galleryImageCache.get(key);
  try {
    const cached = sessionStorage.getItem(`gallery-image-${key}`);
    if (cached && /^data:image\/(png|jpeg|webp|gif);base64,/.test(cached)) return Promise.resolve(cached);
  } catch { /* Storage may be unavailable or full. */ }
  const promise = (async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const data = await requestGalleryImage(index, slot);
        if (data) {
          try { sessionStorage.setItem(`gallery-image-${key}`, data); } catch { /* Best-effort cache. */ }
          return data;
        }
      } catch (error) {
        if (attempt === 2) console.error('Gallery screenshot:', error);
      }
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
    }
    return '';
  })().then(data => {
    if (!data) galleryImageCache.delete(key);
    return data;
  });
  galleryImageCache.set(key, promise);
  if (galleryImageCache.size > 24) galleryImageCache.delete(galleryImageCache.keys().next().value);
  return promise;
}

const galleryTools = [
  { name: 'Excel', pattern: /excel|exel|エクセル/i, url: 'https://www.microsoft.com/microsoft-365/excel' },
  { name: 'Google Sheets', pattern: /スプレッ[ドト]シート|sheets/i, url: 'https://workspace.google.com/products/sheets/' },
  { name: 'Gemini', pattern: /gemini/i, url: 'https://gemini.google.com/' },
  { name: 'Claude', pattern: /claude/i, url: 'https://claude.ai/' },
  { name: 'Python', pattern: /python/i, url: 'https://www.python.org/' },
  { name: 'Flourish', pattern: /flourish/i, url: 'https://flourish.studio/' },
  { name: 'Datawrapper', pattern: /datawrapper/i, url: 'https://www.datawrapper.de/' },
  { name: 'VS Code', pattern: /vs\s*(?:code|cord)/i, url: 'https://code.visualstudio.com/' },
  { name: 'JavaScript', pattern: /javascript/i, url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
  { name: 'Codex', pattern: /codex/i, url: 'https://openai.com/codex/' },
  { name: 'ChatGPT', pattern: /chatgpt/i, url: 'https://chatgpt.com/' },
  { name: 'PowerPoint', pattern: /powerpoint/i, url: 'https://www.microsoft.com/microsoft-365/powerpoint' },
  { name: copy('Paper and pen', '紙とペン'), pattern: /紙|ノート|ペン/ }
];

function matchedGalleryTools(raw) {
  return galleryTools.filter(tool => tool.pattern.test(raw || ''));
}

const galleryForms = [
  { id: 'bar', en: 'Bar charts', ja: '棒グラフ', pattern: /棒グラフ|縦棒|横棒|bar chart/i },
  { id: 'map', en: 'Maps', ja: '地図', pattern: /地図|マップ|\bmap\b/i },
  { id: 'line', en: 'Line charts', ja: '折れ線グラフ', pattern: /折れ線|line chart/i },
  { id: 'pie', en: 'Pie charts', ja: '円グラフ', pattern: /円グラフ|pie chart/i },
  { id: 'scatter', en: 'Scatterplots', ja: '散布図', pattern: /散布図|scatter\s*plot/i }
];

function galleryFormLabel(form) {
  return copy(form.en, form.ja);
}

function matchesGalleryForm(item, form) {
  return form.pattern.test(`${item.title || ''} ${item.description || ''}`);
}

function galleryScrollZoomFactor(deltaY, deltaMode = 0) {
  const pixels = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? 400 : 1);
  return Math.exp(-Math.max(-100, Math.min(100, pixels)) * 0.001);
}

function setupGalleryImagePanZoom(viewport, image, level, controls) {
  const events = new AbortController();
  const signal = events.signal;
  let scale = 1, offsetX = 0, offsetY = 0, pointerId = null, startX = 0, startY = 0;
  const apply = () => {
    image.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    level.textContent = `${Math.round(scale * 100)}%`;
    viewport.classList.toggle('is-zoomed', scale > 1);
  };
  const zoom = (factor, clientX, clientY) => {
    const next = Math.min(8, Math.max(1, scale * factor));
    const ratio = next / scale;
    const box = viewport.getBoundingClientRect();
    const x = clientX === undefined ? 0 : clientX - box.left - box.width / 2;
    const y = clientY === undefined ? 0 : clientY - box.top - box.height / 2;
    offsetX = x - (x - offsetX) * ratio;
    offsetY = y - (y - offsetY) * ratio;
    scale = next;
    apply();
  };
  const reset = () => { scale = 1; offsetX = 0; offsetY = 0; apply(); };
  controls.querySelector('[data-gallery-zoom-in]').addEventListener('click', () => zoom(1.3), { signal });
  controls.querySelector('[data-gallery-zoom-out]').addEventListener('click', () => zoom(1 / 1.3), { signal });
  controls.querySelector('[data-gallery-zoom-reset]').addEventListener('click', reset, { signal });
  viewport.addEventListener('wheel', event => {
    event.preventDefault();
    zoom(galleryScrollZoomFactor(event.deltaY, event.deltaMode), event.clientX, event.clientY);
  }, { passive: false, signal });
  viewport.addEventListener('dblclick', event => zoom(1.5, event.clientX, event.clientY), { signal });
  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button')) return;
    pointerId = event.pointerId;
    startX = event.clientX - offsetX; startY = event.clientY - offsetY;
    viewport.setPointerCapture(pointerId);
    viewport.classList.add('is-dragging');
  }, { signal });
  viewport.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId) return;
    offsetX = event.clientX - startX; offsetY = event.clientY - startY; apply();
  }, { signal });
  const endDrag = event => {
    if (event.pointerId !== pointerId) return;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(pointerId)) viewport.releasePointerCapture(pointerId);
    pointerId = null;
  };
  viewport.addEventListener('pointerup', endDrag, { signal });
  viewport.addEventListener('pointercancel', endDrag, { signal });
  image.addEventListener('load', reset, { signal });
  apply();
  return () => events.abort();
}

function paintGalleryWorkStatus(root, status) {
  if (status === 'pending') {
    const loading = element('div', '', 'gallery-work-loading');
    loading.setAttribute('role', 'status');
    const spinner = element('span', '', 'gallery-work-spinner');
    spinner.setAttribute('aria-hidden', 'true');
    loading.append(spinner, element('p', copy('Loading this work…', '作品を読み込んでいます…')));
    root.replaceChildren(loading);
    return;
  }
  const message = status === 'failed'
    ? copy('This work could not be loaded right now.', '作品を読み込めませんでした。')
    : copy('Work not found', '作品が見つかりません');
  const back = element('a', copy('Back to gallery ←', 'ギャラリーに戻る ←'));
  back.href = 'gallery.html';
  root.replaceChildren(element('h1', message, 'gallery-work-missing'), back);
}

function paintGalleryWork(items) {
  const root = document.querySelector('[data-gallery-work]');
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || '';
  const item = items.find(entry => galleryItemKey(entry) === id);
  if (!item) {
    paintGalleryWorkStatus(root, galleryWorkLiveStatus);
    return;
  }
  const week = params.get('week') === 'all' ? 'all' : /^\d+$/.test(params.get('week') || '') ? params.get('week') : String(item.week);
  const tool = galleryTools.some(entry => entry.name === params.get('tool')) ? params.get('tool') : '';
  const chart = galleryForms.some(entry => entry.id === params.get('chart')) ? params.get('chart') : '';
  const shown = galleryVisibleItems(items, week, tool, chart);
  const index = shown.findIndex(entry => galleryItemKey(entry) === id);
  const backParams = new URLSearchParams({ week });
  if (tool) backParams.set('tool', tool);
  if (chart) backParams.set('chart', chart);
  const nav = element('nav', '', 'gallery-work-navigation');
  nav.setAttribute('aria-label', copy('Work navigation', '作品の移動'));
  const back = element('a', copy('← Back to gallery', '← ギャラリーに戻る'), 'gallery-work-back');
  back.href = `gallery.html?${backParams}`;
  nav.append(back);
  nav.append(element('span', index < 0 ? '' : `${index + 1} / ${shown.length}`, 'gallery-work-position'));
  const sequence = element('div', '', 'gallery-work-sequence');
  [['prev', index - 1, copy('← Previous', '← 前の作品')], ['next', index + 1, copy('Next →', '次の作品 →')]].forEach(([direction, target, label]) => {
    const available = index >= 0 && target >= 0 && target < shown.length;
    const control = element(available ? 'a' : 'span', label, `gallery-work-${direction}${available ? '' : ' is-disabled'}`);
    if (available) control.href = galleryPageUrl(shown[target], week, tool, chart);
    sequence.append(control);
  });
  nav.append(sequence);

  const layout = element('div', '', 'gallery-work-layout');
  const art = element('section', '', 'gallery-work-art');
  art.setAttribute('aria-label', copy('Zoomable visualization', '拡大・移動できる作品画像'));
  const toolbar = element('div', '', 'gallery-work-toolbar');
  const hint = element('span', copy('Scroll to zoom · drag to pan', 'スクロールで拡大 · ドラッグで移動'), 'gallery-work-hint');
  const controls = element('div', '', 'gallery-work-zoom-controls');
  const out = element('button', '−'); out.type = 'button'; out.dataset.galleryZoomOut = ''; out.setAttribute('aria-label', copy('Zoom out', '縮小'));
  const level = element('span', '100%', 'gallery-work-zoom-level'); level.setAttribute('aria-live', 'polite');
  const zoomIn = element('button', '+'); zoomIn.type = 'button'; zoomIn.dataset.galleryZoomIn = ''; zoomIn.setAttribute('aria-label', copy('Zoom in', '拡大'));
  const reset = element('button', copy('Fit', '全体表示')); reset.type = 'button'; reset.dataset.galleryZoomReset = '';
  const fullscreen = element('button', '⛶'); fullscreen.type = 'button';
  fullscreen.setAttribute('aria-label', copy('Full screen', '全画面表示'));
  fullscreen.addEventListener('click', async () => {
    if (document.fullscreenElement === art) { await document.exitFullscreen(); return; }
    if (art.classList.contains('is-fullscreen')) { art.classList.remove('is-fullscreen'); return; }
    try {
      if (!art.requestFullscreen) throw new Error('Fullscreen unavailable');
      await art.requestFullscreen();
    } catch { art.classList.add('is-fullscreen'); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') art.classList.remove('is-fullscreen');
  });
  controls.append(out, level, zoomIn, reset, fullscreen); toolbar.append(hint, controls);
  const viewport = element('div', '', 'gallery-work-viewport');
  art.append(toolbar, viewport);
  let imageRequest = 0;
  let stopPanZoom = () => {};
  const imageNavigation = galleryImageControls(galleryImageCount(item), slot => showWorkImage(slot));
  const replaceImageContents = (...nodes) => {
    viewport.replaceChildren(...nodes);
    if (imageNavigation.element) viewport.append(imageNavigation.element);
  };

  const details = element('aside', '', 'gallery-work-details');
  const weekLink = element('a', `${copy(`WEEK ${item.week}`, `第${item.week}週`)} · ${challengeForWeek(item.week) || String(item.challenge || '').replace(/^第\d+週｜/, '')}`, 'gallery-work-week');
  weekLink.href = `agenda.html#week-${item.week}`;
  details.append(weekLink);
  details.append(element('h1', item.title || copy('Untitled work', '無題の作品')));
  details.append(element('p', item.studentName || '', 'gallery-work-author'));
  const description = element('div', '', 'gallery-work-description'); appendGalleryText(description, item.description);
  details.append(description);
  const metadata = element('div', '', 'gallery-work-metadata');
  const toolBlock = element('div', '', 'gallery-work-meta-block');
  toolBlock.append(element('h2', copy('Tools', 'ツール')));
  const matched = matchedGalleryTools(item.tools);
  if (matched.length) matched.forEach(entry => {
    const chip = element(entry.url ? 'a' : 'span', entry.name, 'gallery-tool-chip');
    if (entry.url) { chip.href = entry.url; chip.target = '_blank'; chip.rel = 'noopener noreferrer'; }
    toolBlock.append(chip);
  });
  else toolBlock.append(element('p', item.tools || '—'));
  metadata.append(toolBlock);
  const dateBlock = element('div', '', 'gallery-work-meta-block');
  dateBlock.append(element('h2', copy('Submitted', '提出日')));
  dateBlock.append(element('p', item.submittedAt || '—')); metadata.append(dateBlock);
  const sourceBlock = element('div', '', 'gallery-work-meta-block');
  sourceBlock.append(element('h2', copy('Data / sources', 'データ・出典')));
  const sources = galleryUrls(item.projectUrl);
  if (sources.length) sources.forEach((href, number) => {
    const link = element('a', sources.length > 1 ? copy(`Source ${number + 1} ↗`, `出典 ${number + 1} ↗`) : copy('Open data / source ↗', 'データ・出典を開く ↗'));
    link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.title = href;
    sourceBlock.append(link);
  });
  else sourceBlock.append(element('p', item.projectUrl || '—'));
  metadata.append(sourceBlock); details.append(metadata, galleryHeart(item));
  layout.append(art, details); root.replaceChildren(nav, layout);

  async function showWorkImage(slot) {
    const request = ++imageRequest;
    imageNavigation.select(slot);
    stopPanZoom();
    stopPanZoom = () => {};
    replaceImageContents(element('span', '', 'gallery-work-spinner'), element('span', copy('Loading image…', '画像を読み込んでいます…')));
    viewport.classList.add('is-loading');
    const data = await galleryImageSource(item, slot);
    if (!viewport.isConnected || request !== imageRequest) return;
    if (!/^assets\/gallery\/[a-f0-9]{24}\.(?:png|jpg|webp|gif)$/.test(data) && !/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(data)) {
      replaceImageContents(element('span', copy('Screenshot unavailable.', '画像を表示できません。')));
      controls.hidden = true;
      return;
    }
    controls.hidden = false;
    const image = document.createElement('img'); image.src = data;
    image.alt = copy(`Image ${slot} of ${galleryImageCount(item)} by ${item.studentName || 'a student'}: ${item.title || 'untitled'}`, `${item.studentName || '学生'}の作品 ${slot} / ${galleryImageCount(item)}：${item.title || '無題'}`);
    image.draggable = false;
    try { await image.decode(); }
    catch { if (request === imageRequest) replaceImageContents(element('span', copy('Screenshot unavailable.', '画像を表示できません。'))); return; }
    if (!viewport.isConnected || request !== imageRequest) return;
    viewport.classList.remove('is-loading');
    replaceImageContents(image);
    stopPanZoom = setupGalleryImagePanZoom(viewport, image, level, controls);
  }
  showWorkImage(1);
}

async function renderGalleryWork() {
  const root = document.querySelector('[data-gallery-work]');
  if (!root) return;
  galleryWorkItems ||= recentGalleryItems();
  if (galleryWorkItems) paintGalleryWork(galleryWorkItems);
  try {
    const response = await fetch('data/gallery-public.json?v=gallery-performance-20261002', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Gallery snapshot HTTP ${response.status}`);
    const snapshot = await response.json();
    if (!Array.isArray(snapshot.items)) throw new Error('Invalid gallery snapshot');
    if (!galleryWorkItems || galleryWorkItems.length < snapshot.items.length) {
      galleryWorkItems = snapshot.items;
      rememberGalleryItems(galleryWorkItems);
      paintGalleryWork(galleryWorkItems);
    }
  } catch (error) {
    console.warn('Gallery work snapshot:', error);
    if (!galleryWorkItems) paintGalleryWorkStatus(root, 'pending');
  }
  if (galleryWorkRefreshStarted) return;
  galleryWorkRefreshStarted = true;
  loadGalleryItems().then(latest => {
    const changed = !galleryWorkItems || !sameGalleryItems(galleryWorkItems, latest);
    const cachedImages = new Map((galleryWorkItems || []).map(item => [galleryItemKey(item), item.imageUrls || [item.imageUrl]]));
    if (changed) {
      galleryWorkItems = latest.map(item => ({ ...item, imageUrls: cachedImages.get(galleryItemKey(item)) || [], imageUrl: cachedImages.get(galleryItemKey(item))?.[0] || '' }));
      rememberGalleryItems(galleryWorkItems);
    }
    galleryWorkLiveStatus = 'loaded';
    if (changed) paintGalleryWork(galleryWorkItems);
  }).catch(error => {
    console.warn('Gallery work live refresh:', error);
    galleryWorkLiveStatus = 'failed';
    if (!galleryWorkItems) paintGalleryWork([]);
  });
}

function renderGalleryInsights(items, selectedWeek, selectedTool, selectedForm, shownCount, onToolSelect, onFormSelect) {
  const root = document.querySelector('[data-gallery-insights]');
  if (!root) return;
  root.replaceChildren();
  root.hidden = !items.length;
  if (!items.length) return;
  const lead = element('div', '', 'gallery-insights-lead');
  lead.append(element('p', selectedWeek === 'all' ? copy('ALL WEEKS / AT A GLANCE', '全週の作品 / ひと目で') : copy(`WEEK ${String(selectedWeek).padStart(2, '0')} / AT A GLANCE`, `第${selectedWeek}週の作品 / ひと目で`), 'eyebrow'));
  lead.append(element('strong', String(items.length), 'gallery-insights-number'));
  lead.append(element('span', copy('student works', '点の作品'), 'gallery-insights-unit'));
  const sourceCount = items.filter(item => galleryUrls(item.projectUrl).length).length;
  lead.append(element('p', copy(`${sourceCount} include a data or source link.`, `${sourceCount}点にデータ・出典リンクがあります。`), 'gallery-insights-note'));
  if (selectedTool) {
    const active = element('button', copy(`Showing ${selectedTool} works · Clear filter ×`, `${selectedTool} の作品を表示中 · 解除 ×`), 'gallery-active-tool');
    active.type = 'button'; active.addEventListener('click', () => onToolSelect(''));
    lead.append(active);
  }
  if (selectedForm) {
    const form = galleryForms.find(entry => entry.id === selectedForm);
    const label = galleryFormLabel(form);
    const active = element('button', copy(`Showing ${label} · Clear filter ×`, `${label} の作品を表示中 · 解除 ×`), 'gallery-active-tool');
    active.type = 'button'; active.addEventListener('click', () => onFormSelect(''));
    lead.append(active);
  }
  if (selectedTool || selectedForm) lead.append(element('p', copy(`${shownCount} matching works`, `該当する作品 ${shownCount}点`), 'gallery-filter-count'));
  root.append(lead);
  const toolCounts = new Map();
  items.forEach(item => matchedGalleryTools(item.tools).forEach(tool => toolCounts.set(tool.name, (toolCounts.get(tool.name) || 0) + 1)));
  const popular = [...toolCounts].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const panel = element('div', '', 'gallery-insights-tools');
  panel.append(element('h2', copy('Tools students used', 'みんなが使ったツール')));
  panel.append(element('p', copy('Mentions across submissions · select a tool to filter', '提出作品での言及数 · クリックで絞り込み'), 'gallery-insights-caption'));
  const max = popular[0]?.[1] || 1;
  popular.forEach(([name, count]) => {
    const row = element('button', '', 'gallery-tool-bar');
    row.type = 'button';
    row.setAttribute('aria-pressed', String(selectedTool === name));
    row.setAttribute('aria-label', copy(`Filter to ${name}: ${count} works`, `${name} の作品 ${count}点に絞る`));
    row.addEventListener('click', () => onToolSelect(selectedTool === name ? '' : name));
    const label = element('span', name); const value = element('b', String(count));
    const track = element('span', '', 'gallery-tool-track');
    const fill = element('span', '', 'gallery-tool-fill'); fill.style.width = `${Math.round(count / max * 100)}%`;
    track.append(fill); row.append(label, track, value); panel.append(row);
  });
  const forms = galleryForms.map(form => ({ ...form, count: items.filter(item => matchesGalleryForm(item, form)).length }))
    .filter(form => form.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
  if (forms.length) {
    const formsBlock = element('div', '', 'gallery-insights-forms');
    formsBlock.append(element('p', copy('Visual forms mentioned · select to filter', '作品の説明に登場した表現 · クリックで絞り込み'), 'gallery-insights-caption'));
    forms.forEach(form => {
      const label = galleryFormLabel(form);
      const chip = element('button', `${label} ${form.count}`, 'gallery-form-chip');
      chip.type = 'button';
      chip.setAttribute('aria-pressed', String(selectedForm === form.id));
      chip.setAttribute('aria-label', copy(`Filter to ${label}: ${form.count} works`, `${label} の作品 ${form.count}点に絞る`));
      chip.addEventListener('click', () => onFormSelect(selectedForm === form.id ? '' : form.id));
      formsBlock.append(chip);
    });
    panel.append(formsBlock);
  }
  root.append(panel);
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
    const saved = recentGalleryItems();
    if (saved && saved.length >= items.length) items = saved;
    rememberGalleryItems(items);
    status.textContent = copy(`${items.length} works.`, `${items.length} 点の作品。`);
  } catch (error) {
    console.warn('Gallery snapshot:', error);
    try {
      items = await loadGalleryItems();
      rememberGalleryItems(items);
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
  const wrapper = element('label', copy('Week', '週'), 'gallery-filter');
  const weekSelect = document.createElement('select'); weekSelect.name = 'week';
  wrapper.append(weekSelect); controls.append(wrapper);
  const params = new URLSearchParams(location.search);
  const requestedWeek = params.get('week');
  let selectedTool = params.get('tool') || '';
  if (!galleryTools.some(tool => tool.name === selectedTool)) selectedTool = '';
  let selectedForm = params.get('chart') || '';
  if (!galleryForms.some(form => form.id === selectedForm)) selectedForm = '';
  let userChangedWeek = false;
  function updateWeekOptions() {
    const selected = userChangedWeek ? weekSelect.value : requestedWeek;
    const counts = galleryWeekCounts(items);
    weekSelect.replaceChildren(option('all', copy(`All weeks (${items.length})`, `すべての週（${items.length}点）`)));
    [...counts].sort(([a], [b]) => a - b).forEach(([week, count]) =>
      weekSelect.append(option(String(week), copy(`Week ${week} (${count})`, `第${week}週（${count}点）`))));
    const latestWeek = Math.max(...counts.keys());
    weekSelect.value = selected === 'all' || counts.has(Number(selected)) ? selected : String(latestWeek);
    controlBar?.toggleAttribute('hidden', !items.length);
  }
  updateWeekOptions();
  let imageObserver;
  function chooseTool(name) {
    selectedTool = name;
    const url = new URL(location.href);
    if (name) url.searchParams.set('tool', name);
    else url.searchParams.delete('tool');
    history.replaceState(null, '', url);
    paint();
  }
  function chooseForm(id) {
    selectedForm = id;
    const url = new URL(location.href);
    if (id) url.searchParams.set('chart', id);
    else url.searchParams.delete('chart');
    history.replaceState(null, '', url);
    paint();
  }
  function paint() {
    imageObserver?.disconnect();
    const weekItems = items.filter(item => weekSelect.value === 'all' || String(item.week) === weekSelect.value);
    const shown = galleryVisibleItems(items, weekSelect.value, selectedTool, selectedForm);
    root.replaceChildren();
    renderGalleryInsights(weekItems, weekSelect.value, selectedTool, selectedForm, shown.length, chooseTool, chooseForm);
    status.hidden = shown.length > 0;
    if (!shown.length) {
      const message = selectedTool || selectedForm ? copy('No works match these filters.', '条件に合う作品はありません。')
        : copy('No submissions yet.', '提出作品はまだありません。');
      root.append(element('p', message, 'gallery-status'));
      return;
    }
    const showImage = async (placeholder, item, eager = false) => {
      const data = await galleryImageSource(item, 1);
      if (!placeholder.isConnected) return;
      if (/^assets\/gallery\/[a-f0-9]{24}\.(?:png|jpg|webp|gif)$/.test(data) || /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(data)) {
        const image = document.createElement('img'); image.src = data;
        image.alt = copy(`Image 1 of ${galleryImageCount(item)} for ${item.title || 'student work'}`, `${item.title || '学生作品'}の画像 1 / ${galleryImageCount(item)}`);
        // The observer already defers offscreen cards. A detached lazy image
        // will not start loading, so decode() would wait forever here.
        image.loading = 'eager';
        if (eager && 'fetchPriority' in image) image.fetchPriority = 'high';
        try { await image.decode(); }
        catch {
          if (!placeholder.isConnected) return;
          placeholder.replaceChildren(element('span', copy('Screenshot unavailable. ', '画像を表示できません。')));
          const retry = element('button', copy('Try again', '再読み込み'), 'gallery-retry');
          retry.type = 'button';
          retry.addEventListener('click', () => { placeholder.replaceChildren(element('span', '', 'gallery-work-spinner'), element('span', copy('Loading screenshot…', '画像を読み込んでいます…'))); showImage(placeholder, item, eager); });
          placeholder.append(retry);
          return;
        }
        if (!placeholder.isConnected) return;
        const link = element('a', '', 'gallery-image-button');
        link.href = galleryPageUrl(item, weekSelect.value, selectedTool, selectedForm);
        link.setAttribute('aria-label', copy(`View ${item.title || 'student work'}`, `${item.title || '学生作品'}を詳しく見る`));
        link.append(image);
        const stage = element('div', '', 'gallery-image-stage');
        stage.append(link);
        let currentSlot = 1;
        let imageRequest = 0;
        const navigation = galleryImageControls(galleryImageCount(item), async slot => {
          if (slot === currentSlot) return;
          const request = ++imageRequest;
          const next = await galleryImageSource(item, slot);
          if (!stage.isConnected || request !== imageRequest) return;
          if (!/^assets\/gallery\/[a-f0-9]{24}\.(?:png|jpg|webp|gif)$/.test(next) && !/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(next)) return;
          image.src = next;
          image.alt = copy(`Image ${slot} of ${galleryImageCount(item)} for ${item.title || 'student work'}`, `${item.title || '学生作品'}の画像 ${slot} / ${galleryImageCount(item)}`);
          currentSlot = slot;
          navigation.select(slot);
        });
        if (navigation.element) stage.append(navigation.element);
        navigation.select(1);
        placeholder.replaceWith(stage);
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
      const placeholder = element('div', '', 'gallery-placeholder');
      placeholder.append(element('span', '', 'gallery-work-spinner'), element('span', copy('Loading screenshot…', '画像を読み込んでいます…')));
      placeholder.dataset.itemIndex = index; card.append(placeholder);
      const weekLink = element('a', `${copy(`WEEK ${item.week}`, `第${item.week}週`)} · ${challengeForWeek(item.week) || String(item.challenge || '').replace(/^第\d+週｜/, '')}`, 'meta');
      weekLink.href = `agenda.html#week-${item.week}`; card.append(weekLink);
      const heading = element('h2');
      const titleLink = element('a', item.title || copy('Untitled work', '無題の作品'), 'gallery-card-title-link');
      titleLink.href = galleryPageUrl(item, weekSelect.value, selectedTool, selectedForm);
      heading.append(titleLink); card.append(heading);
      card.append(element('p', item.studentName || '', 'gallery-student'));
      const description = element('div', '', 'gallery-description'); appendGalleryText(description, item.description); card.append(description);
      const footer = element('div', '', 'gallery-card-footer');
      const tools = element('div', '', 'gallery-card-tools'); tools.title = item.tools || '';
      tools.append(element('span', copy('Tools', 'ツール'), 'gallery-card-label'));
      const matches = matchedGalleryTools(item.tools);
      if (matches.length) matches.forEach(tool => {
        const chip = element(tool.url ? 'a' : 'span', tool.name, 'gallery-tool-chip');
        if (tool.url) { chip.href = tool.url; chip.target = '_blank'; chip.rel = 'noopener noreferrer'; }
        tools.append(chip);
      });
      else tools.append(element('span', item.tools || '—', 'gallery-tool-raw'));
      footer.append(tools);
      footer.append(element('p', item.submittedAt ? `${copy('Submitted:', '提出日:')} ${item.submittedAt}` : '', 'gallery-date'));
      const sources = galleryUrls(item.projectUrl);
      const links = element('div', '', 'gallery-source-links');
      if (sources.length) {
        sources.forEach((href, number) => {
          const label = sources.length > 1
            ? copy(`Data / source ${number + 1} ↗`, `データ・出典 ${number + 1} ↗`)
            : copy('Open data / source ↗', 'データ・出典を開く ↗');
          const link = element('a', label); link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.title = href;
          links.append(link);
        });
      } else if (item.projectUrl) links.append(element('span', `${copy('Data / source:', 'データ・出典:')} ${item.projectUrl}`, 'gallery-source-note'));
      footer.append(links, galleryHeart(item));
      card.append(footer);
      root.append(card);
      if (index < 3) showImage(placeholder, item, true);
      else if (imageObserver) imageObserver.observe(placeholder);
      else showImage(placeholder, item);
    });
  }
  weekSelect.addEventListener('change', () => {
    userChangedWeek = true;
    const url = new URL(location.href);
    if (weekSelect.value === 'all') url.searchParams.delete('week');
    else url.searchParams.set('week', weekSelect.value);
    history.replaceState(null, '', url);
    paint();
  });
  paint();
  // The embedded snapshot makes the gallery immediate. The public feed adds
  // submissions and revisions on every visit without rebuilding GitHub Pages.
  loadGalleryItems().then(latest => {
    if (sameGalleryItems(items, latest)) return;
    const cachedImages = new Map(items.map(item => [galleryItemKey(item), item.imageUrls || [item.imageUrl]]));
    items = latest.map(item => ({ ...item, imageUrls: cachedImages.get(galleryItemKey(item)) || [], imageUrl: cachedImages.get(galleryItemKey(item))?.[0] || '' }));
    rememberGalleryItems(items);
    status.textContent = copy(`${items.length} latest works.`, `最新の作品 ${items.length} 点。`);
    updateWeekOptions();
    paint();
  }).catch(error => console.warn('Gallery live refresh:', error));
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
