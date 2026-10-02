/* Bound to the private Google Form response spreadsheet.
 * Deploy as a web app: execute as the owner; access: anyone.
 * Only the fields explicitly assembled below leave this script.
 */
const RESPONSE_SHEET = 'フォームの回答 1';
const CALLBACK = 'courseGalleryReceive';

function doGet(request) {
  if (request && /^(likes|like|unlike)$/.test(request.parameter.action || '')) return galleryLikesApi(request);
  const rows = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(RESPONSE_SHEET)
    .getDataRange()
    .getValues();
  const headers = rows.shift().map(value => String(value).trim());
  const column = name => headers.indexOf(name);
  const get = (row, name) => String(row[column(name)] || '').trim();
  const getAny = (row, names) => {
    for (const name of names) {
      const value = get(row, name);
      if (value) return value;
    }
    return '';
  };
  const imageColumn = headers.find(name => name.startsWith('作品のスクリーンショット 1（必須'))
    || headers.find(name => name.startsWith('作品のスクリーンショット（必須'))
    || headers.find(name => name.startsWith('スクリーンショット／画像リンク'));
  const secondImageColumn = headers.find(name => name.startsWith('作品のスクリーンショット 2（任意'));
  const consentColumn = headers.find(name => name.startsWith('この作品を授業サイトのギャラリーに掲載してもよいですか'));
  const latest = new Map();

  rows.forEach((row, index) => {
    // The current form has no gallery-publication question. Preserve any
    // historical explicit refusal while publishing the named submissions.
    if (consentColumn && /^いいえ/.test(get(row, consentColumn))) return;
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
    const slot = Number(request.parameter.slot || 1);
    const item = latestRows.find(row => row.index === index);
    const selectedColumn = slot === 2 ? secondImageColumn : slot === 1 ? imageColumn : null;
    const data = item && selectedColumn ? imageDataFor(get(item.row, selectedColumn)) : '';
    const callback = /^courseGalleryImageReceive_\d+(?:_[12])?$/.test(request.parameter.callback || '')
      ? request.parameter.callback : null;
    return output({ index, slot, data }, callback);
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
      projectUrl: getAny(row, ['課題で使用したデータ、ウェブサイト、またはドキュメントへのリンク', '作品のリンク']),
      description: getAny(row, ['作品について説明してください', 'この可視化から何が見えますか？']),
      imageIndex: item.index,
      imageCount: secondImageColumn && get(row, secondImageColumn) ? 2 : 1
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
