const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

test('the feed publishes one latest response per student and week without IDs or emails', () => {
  const headers = ['タイムスタンプ', 'メールアドレス', '学籍番号', '氏名', '週・チャレンジ', '作品タイトル',
    '使用したツール', '課題で使用したデータ、ウェブサイト、またはドキュメントへのリンク', '作品のスクリーンショット 1（必須）',
    '作品について説明してください', '作品のスクリーンショット 2（任意）',
    'この作品を授業サイトのギャラリーに掲載してもよいですか？'];
  const row = (date, email, id, week, title, image = 'https://drive.google.com/open?id=imageFile', consent = 'はい、掲載してもよいです') =>
    [new Date(date), email, id, 'Student', `第${week}週｜課題`, title, 'Python',
      'https://example.com/work', image, 'A pattern', '', consent];
  const values = [headers,
    row('2026-09-25T01:00:00Z', 'first@example.com', 'first-id', 1, 'Older'),
    row('2026-09-26T01:00:00Z', 'first@example.com', 'first-id', 1, 'Revision'),
    row('2026-09-26T01:00:00Z', 'first@example.com', 'first-id', 1, 'Latest revision'),
    row('2026-09-26T02:00:00Z', 'second@example.com', 'second-id', 1, 'Another student'),
    row('2026-10-02T01:00:00Z', 'first@example.com', 'first-id', 2, 'Week two'),
    row('2026-10-02T02:00:00Z', 'third@example.com', 'third-id', 1, 'No screenshot yet', ''),
    row('2026-10-02T03:00:00Z', 'private@example.com', 'private-id', 1, 'Private work', undefined, 'いいえ')];
  const context = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => ({ getDataRange: () => ({ getValues: () => values.map(row => [...row]) }) }) }) },
    DriveApp: { getFileById: () => ({ getThumbnail: () => ({ getContentType: () => 'image/png', getBytes: () => [1, 2, 3] }) }) },
    Utilities: { formatDate: date => date.toISOString().slice(0, 10), base64Encode: () => 'AQID' },
    ContentService: {
      MimeType: { JAVASCRIPT: 'js', JSON: 'json' },
      createTextOutput: text => ({ setMimeType: mimeType => ({ text, mimeType }) })
    },
    console
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('google-apps-script/gallery-feed.gs', 'utf8'), context);
  const response = context.doGet({ parameter: { callback: 'courseGalleryReceive' } });
  assert.equal(response.mimeType, 'js');
  assert.match(response.text, /^courseGalleryReceive\(/);
  assert.doesNotMatch(response.text, /-id|@example\.com|Older|"Revision"|Private work/);
  const items = JSON.parse(response.text.slice('courseGalleryReceive('.length, -2)).items;
  assert.equal(items.length, 4);
  assert.deepEqual(items.map(item => item.title).sort(), ['Another student', 'Latest revision', 'No screenshot yet', 'Week two']);
  assert.ok(items.every(item => Number.isInteger(item.imageIndex)));
  assert.ok(items.every(item => !Object.hasOwn(item, 'imageData')));
  const imageResponse = context.doGet({ parameter: { image: '2', callback: 'courseGalleryImageReceive_2' } });
  const image = JSON.parse(imageResponse.text.slice('courseGalleryImageReceive_2('.length, -2));
  assert.match(image.data, /^data:image\/png;base64,/);
  const oldImage = context.doGet({ parameter: { image: '0', callback: 'courseGalleryImageReceive_0' } });
  assert.equal(JSON.parse(oldImage.text.slice('courseGalleryImageReceive_0('.length, -2)).data, '');
  const missingImage = context.doGet({ parameter: { image: '5', callback: 'courseGalleryImageReceive_5' } });
  assert.equal(JSON.parse(missingImage.text.slice('courseGalleryImageReceive_5('.length, -2)).data, '');
});
