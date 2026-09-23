/* Bound to the private Google Form response spreadsheet.
 * Deploy as a web app: execute as the owner; access: anyone.
 * Only the fields explicitly assembled below leave this script.
 */
const RESPONSE_SHEET = 'フォームの回答 1';
const CALLBACK = 'courseGalleryReceive';

function doGet(request) {
  const rows = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(RESPONSE_SHEET)
    .getDataRange()
    .getValues();
  const headers = rows.shift().map(value => String(value).trim());
  const column = name => headers.indexOf(name);
  const get = (row, name) => String(row[column(name)] || '').trim();
  const imageColumn = headers.find(name => name.startsWith('作品のスクリーンショット（必須'))
    || headers.find(name => name.startsWith('スクリーンショット／画像リンク'));
  const latest = new Map();

  rows.forEach((row, index) => {
    const studentId = get(row, '学籍番号');
    const challenge = get(row, '週・チャレンジ');
    const week = Number(challenge.match(/第\s*(\d+)\s*週/)?.[1]);
    if (!studentId || !week || week < 1 || week > 14) return;
    const rawDate = row[column('タイムスタンプ')];
    const time = rawDate instanceof Date ? rawDate.getTime() : new Date(rawDate).getTime();
    const key = JSON.stringify([studentId, week]);
    const previous = latest.get(key);
    if (!previous || time > previous.time || (time === previous.time && index > previous.index)) {
      latest.set(key, { row, index, time, week, challenge });
    }
  });

  const latestRows = [...latest.values()];

  if (request?.parameter?.image !== undefined) {
    const index = Number(request.parameter.image);
    const item = latestRows.find(row => row.index === index);
    const data = item && imageColumn ? imageDataFor(get(item.row, imageColumn)) : '';
    const callback = /^courseGalleryImageReceive_\d+$/.test(request.parameter.callback || '')
      ? request.parameter.callback : null;
    return output({ index, data }, callback);
  }

  const items = latestRows.map(item => {
    const row = item.row;
    return {
      week: item.week,
      challenge: item.challenge,
      submittedAt: Utilities.formatDate(new Date(item.time), 'Asia/Tokyo', 'yyyy-MM-dd'),
      studentName: get(row, '氏名'),
      title: get(row, '作品タイトル'),
      tools: get(row, '使用したツール'),
      projectUrl: get(row, '作品のリンク'),
      description: get(row, 'この可視化から何が見えますか？'),
      imageIndex: item.index
    };
  }).sort((a, b) => b.week - a.week || a.studentName.localeCompare(b.studentName, 'ja'));

  const callback = request?.parameter?.callback === CALLBACK ? CALLBACK : null;
  return output({ items }, callback);
}

function output(value, callback) {
  const payload = JSON.stringify(value);
  return ContentService.createTextOutput(callback ? `${callback}(${payload});` : payload)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function imageDataFor(url) {
  const fileId = String(url).match(/[?&]id=([\w-]+)/)?.[1]
    || String(url).match(/\/d\/([\w-]+)/)?.[1];
  if (!fileId) return '';
  try {
    const file = DriveApp.getFileById(fileId);
    const image = file.getThumbnail() || file.getBlob();
    const bytes = image.getBytes();
    if (!image.getContentType().startsWith('image/') || bytes.length > 10000000) return '';
    return `data:${image.getContentType()};base64,${Utilities.base64Encode(bytes)}`;
  } catch (error) {
    console.warn(`Could not make screenshot preview: ${error.message}`);
    return '';
  }
}
