const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

test('the public feed uses the latest student/week response and excludes private fields', () => {
  const headers = ['タイムスタンプ', 'メールアドレス', '学籍番号', '氏名', '週・チャレンジ', '作品タイトル',
    '使用したツール', '作品のリンク', '作品のスクリーンショット（必須・画像1枚）',
    'この可視化から何が見えますか？', 'この作品を授業サイトのギャラリーに掲載してもよいですか？'];
  const row = (date, email, id, week, title, consent) =>
    [new Date(date), email, id, 'Student', `第${week}週｜課題`, title, 'Python',
      'https://example.com/work', 'https://drive.google.com/open?id=imageFile', 'A pattern', consent];
  const values = [headers,
    row('2026-09-25T01:00:00Z', 'private@example.com', 'private-id', 1, 'Older', 'はい（作品を掲載してよい）'),
    row('2026-09-26T01:00:00Z', 'private@example.com', 'private-id', 1, 'Withdrawn', 'いいえ（非公開にする）'),
    row('2026-09-26T02:00:00Z', 'other@example.com', 'other-id', 1, 'Public', 'はい（作品を掲載してよい）'),
    row('2026-10-02T01:00:00Z', 'private@example.com', 'private-id', 2, 'Week two', 'はい（作品を掲載してよい）')];
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
  assert.doesNotMatch(response.text, /private-id|other-id|private@example.com|other@example.com|Withdrawn|Older/);
  const items = JSON.parse(response.text.slice('courseGalleryReceive('.length, -2)).items;
  assert.equal(items.length, 2);
  assert.deepEqual(items.map(item => item.title).sort(), ['Public', 'Week two']);
  assert.ok(items.every(item => Number.isInteger(item.imageIndex)));
  assert.ok(items.every(item => !Object.hasOwn(item, 'imageData')));
  const imageResponse = context.doGet({ parameter: { image: '2', callback: 'courseGalleryImageReceive_2' } });
  const image = JSON.parse(imageResponse.text.slice('courseGalleryImageReceive_2('.length, -2));
  assert.match(image.data, /^data:image\/png;base64,/);
  const privateImage = context.doGet({ parameter: { image: '1', callback: 'courseGalleryImageReceive_1' } });
  assert.equal(JSON.parse(privateImage.text.slice('courseGalleryImageReceive_1('.length, -2)).data, '');
});
