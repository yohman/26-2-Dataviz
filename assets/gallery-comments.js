(() => {
  const endpoint = 'https://dataviz-gallery-likes.ykawano.workers.dev/comments';
  const label = (en, ja) => window.courseLanguage === 'en' ? en : ja;
  const make = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  async function request(method = 'GET', body, query = '') {
    const identity = localStorage.getItem('dataviz-heart-browser') || crypto.randomUUID();
    localStorage.setItem('dataviz-heart-browser', identity);
    const response = await fetch(endpoint + query, {
      method, signal: AbortSignal.timeout(7000),
      headers: { 'X-Browser-ID': identity, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!response.ok) throw new Error(response.status === 429 ? label('Please wait a minute and retry.', '1分ほど待って再試行してください。') : label('Unable to connect. Please retry.', '接続できません。再試行してください。'));
    return response.json();
  }
  let countsPromise;
  const counts = () => countsPromise ||= request().catch(error => { countsPromise = null; throw error; });
  function mountWork(details, id, inline = false) {
    if (details.querySelector('.gallery-comments')) return;
    const section = make('section', '', 'gallery-comments'); section.id = inline ? `card-comments-${id}` : 'comments';
    section.append(make('h2', label('Comments', 'コメント')));
    const note = make('p', label('Comments are public immediately. Use a display name, and give thoughtful feedback.', 'コメントはすぐに公開されます。表示名を使い、作品について丁寧に感想や意見を伝えてください。'), 'gallery-comments-note');
    const list = make('div', '', 'gallery-comment-list');
    const status = make('p'); status.setAttribute('role', 'status');
    const more = make('button', label('Load more', '続きを表示')); more.type = 'button'; more.hidden = true;
    let cursor = null;
    async function load(append = false) {
      status.textContent = label('Loading comments…', 'コメントを読み込んでいます…');
      more.disabled = true;
      try {
        const data = await request('GET', null, `?submission=${encodeURIComponent(id)}${append && cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
        if (!append) list.replaceChildren();
        data.items.forEach(comment => {
          const article = make('article', '', 'gallery-comment');
          const header = make('div', '', 'gallery-comment-heading');
          header.append(make('strong', comment.author));
          const time = make('time', new Date(comment.createdAt.replace(' ', 'T') + 'Z').toLocaleString(window.courseLanguage === 'en' ? 'en-US' : 'ja-JP'));
          header.append(time);
          article.append(header, make('p', comment.body));
          if (comment.mine) {
            const remove = make('button', label('Delete my comment', '自分のコメントを削除')); remove.type = 'button';
            remove.addEventListener('click', async () => {
              if (!window.confirm(label('Delete this comment?', 'このコメントを削除しますか？'))) return;
              remove.disabled = true;
              try { await request('DELETE', { id: comment.id }); article.remove(); countsPromise = null; }
              catch (error) { status.textContent = error.message; }
              finally { remove.disabled = false; }
            });
            article.append(remove);
          }
          list.append(article);
        });
        cursor = data.nextCursor; more.hidden = !cursor;
        status.textContent = list.children.length ? '' : label('Be the first to comment.', '最初のコメントをどうぞ。');
      } catch (error) {
        status.replaceChildren(make('span', error.message + ' '));
        const retry = make('button', label('Retry', '再試行')); retry.type = 'button';
        retry.addEventListener('click', () => load(append)); status.append(retry);
      } finally { more.disabled = false; }
    }
    more.addEventListener('click', () => load(true));
    const form = make('form', '', 'gallery-comment-form');
    const nameLabel = make('label', label('Display name', '表示名'));
    const name = make('input'); name.name = 'name'; name.required = true; name.maxLength = 60; name.autocomplete = 'nickname';
    try { name.value = localStorage.getItem('dataviz-comment-name') || ''; } catch {}
    nameLabel.append(name);
    const bodyLabel = make('label', label('Your comment', 'コメント'));
    const body = make('textarea'); body.name = 'comment'; body.required = true; body.maxLength = 1500; body.rows = 4;
    bodyLabel.append(body);
    const submit = make('button', label('Post comment', 'コメントを投稿')); submit.type = 'submit';
    const feedback = make('p'); feedback.setAttribute('role', 'status');
    let pendingId;
    form.append(nameLabel, bodyLabel, submit, feedback);
    body.addEventListener('input', () => { pendingId = null; });
    name.addEventListener('input', () => { pendingId = null; });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!name.value.trim() || !body.value.trim()) return;
      submit.disabled = true; feedback.textContent = label('Posting…', '投稿しています…');
      pendingId ||= crypto.randomUUID();
      try {
        await request('POST', { id: pendingId, submission: id, author: name.value.trim(), body: body.value.trim() });
        try { localStorage.setItem('dataviz-comment-name', name.value.trim()); } catch {}
        body.value = ''; pendingId = null; countsPromise = null;
        feedback.textContent = label('Published.', '公開しました。'); await load();
      } catch (error) { feedback.textContent = error.message; }
      finally { submit.disabled = false; }
    });
    section.append(note, list, more, status, form); details.append(section); load();
    return section;
  }
  function mountCards() {
    document.querySelectorAll('.gallery-card:not([data-comments-mounted])').forEach(card => {
      card.dataset.commentsMounted = 'true';
      const target = card.querySelector('.gallery-card-title-link');
      if (!target) return;
      const id = new URL(target.href).searchParams.get('id');
      const link = make('a', label('Comments…', 'コメント…'), 'gallery-comment-link');
      link.href = `#card-comments-${id}`;
      link.setAttribute('aria-expanded', 'false');
      link.setAttribute('aria-controls', `card-comments-${id}`);
      link.addEventListener('click', event => {
        event.preventDefault();
        const expanded = link.getAttribute('aria-expanded') !== 'true';
        const section = card.querySelector('.gallery-comments') || mountWork(card, id, true);
        section.hidden = !expanded;
        card.classList.toggle('gallery-card--comments-open', expanded);
        link.setAttribute('aria-expanded', String(expanded));
      });
      card.querySelector('.gallery-card-footer').append(link);
      counts().then(data => {
        const count = data.items.find(item => item.id === id)?.count || 0;
        link.textContent = label(`Comments (${count})`, `コメント (${count})`);
      }).catch(() => { link.textContent = label('Comments', 'コメント'); });
    });
    const details = document.querySelector('.gallery-work-details');
    const id = new URLSearchParams(location.search).get('id');
    if (details && id) mountWork(details, id);
  }
  const start = () => {
    const root = document.querySelector('main'); if (!root) return;
    // Watching direct layout/grid replacements avoids observing comment updates.
    const observer = new MutationObserver(() => mountCards());
    observer.observe(root, { childList: true, subtree: true });
    mountCards();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
