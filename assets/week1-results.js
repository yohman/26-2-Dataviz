(() => {
  const SHEET_ID = '1Oa3cB_WWaB82c65ppnh3hQID-WKpSRJEJ0tZZsj7mig';
  const SHEET_GID = '317349982';
  const root = document.querySelector('[data-activity-results]');
  const status = document.querySelector('[data-activity-results-status]');
  const previewImages = new Map([
    ['fx.minkabu.jp', 'https://fx.minkabu.jp/assets/og/pair-ef23ea4aa56e8a6bda7fb74f9fe9eac8cd7e405871f5ac22736b863e706da3f7.png'],
    ['x.com', 'https://pbs.twimg.com/media/HSu3mIzbYAAIea9?format=webp&name=large'],
    ['mcbattlenow.com', 'https://mcbattlenow.com/og-image.png'],
    ['ja.minecraft.wiki', 'https://minecraft.wiki/images/thumb/Extracted_Ores.png/1200px-Extracted_Ores.png?1856c']
  ]);
  let currentItems = [];

  const isJapanese = () => document.documentElement.lang === 'ja';
  const copy = (english, japanese) => isJapanese() ? japanese : english;
  const clean = value => String(value || '').trim();
  const firstUrl = values => values.map(clean).map(value => value.match(/https?:\/\/[^\s]+/)?.[0] || '').find(Boolean) || '';
  const safeUrl = value => {
    try {
      const url = new URL(clean(value));
      if (!['http:', 'https:'].includes(url.protocol) || url.href.length > 2048) return '';
      if (/jupyter-proxy\.kaggle\.net$/i.test(url.hostname)) return '';
      return url.href;
    } catch { return ''; }
  };
  const isImage = url => /\.(?:png|jpe?g|webp|gif)(?:[?#].*)?$/i.test(url);
  const youtubeId = url => url.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)?.[1] || '';
  const fallbackTitle = url => {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch { return copy('Shared visualization', '共有された可視化'); }
  };

  function normalize(values) {
    const group = clean(values[0]);
    const url = safeUrl(firstUrl([values[1], values[2], values[3], values[4]]));
    if (!/^Group\s+\d+$/i.test(group) || !url) return null;
    return {
      group, url,
      data: clean(values[2]).replace(/https?:\/\/[^\s]+/g, '').trim() || fallbackTitle(url),
      reason: clean(values[3]), design: clean(values[4])
    };
  }

  function mediaFor(item) {
    const video = youtubeId(item.url);
    const hostPreview = previewImages.get(new URL(item.url).hostname);
    if (video || isImage(item.url) || hostPreview) {
      const image = document.createElement('img');
      image.src = video ? `https://i.ytimg.com/vi/${video}/hqdefault.jpg` : hostPreview || item.url;
      image.alt = ''; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer';
      return image;
    }
    const frame = document.createElement('iframe');
    frame.src = item.url; frame.title = copy(`Preview of ${item.data}`, `${item.data}のプレビュー`);
    frame.loading = 'lazy'; frame.referrerPolicy = 'no-referrer';
    frame.sandbox = 'allow-scripts allow-same-origin';
    return frame;
  }

  function makeCard(item) {
    const article = document.createElement('article'); article.className = 'activity-result-card';
    const preview = document.createElement('a'); preview.className = 'activity-result-preview';
    preview.href = item.url; preview.target = '_blank'; preview.rel = 'noopener';
    preview.setAttribute('aria-label', copy(`Open the visualization selected by ${item.group}`, `${item.group}が選んだ可視化を開く`));
    const label = document.createElement('span'); label.className = 'activity-result-preview-label';
    label.textContent = copy('OPEN ORIGINAL ↗', '元の作品を開く ↗');
    preview.append(mediaFor(item), label); article.append(preview);
    const body = document.createElement('div'); body.className = 'activity-result-copy';
    const group = document.createElement('p'); group.className = 'activity-result-group'; group.textContent = item.group;
    const title = document.createElement('h2'); title.textContent = item.data;
    body.append(group, title);
    [[copy('WHY THIS ONE', '選んだ理由'), item.reason], [copy('HOW THE DESIGN HELPS', 'デザインの工夫'), item.design]].forEach(([heading, value]) => {
      if (!value) return;
      const detail = document.createElement('p'); detail.className = 'activity-result-detail';
      const strong = document.createElement('strong'); strong.textContent = heading;
      detail.append(strong, document.createTextNode(value)); body.append(detail);
    });
    const open = document.createElement('a'); open.className = 'activity-result-open'; open.href = item.url;
    open.target = '_blank'; open.rel = 'noopener'; open.textContent = copy('Open visualization ↗', '可視化を開く ↗');
    body.append(open); article.append(body); return article;
  }

  function render(items) {
    currentItems = items;
    root.replaceChildren(...items.map(makeCard));
    status.textContent = copy(`${items.length} group selections · live from the spreadsheet.`, `${items.length}グループの選択 · スプレッドシートからライブ更新。`);
  }

  function loadSheet() {
    return new Promise((resolve, reject) => {
      const callback = `weekOneResults_${Date.now()}`;
      const script = document.createElement('script');
      let settled = false;
      const timer = setTimeout(() => finish(new Error('Spreadsheet request timed out')), 12000);
      function finish(error, value) {
        if (settled) return;
        settled = true; clearTimeout(timer); script.remove(); delete window[callback];
        error ? reject(error) : resolve(value);
      }
      window[callback] = payload => {
        try {
          if (payload?.status !== 'ok') throw new Error('Spreadsheet query failed');
          const items = (payload.table?.rows || []).slice(1)
            .map(row => Array.from({ length: 5 }, (_, index) => row.c?.[index]?.v ?? row.c?.[index]?.f ?? ''))
            .map(normalize).filter(Boolean);
          if (!items.length) throw new Error('No linked submissions yet');
          finish(null, items);
        } catch (error) { finish(error); }
      };
      script.onerror = () => finish(new Error('Spreadsheet feed unavailable'));
      const params = new URLSearchParams({ gid: SHEET_GID, range: 'A4:E50', tqx: `out:json;responseHandler:${callback}` });
      script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?${params}`;
      document.head.append(script);
    });
  }

  async function start() {
    if (!root || !status) return;
    try { render(await loadSheet()); }
    catch (error) {
      status.textContent = copy('Activity results are temporarily unavailable.', 'アクティビティの結果を読み込めませんでした。');
      console.error('Week 1 activity results:', error);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    start();
    document.querySelector('.language-toggle')?.addEventListener('click', () => setTimeout(() => currentItems.length && render(currentItems), 0));
  });
})();
