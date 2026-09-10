// shared utilities + storage (wrapped to avoid global const collisions)
(function(){

const CURRENCIES = [
  { code: 'kip',  label: 'ກີບ',   symbol: '₭',  cls: 'kip',  full: 'ກີບລາວ (LAK)' },
  { code: 'baht', label: 'ບາດ',   symbol: '฿',  cls: 'baht', full: 'ບາດໄທ (THB)' },
  { code: 'usd',  label: 'ໂດລາ',  symbol: '$',  cls: 'usd',  full: 'ໂດລາສະຫະລັດ (USD)' },
  { code: 'yuan', label: 'ຢວນ',   symbol: '¥',  cls: 'yuan', full: 'ຢວນຈີນ (CNY)' },
];

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzRGFYAU9pi5s-0R8GuYpgN7DtqoE-gxQT8Ta54iZ-gx5G3uu2TSWEltsliHbb62bOn/exec';

const DEFAULT_STORE = { donors: [], expenseItemsSmall: [], smallIncome: [], smallExpense: [], bigIncome: [], bigExpense: [] };
const CACHE_KEY = 'tf_store_v1';
const DIRTY_TS_KEY = 'tf_dirty_ts';
const DIRTY_GRACE_MS = 30000; // 30s after a save: don't let a background GET overwrite it
const TXN_KEYS = ['smallIncome', 'smallExpense', 'bigIncome', 'bigExpense'];
const LIST_KEYS = ['donors', 'expenseItemsSmall'];

// ---- sync status reporting (app.jsx shows toasts) ----
let onSyncError = null; // fn(message)
let onSyncInfo  = null; // fn(message)
let lastSaveFailed = false;

function setSyncHandlers({ error, info }) {
  onSyncError = error || null;
  onSyncInfo = info || null;
}

// ---- helpers ----

function safeStore(data) {
  return { ...DEFAULT_STORE, ...data };
}

function parseStoreJSON(text) {
  let json;
  try { json = JSON.parse(text); } catch (e) { throw new Error('not JSON'); }
  if (!json || typeof json !== 'object' || Array.isArray(json)) throw new Error('bad payload shape');
  if (json.error) throw new Error('script error');
  return safeStore(json);
}

async function gasGetJSON() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(SCRIPT_URL, { signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    // Google sometimes returns an HTML page (login/error) with HTTP 200 — reject it
    if (!text || (text.charAt(0) !== '{' && text.charAt(0) !== '[')) throw new Error('non-JSON response');
    return parseStoreJSON(text);
  } finally {
    clearTimeout(t);
  }
}

function uid() { return Math.random().toString(36).slice(2, 10); }

// Union of local + remote by record id: nothing that exists on either side can
// be lost. For the same id, local wins (edits happen locally first). Note: a
// record deleted on this device can reappear if another device still has it —
// that's the safe trade-off with the sheet's full-replace save semantics.
function mergeStore(local, remote) {
  const out = { ...local };
  for (const key of TXN_KEYS) {
    const map = new Map();
    for (const r of (remote[key] || [])) map.set(r.id || uid(), r);
    for (const r of (local[key]  || [])) map.set(r.id || uid(), r);
    out[key] = Array.from(map.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
  for (const key of LIST_KEYS) {
    out[key] = [...(local[key] || []), ...(remote[key] || []).filter(x => !(local[key] || []).includes(x))];
  }
  return out;
}

// ---- load ----

function loadStore(onUpdate) {
  const raw = localStorage.getItem(CACHE_KEY);
  let cached = null;
  if (raw) {
    try { cached = safeStore(JSON.parse(raw)); } catch (e) { cached = null; }
  }

  const syncPromise = gasGetJSON()
    .then(gas => {
      const dirtyTs = Number(localStorage.getItem(DIRTY_TS_KEY) || 0);
      if (Date.now() - dirtyTs < DIRTY_GRACE_MS) return gas; // just saved; don't clobber
      const fresh = cached ? mergeStore(cached, gas) : safeStore(gas);
      localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
      storeDirty = false;
      onUpdate && onUpdate(fresh);
      onSyncInfo && onSyncInfo('ຊິ້ງຂໍ້ມູນຈາກ Google Sheets ສຳເລັດ');
      return fresh;
    })
    .catch(err => {
      const msg = err && err.message ? err.message : 'network';
      if (cached) {
        onSyncError && onSyncError('ດຶງຂໍ້ມູນໃໝ່ບໍ່ສຳເລັດ — ກຳລັງສະແດງຂໍ້ມູນທີ່ເກັບໄວ້ໃນເຄື່ອງນີ້ (' + msg + ')');
      } else {
        onSyncError && onSyncError('ບໍ່ສາມາດໂຫຼດຂໍ້ມູນຈາກ Google Sheets — ກວດສອບອິນເຕີເນັດ (' + msg + ')');
      }
      throw err;
    });

  if (cached) {
    // Instant render from cache; the sync above updates via onUpdate when it lands
    syncPromise.catch(() => {}); // rejection already reported via onSyncError
    return Promise.resolve(cached);
  }

  return syncPromise.catch(() => safeStore(DEFAULT_STORE));
}

// ---- save ----

let saveTimer = null;
let storeDirty = false;
let currentData = safeStore(DEFAULT_STORE);
let saveInFlight = false;

function saveStore(data) {
  currentData = safeStore(data);
  storeDirty = true;
  localStorage.setItem(CACHE_KEY, JSON.stringify(currentData));
  localStorage.setItem(DIRTY_TS_KEY, String(Date.now()));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, 400);
}

async function doSave() {
  if (saveInFlight) { saveTimer = setTimeout(doSave, 600); return; }
  saveInFlight = true;
  const snapshot = currentData;
  try {
    // Send the local snapshot directly — it's the source of truth for this
    // device. Do NOT merge with remote first: that would re-introduce records
    // that were deleted on this device (mergeStore is a union by id).
    //
    // The sheet's doPost does its own sanitize (dropping records without ids),
    // so the full-replace semantics are safe: whatever we send is what lands.
    const body = {
      smallIncome: snapshot.smallIncome,
      smallExpense: snapshot.smallExpense,
      bigIncome: snapshot.bigIncome,
      bigExpense: snapshot.bigExpense,
    };

    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
    });

    // Verify: re-read the sheet and confirm it matches what we sent.
    // For deletions the count will be <= payload length, so check equality
    // of record ids rather than a minimum-length heuristic.
    let verified = false;
    const wanted = new Set();
    for (const k of TXN_KEYS) {
      for (const r of (snapshot[k] || [])) wanted.add(r.id);
    }
    for (let attempt = 0; attempt < 4 && !verified; attempt++) {
      await new Promise(r => setTimeout(r, attempt === 0 ? 1500 : 2500));
      try {
        const saved = await gasGetJSON();
        const got = new Set();
        for (const k of TXN_KEYS) {
          for (const r of (saved[k] || [])) got.add(r.id);
        }
        // sheet must contain every id we sent (nothing dropped) —
        // and must not contain ids we deleted (nothing resurrected)
        verified = [...wanted].every(id => got.has(id)) && [...got].every(id => wanted.has(id));
      } catch (e2) { /* verify read failed — try again */ }
    }
    if (!verified) throw new Error('sheet did not accept the save (verification failed)');

    if (currentData === snapshot) {
      storeDirty = false;
      localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
      if (lastSaveFailed) onSyncInfo && onSyncInfo('ບັນທຶກສຳເລັດແລ້ວ');
    }
    lastSaveFailed = false;
  } catch (e) {
    lastSaveFailed = true;
    console.error('[saveStore] failed:', e);
    // storeDirty stays true — the next save retries with fresh data
    onSyncError && onSyncError('ບັນທຶກບໍ່ສຳເລັດ — ຂໍ້ມູນຍັງຢູ່ໃນເຄື່ອງນີ້ ຈະລອງອີກຄັ້ງເມື່ອບັນທຶກຕໍ່ (' + (e && e.message ? e.message : 'network') + ')');
  } finally {
    saveInFlight = false;
  }
}

// ---- formatting utilities ----

function fmt(n) {
  if (!n) return '0';
  const v = Number(n) || 0;
  return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  const months = ['ມ.ກ.','ກ.ພ.','ມ.ນ.','ເມ.ສ.','ພ.ພ.','ມິ.ຖ.','ກ.ລ.','ສ.ຫ.','ກ.ຍ.','ຕ.ລ.','ພ.ຈ.','ທ.ວ.'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
function ymKey(iso) { return iso ? iso.slice(0, 7) : ''; }
function ymLabel(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  const months = ['ມ.ກ.','ກ.ພ.','ມ.ນ.','ເມ.ສ.','ພ.ພ.','ມິ.ຖ.','ກ.ລ.','ສ.ຫ.','ກ.ຍ.','ຕ.ລ.','ພ.ຈ.','ທ.ວ.'];
  return `${months[m-1]} ${y}`;
}
function sumCurr(arr) {
  const total = { kip: 0, baht: 0, usd: 0, yuan: 0 };
  for (const r of arr) {
    total.kip  += Number(r.kip)  || 0;
    total.baht += Number(r.baht) || 0;
    total.usd  += Number(r.usd)  || 0;
    total.yuan += Number(r.yuan) || 0;
  }
  return total;
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

window.TF = { CURRENCIES, loadStore, saveStore, setSyncHandlers, uid, fmt, fmtDate, sumCurr, ymKey, ymLabel, todayISO };
})();
