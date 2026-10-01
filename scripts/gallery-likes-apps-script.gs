/* Add to the spreadsheet-bound Data Visualization Gallery Feed Apps Script.
 * In GalleryFeed.gs, put this at the top of doGet(request):
 * if (request && /^(likes|like)$/.test(request.parameter.action || '')) return galleryLikesApi(request);
 * Redeploy the existing web app after saving. The private sheet stores only
 * work keys and hashes of browser IDs, never names or email addresses.
 */
const GALLERY_LIKES_SHEET = 'GalleryLikes';

function galleryLikesApi(request) {
  const params = request.parameter || {};
  const callback = /^courseGalleryLikesReceive_\d+$/.test(params.callback || '') ? params.callback : null;
  const visitor = String(params.visitor || '');
  const item = String(params.item || '');
  const validVisitor = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(visitor);
  const validItem = /^\d{1,2}-\d{1,6}$/.test(item);
  if (!validVisitor || (params.action === 'like' && !validItem))
    return output({ error: 'Invalid like request' }, callback);

  const digest = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, visitor));
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = book.getSheetByName(GALLERY_LIKES_SHEET);
    if (!sheet) {
      sheet = book.insertSheet(GALLERY_LIKES_SHEET);
      sheet.appendRow(['Work key', 'Browser hash', 'Liked at']);
      sheet.hideSheet();
    }
    const rows = sheet.getDataRange().getValues().slice(1);
    if (params.action === 'like' && !rows.some(row => row[0] === item && row[1] === digest)) {
      sheet.appendRow([item, digest, new Date()]);
      rows.push([item, digest]);
    }
    const counts = {};
    const mine = [];
    rows.forEach(row => {
      const key = String(row[0] || '');
      if (!/^\d{1,2}-\d{1,6}$/.test(key)) return;
      counts[key] = (counts[key] || 0) + 1;
      if (row[1] === digest) mine.push(key);
    });
    return output({ counts, mine }, callback);
  } finally {
    lock.releaseLock();
  }
}
