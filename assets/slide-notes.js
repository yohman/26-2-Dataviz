(function (global) {
  'use strict';
  function createSlideNotes({ root, file, language, page = 1, fetcher = global.fetch.bind(global) }) {
    let currentPage = page;
    let slides;
    let failed = false;
    const enabled = root && file === 'lectures/w05-python-datasaurus.pdf';
    function render() {
      if (!enabled) return;
      root.hidden = false;
      const ja = language() === 'ja';
      const heading = root.querySelector('[data-notes-heading]');
      const text = root.querySelector('[data-notes-text]');
      const original = root.querySelector('[data-notes-original]');
      const details = root.querySelector('details');
      const sources = root.querySelector('[data-notes-sources]');
      heading.textContent = ja ? `講義ノート · ${currentPage}` : `Presenter notes · ${currentPage}`;
      root.querySelector('summary').textContent = ja ? '元スライドの説明' : 'Original slide text';
      sources.replaceChildren();
      if (!slides) {
        text.textContent = failed
          ? (ja ? 'ノートを読み込めませんでした。再読み込みしてください。' : 'Could not load notes. Please reload.')
          : (ja ? 'ノートを読み込んでいます…' : 'Loading notes…');
        details.hidden = true;
        return;
      }
      const note = slides.find(item => item.page === currentPage);
      if (!note) { root.hidden = true; return; }
      text.textContent = ja ? note.ja : note.en;
      original.textContent = note.originalText || '';
      details.hidden = !note.originalText?.trim();
      details.open = false;
      for (const [index, href] of (note.sources || []).entries()) {
        let url;
        try { url = new URL(href); } catch { continue; }
        if (!['https:', 'http:'].includes(url.protocol)) continue;
        const link = root.ownerDocument.createElement('a');
        link.href = url.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = ja ? `出典 ${index + 1} ↗` : `Source ${index + 1} ↗`;
        sources.append(link);
      }
    }
    const ready = enabled ? fetcher('lectures/w05-python-datasaurus.notes.json?v=visual-20261023', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('Notes unavailable');
        return response.json();
      }).then(payload => {
        if (!Array.isArray(payload.slides)) throw new Error('Invalid notes');
        slides = payload.slides;
        render();
      }).catch(() => { failed = true; render(); }) : Promise.resolve();
    render();
    return { ready, render, setPage(page) { currentPage = page; render(); } };
  }
  global.createSlideNotes = createSlideNotes;
})(window);
