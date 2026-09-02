/*
 * Edit only this object when the course form and gallery feed are ready.
 * The gallery endpoint must be public, read-only, and return a JSON array.
 */
const COURSE_CONFIG = {
  GOOGLE_FORM_URL: 'https://docs.google.com/forms/d/e/REPLACE_WITH_FORM_ID/viewform',
  GOOGLE_FORM_WEEK_ENTRY_ID: 'entry.REPLACE_WITH_WEEK_FIELD_ID',
  GALLERY_API_URL: 'https://script.google.com/macros/s/REPLACE_WITH_WEB_APP_ID/exec'
};

// [act, English title, Japanese title, English LOOK, Japanese LOOK, English LEARN,
// Japanese LEARN, English MAKE, Japanese MAKE, English challenge, Japanese challenge]
const weeks = [
  ['SEE', 'Why Visualize?', 'なぜ可視化するのか？', 'Playfair and Minard, then Anscombe’s Quartet and the Datasaurus Dozen: same statistics, different stories', 'PlayfairとMinard、そしてアンスコムの四重奏とDatasaurus Dozen：同じ統計量、異なる物語', 'plot, compare, and discuss what summary statistics hide', 'プロットして比較し、要約統計が隠すものを話し合う', 'Make your first visualization from a dataset you find or create', '見つけた、または作成したデータで最初の可視化をつくる', 'Your first visualization', '最初の可視化'],
  ['SEE', 'Make It Legible', '見やすくする', 'visual encoding theory: position, length, angle, area, and color', '視覚エンコーディング：位置、長さ、角度、面積、色', 'marks, channels, hierarchy, annotation, and revision', 'マーク、チャンネル、階層、注釈、改訂', 'Revise a chart: reveal one pattern and add context', 'チャートを改訂し、一つのパターンと文脈を示す', 'Redesign', '再設計'],
  ['MAKE', 'Be Hans', 'ハンスになろう', 'Hans Rosling and Gapminder’s moving relationship between health, income, and population', 'Hans RoslingとGapminder：健康、所得、人口の動く関係', 'Tableau: import, wrangle, and explore hans.csv', 'Tableau：hans.csvの読み込み、整形、探索', 'Create a Tableau view with a title, source, and one finding', 'タイトル、出典、一つの発見を含むTableauビューをつくる', 'Tableau / Gapminder', 'Tableau／Gapminder'],
  ['MAKE', 'Find the Unexpected', '予想外を見つける', 'Tukey, Datasaurus, and why summaries can mislead', 'Tukey、Datasaurus、そして要約統計が見落とすもの', 'exploratory data analysis and Tableau dashboards', '探索的データ分析とTableauダッシュボード', 'Find and explain one “Wow!” discovery', '「これは！」と思う発見を一つ見つけて説明する', 'Discovery', '発見'],
  ['MAKE', 'Python, History, and Evidence', 'Python、歴史、証拠', 'Florence Nightingale’s mortality diagram and the choices that make evidence persuasive', 'Florence Nightingaleの死亡率図と、証拠を説得力あるものにする選択', 'make a first coded chart in a Python notebook', 'Pythonノートブックで最初のコード可視化をつくる', 'Make a coded visualization and explain the visual decision', 'コードによる可視化をつくり、視覚的な判断を説明する', 'Python view', 'Pythonビュー'],
  ['MAKE', 'Du Bois: Data as a Public Argument', 'Du Bois：公共的な主張としてのデータ', 'W. E. B. Du Bois’s 1900 Paris Exposition charts', 'W. E. B. Du Boisの1900年パリ万博チャート', 'recreate, remix, and discuss visualization as a tool for social justice', '再現、リミックス、社会正義の道具としての可視化を考える', 'Recreate or remix one Du Bois chart in your chosen tool', '好きなツールでDu Boisのチャートを一つ再現またはリミックスする', 'Du Bois remake', 'Du Boisの再制作'],
  ['QUESTION', 'Choose a Shared Dataset', '共有データセットを選ぶ', 'examples of final projects and the question behind each one', '最終プロジェクトの例と、その背後にある問い', 'form groups; choose one dataset; make 2–3 individual ideas', 'グループを組み、データセットを一つ選び、個人案を2〜3つつくる', 'Post 2–3 visual ideas for your group dataset', 'グループのデータセットについて可視化案を2〜3つ投稿する', 'Individual ideas', '個人アイデア'],
  ['QUESTION', 'Share, Discuss, Agree, Build', '共有、議論、合意、制作', 'how distinct views can become one group direction', '異なる見方を一つのグループの方向性へまとめる方法', 'share ideas, identify common ground, and begin a prototype', 'アイデアを共有し、共通点を見つけ、プロトタイプを始める', 'One group concept and a first prototype', 'グループ案一つと最初のプロトタイプ', 'Group concept', 'グループ案'],
  ['QUESTION', 'Studio Day: Test and Improve', 'スタジオデー：試して改善する', 'a prototype is a question you can test', 'プロトタイプは、試すことのできる問い', 'create, test, get feedback, and refine in class', '授業内でつくり、試し、フィードバックを受け、改訂する', 'Revision log and prototype update', '改訂記録とプロトタイプの更新', 'Prototype refinement', 'プロトタイプ改訂'],
  ['QUESTION', 'Midterm Group Presentations', '中間グループ発表', 'how other groups read your question, evidence, and form', '他グループがあなたの問い、証拠、形式をどう読むか', 'present, comment once, ask one question, then refine', '発表し、一つコメントし、一つ質問し、改訂する', 'Group concept, iterations, 200–300-word write-up, and all sketches', 'グループ案、反復過程、200〜300語の解説、全員のスケッチ', 'Midterm package', '中間発表パッケージ'],
  ['MAKE', 'Maps and Spatial Thinking', '地図と空間的思考', 'John Snow and the moment when location, distance, boundary, or scale changes the question', 'John Snowと、場所、距離、境界、縮尺が問いを変える瞬間', 'Google Earth, Kepler.gl, MapLibre, and web-map examples', 'Google Earth、Kepler.gl、MapLibre、Web地図の例', 'Add a map or spatial view to your project', 'プロジェクトに地図または空間的ビューを加える', 'Spatial view', '空間ビュー'],
  ['MAKE', 'Networks and Multi-View', 'ネットワークと複数ビュー', 'nodes, edges, and six degrees of separation', 'ノード、エッジ、六次の隔たり', 'network basics and Gephi Lite; choose the view that reveals a relationship', 'ネットワークの基本とGephi Lite；関係を示すビューを選ぶ', 'Create a network or a distinct second view for project data', 'プロジェクトデータのネットワーク、または独自の第二ビューをつくる', 'Network / second view', 'ネットワーク／第二ビュー'],
  ['REVEAL', 'Final Project Studio', '最終プロジェクト・スタジオ', 'works in progress and the last questions before publishing', '制作途中の作品と、公開前の最後の問い', 'build, test the explanation, credit sources, and prepare to show', '制作し、説明をテストし、出典を記し、見せる準備をする', 'Final build, sources, and process trail', '最終制作、出典、プロセス記録', 'Final build', '最終制作'],
  ['REVEAL', 'Final Presentations', '最終発表', 'class projects: migration, GDP, COVID, music networks, bear maps, and demography', '授業プロジェクト：移住、GDP、COVID、音楽ネットワーク、クマ地図、人口動態', 'public explanation, reflection, and gallery walk', '公開での説明、振り返り、ギャラリーウォーク', 'Publish your visualization, sources, process, and argument', '可視化、出典、プロセス、主張を公開する', 'Publish', '公開']
];

const acts = {
  SEE: ['Weeks 1–2 · Learn to notice', '第1〜2週 · 見ることを学ぶ'],
  MAKE: ['Weeks 3–7 · Build visual language', '第3〜7週 · 視覚言語をつくる'],
  QUESTION: ['Weeks 8–12 · Frame an argument', '第8〜12週 · 主張を組み立てる'],
  REVEAL: ['Weeks 13–14 · Make it public', '第13〜14週 · 社会に開く']
};

const weekMaterials = [
  [['Datasaurus CSV', 'data/datasaurus.csv'], ['Anscombe CSV', 'data/anscombe.csv'], ['Lecture slides', 'lectures/w01.pdf']],
  [['Lecture slides', 'lectures/w02.pdf'], ['Data Visualization Catalogue', 'https://datavizproject.com/']],
  [['Lecture slides', 'lectures/w03.pdf'], ['Gapminder data', 'data/gapminder/gapdata.ipynb'], ['Hans CSV', 'data/gapminder/hans.csv'], ['Tableau for students', 'https://www.tableau.com/academic/students']],
  [['Datasaurus CSV', 'data/datasaurus.csv'], ['Anscombe CSV', 'data/anscombe.csv'], ['Datasaurus paper', 'https://www.nature.com/articles/497186a'], ['Lecture slides', 'lectures/w04_lores.pdf']],
  [['Nightingale mortality diagram', 'https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg'], ['Python notebook', 'data/wrangle.ipynb'], ['Lecture slides', 'lectures/w05.pdf']],
  [['Library of Congress Du Bois collection', 'https://www.loc.gov/collections/african-american-photographs-1900-paris-exposition/'], ['Lecture slides', 'lectures/w06_lores.pdf']],
  [['Lecture slides', 'lectures/w07.pdf'], ['Gapminder data', 'data/gapminder.csv'], ['Disaster data', 'data/disasters.csv']],
  [['Lecture slides', 'lectures/w08.pdf'], ['Observable notebooks', 'https://observablehq.com/platform/notebooks']],
  [['Lecture slides', 'lectures/w09.pdf'], ['Padlet course wall', 'https://padlet.com/yohda/dataviz']],
  [['Lecture slides', 'lectures/w10.pdf'], ['Critique prompt', 'resources.html#project-help']],
  [['Lecture slides', 'lectures/w11_lorez.pdf'], ['Google Earth', 'https://earth.google.com/'], ['Kepler.gl', 'https://kepler.gl/'], ['MapLibre', 'https://maplibre.org/']],
  [['Lecture slides', 'lectures/w12.pdf'], ['Gephi Lite', 'https://lite.gephi.org/'], ['Network tutorial', 'https://medium.com/@vespinozag/gephi-lite-v1-0-1-complete-beginners-tutorial-200eaa4b9d0d']],
  [['Project checklist', 'resources.html#project-help']],
  [['Lecture slides', 'lectures/w14.pdf'], ['Gallery', 'gallery.html']]
];
const weekImages = [
  'assets/images/lecture/playfair.png',
  'assets/images/lecture/week02.png',
  'assets/images/lecture/hans.png',
  'assets/images/lecture/week04.png',
  'assets/images/lecture/week05.png',
  'assets/images/lecture/dubois-portrait.png',
  'assets/images/lecture/week07.png',
  'assets/images/lecture/week08.png',
  'assets/images/lecture/week09.png',
  '',
  'assets/images/lecture/spatial.png',
  'assets/images/lecture/week12.png',
  '',
  ''
];

const sampleSubmissions = [
  { timestamp: '2026-10-13T10:00:00Z', studentId: 'demo-a', studentName: 'Aiko S.', week: 3, challenge: 'Data Into Form', title: 'After the Rain', description: 'A comparison of evacuation-center capacity after severe rainfall.', tools: 'Tableau', projectUrl: '#', imageUrl: '', consent: true },
  { timestamp: '2026-10-21T10:00:00Z', studentId: 'demo-b', studentName: 'Ren K.', week: 4, challenge: 'Find the Unexpected', title: 'Same summary, different city', description: 'A Datasaurus-inspired look at neighborhood averages.', tools: 'Python', projectUrl: '#', imageUrl: '', consent: true },
  { timestamp: '2026-11-11T10:00:00Z', studentId: 'demo-c', studentName: 'Mina T.', week: 7, challenge: 'Where Matters', title: 'Five minutes from shade', description: 'Walking access to cool public places in summer.', tools: 'Kepler.gl, GeoJSON', projectUrl: '#', imageUrl: '', consent: true }
];

const isJapanese = () => window.courseLanguage === 'ja';
const copy = (english, japanese) => isJapanese() ? japanese : english;
const actForWeek = (week) => weeks[Number(week) - 1]?.[0] || '';
const challengeForWeek = (week) => weeks[Number(week) - 1]?.[isJapanese() ? 2 : 1] || '';

function setupShell() {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  menuButton?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a').forEach((link) => {
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
    renderAgenda(); renderMake(); renderGallery();
  }
  let language = 'en';
  try { language = localStorage.getItem('dv-language') || 'en'; } catch { /* English remains the fallback. */ }
  applyLanguage(language);
  languageButton.addEventListener('click', () => applyLanguage(language = language === 'en' ? 'ja' : 'en'));
}

function renderAgenda() {
  const root = document.querySelector('[data-agenda]');
  if (!root) return;
  let html = '', active = '';
  weeks.forEach((week, index) => {
    if (week[0] !== active) {
      active = week[0];
      html += `<div class="act-band" data-act="${active}"><div class="wrap"><h2>${active}</h2><p>${copy(...acts[active])}</p></div></div><section class="wrap week-list">`;
    }
    const no = String(index + 1).padStart(2, '0');
    const media = weekImages[index] ? `<figure class="week-visual"><img src="${weekImages[index]}" alt="" loading="lazy"><figcaption>${copy('From the lecture slides', '講義スライドより')}</figcaption></figure>` : `<figure class="week-visual week-visual--placeholder"><figcaption>${copy('Add a project image, prototype, or dataset preview here.', 'プロジェクト画像、プロトタイプ、データのプレビューをここに追加。')}</figcaption></figure>`;
    const materials = [...weekMaterials[index]].sort(([, firstHref], [, secondHref]) => {
      return Number(secondHref.includes('lectures/')) - Number(firstHref.includes('lectures/'));
    }).map(([label, href]) => {
      const type = href.includes('lectures/') ? 'slides' : href.startsWith('data/') ? 'data' : 'reference';
      return `<a class="material-link material-link--${type}" href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${label} ↗</a>`;
    }).join('');
    html += `<article class="week" id="week-${index + 1}"><div><div class="week-number">${no}</div><div class="week-date">${copy('Date TBC', '日程未定')}</div></div><div class="week-content"><div class="week-heading"><div><h2>${copy(week[1], week[2])}</h2><div class="week-meta"><span>${week[0]}</span><span>${copy(`Week ${index + 1}`, `第${index + 1}週`)}</span></div></div>${media}</div><div class="week-grid"><div><h3>LOOK</h3><p>${copy(week[3], week[4])}</p></div><div><h3>LEARN</h3><p>${copy(week[5], week[6])}</p></div><div><h3>MAKE</h3><p><a class="inline-resource" href="make.html#make-${no}">${copy(week[7], week[8])}</a></p></div></div><div class="week-materials"><span>${copy('OPEN MATERIALS', '資料を開く')}</span>${materials}</div></div></article>`;
    if (!weeks[index + 1] || weeks[index + 1][0] !== active) html += '</section>';
  });
  root.innerHTML = html;
}

function formUrl(week, title) {
  const params = new URLSearchParams();
  params.set(COURSE_CONFIG.GOOGLE_FORM_WEEK_ENTRY_ID, `Week ${week}: ${title}`);
  return `${COURSE_CONFIG.GOOGLE_FORM_URL}?usp=pp_url&${params}`;
}

function renderMake() {
  const root = document.querySelector('[data-make]');
  if (!root) return;
  root.innerHTML = weeks.map((week, index) => {
    const no = String(index + 1).padStart(2, '0');
    const tools = index < 2 ? 'Any tool' : index < 5 ? 'Tableau or Python' : index === 6 ? 'Kepler.gl or GeoJSON' : 'Choose for the question';
    const materials = [...weekMaterials[index]].sort(([, firstHref], [, secondHref]) => {
      return Number(secondHref.includes('lectures/')) - Number(firstHref.includes('lectures/'));
    }).map(([label, href]) => {
      const type = href.includes('lectures/') ? 'slides' : href.startsWith('data/') ? 'data' : 'reference';
      return `<a class="material-link material-link--${type}" href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${label} ↗</a>`;
    }).join('');
    const thumbnail = weekImages[index] ? `<img class="make-thumb" src="${weekImages[index]}" alt="" loading="lazy">` : '';
    return `<article class="make-row" id="make-${no}"><div class="when">${copy(`WEEK ${no}`, `第${no}週`)}<br>${week[0]}</div><div>${thumbnail}<h2>${copy(week[9], week[10])}</h2><p>${copy(week[7], week[8])}</p></div><div class="make-details"><p><strong>${copy('Brief', '課題')}</strong>${copy(week[7], week[8])}</p><p><strong>${copy('Deliverables', '提出物')}</strong>${copy('Visualization, title, concise explanation, and source link.', '可視化、タイトル、短い説明、出典リンク。')}</p><p><strong>${copy('Suggested tools', 'おすすめのツール')}</strong>${copy(tools, index < 2 ? '自由' : index < 5 ? 'Tableau または Python' : index === 6 ? 'Kepler.gl または GeoJSON' : '問いに合わせて選ぶ')}</p><p><strong>${copy('Submission', '提出')}</strong>${copy('Title, what it reveals, tools, project URL, image link, and public-display consent.', 'タイトル、明らかにすること、ツール、作品URL、画像リンク、公開同意。')}</p><div class="make-materials"><strong>${copy('Start here', 'ここから始める')}</strong>${materials}</div><div class="submit"><a class="button" target="_blank" rel="noopener" href="${formUrl(index + 1, week[9])}">${copy('Submit this assignment', 'この課題を提出する')}</a></div></div></article>`;
  }).join('');
}

function normalizeSubmission(item) {
  return { ...item, week: Number(item.week), consent: item.consent === true || String(item.consent).toLowerCase() === 'true' };
}

function latestPublic(rows) {
  const latest = new Map();
  rows.map(normalizeSubmission).filter((item) => item.consent && item.studentId && item.week).forEach((item) => {
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
    ['week', copy('Week', '週'), [['all', copy('All weeks', 'すべての週')], ...weeks.map((week, index) => [String(index + 1), copy(`Week ${index + 1}`, `第${index + 1}週`)])]],
    ['challenge', copy('Challenge', '課題'), [['all', copy('All challenges', 'すべての課題')], ...weeks.map((week, index) => [String(index + 1), copy(week[1], week[2])])]],
    ['tool', copy('Tool', 'ツール'), [['all', copy('All tools', 'すべてのツール')], ...[...new Set(items.flatMap((item) => String(item.tools || '').split(',').map((tool) => tool.trim()).filter(Boolean)))].sort().map((tool) => [tool, tool])]],
    ['act', copy('Course act', '授業の段階'), [['all', copy('All acts', 'すべての段階')], ...Object.keys(acts).map((act) => [act, act])]]
  ];
  const selects = {};
  filters.forEach(([name, label, values]) => {
    const wrapper = element('label', label, 'gallery-filter');
    const select = document.createElement('select'); select.name = name;
    values.forEach(([value, text]) => select.append(option(value, text)));
    wrapper.append(select); controls.append(wrapper); selects[name] = select;
  });
  function paint() {
    const shown = items.filter((item) => (selects.week.value === 'all' || String(item.week) === selects.week.value)
      && (selects.challenge.value === 'all' || String(item.week) === selects.challenge.value)
      && (selects.tool.value === 'all' || String(item.tools).split(',').map((tool) => tool.trim()).includes(selects.tool.value))
      && (selects.act.value === 'all' || actForWeek(item.week) === selects.act.value));
    root.replaceChildren();
    if (!shown.length) { root.append(element('p', copy('No public submissions match these filters yet.', 'このフィルターに一致する公開作品はまだありません。'), 'gallery-status')); return; }
    shown.forEach((item) => {
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
  Object.values(selects).forEach((select) => select.addEventListener('change', paint));
  paint();
}

document.addEventListener('DOMContentLoaded', setupShell);
