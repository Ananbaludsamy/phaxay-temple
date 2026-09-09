/**
 * Hardened Apps Script for ວັດພະໄຊ vault app.
 *
 * Storage layout (Sheet1):
 *   Column A (A1, A2, ...) : transaction JSON, split into chunks under the
 *                            50,000-char per-cell limit (A1-only storage fails
 *                            silently once the DB grows past it)
 *   B1                     : donors JSON array
 *   C1                     : expenseItemsSmall JSON array
 *
 * Compatibility: doGet reassembles column A, so it also reads the OLD format
 * where the whole DB lived in A1 — no data migration needed.
 *
 * HOW TO DEPLOY (keeps the existing /exec URL):
 *   1. script.google.com → open this project → paste this file over Code.gs
 *   2. Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy
 *      (Do NOT create a new deployment — that would change the URL and the
 *      app would keep calling the old script.)
 */

var CHUNK_SIZE = 45000;          // safely under the 50K per-cell limit
var TXN_KEYS = ['smallIncome', 'smallExpense', 'bigIncome', 'bigExpense'];

function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
}

/** Read + parse column A chunks, tolerating the old single-cell format. */
function readTxns_(sheet) {
  var values = sheet.getRange('A1:A' + Math.max(sheet.getLastRow(), 1)).getValues();
  var parts = [];
  for (var i = 0; i < values.length; i++) {
    var v = values[i][0];
    if (v === '' || v === null) break;
    parts.push(String(v));
  }
  if (parts.length === 0) return {};
  return JSON.parse(parts.join(''));
}

/** Validate the client payload: only known keys, only arrays of objects. */
function sanitizeTxns_(parsed) {
  var out = {};
  for (var i = 0; i < TXN_KEYS.length; i++) {
    var key = TXN_KEYS[i];
    var arr = parsed ? parsed[key] : null;
    if (!Array.isArray(arr)) arr = [];
    // keep only well-formed records with an id (guards against a bad client write)
    arr = arr.filter(function (r) { return r && typeof r === 'object' && r.id; });
    out[key] = arr;
  }
  return out;
}

function doGet() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = getSheet_();
    var txns = sanitizeTxns_(readTxns_(sheet));
    var donors = sheet.getRange('B1').getValue();
    var expItems = sheet.getRange('C1').getValue();
    var result = txns;
    result.donors = donors ? JSON.parse(donors) : [];
    result.expenseItemsSmall = expItems ? JSON.parse(expItems) : [];
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error('empty body');
    var parsed = JSON.parse(e.postData.contents);

    lock.waitLock(30000); // serialize concurrent saves from multiple devices

    var sheet = getSheet_();
    var txns = sanitizeTxns_(parsed);

    var json = JSON.stringify(txns);
    var chunks = [];
    for (var i = 0; i < json.length; i += CHUNK_SIZE) {
      chunks.push([json.substring(i, i + CHUNK_SIZE)]);
    }
    // wipe any leftover rows from a previous longer write, then store chunks
    sheet.getRange('A1:A1000').clearContent();
    sheet.getRange(1, 1, chunks.length, 1).setValues(chunks);

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        counts: {
          smallIncome: txns.smallIncome.length,
          smallExpense: txns.smallExpense.length,
          bigIncome: txns.bigIncome.length,
          bigExpense: txns.bigExpense.length
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}
