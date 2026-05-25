// shared utilities + storage (wrapped to avoid global const collisions)
(function(){

const CURRENCIES = [
  { code: 'kip',  label: 'ກີບ',   symbol: '₭',  cls: 'kip',  full: 'ກີບລາວ (LAK)' },
  { code: 'baht', label: 'ບາດ',   symbol: '฿',  cls: 'baht', full: 'ບາດໄທ (THB)' },
  { code: 'usd',  label: 'ໂດລາ',  symbol: '$',  cls: 'usd',  full: 'ໂດລາສະຫະລັດ (USD)' },
  { code: 'yuan', label: 'ຢວນ',   symbol: '¥',  cls: 'yuan', full: 'ຢວນຈີນ (CNY)' },
];

// ============================================================
// JSONBin.io config — ໃສ່ຄ່າຂອງທ່ານທີ່ນີ້
// ສ້າງ account ຟຣີທີ່ https://jsonbin.io
// ============================================================
const JSONBIN_KEY = '$2a$10$zaWRORGGGhpfcyt7kxs5R.25GLYImdOHXpA3mfGLwlu.p3qicEmj2';   // X-Master-Key
const JSONBIN_BIN = '6a13dd956610dd3ae89f8eb2';       // Bin ID
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN}`;
// ============================================================

const DEFAULT_STORE = { donors: [], expenseItemsSmall: [], smallIncome: [], smallExpense: [], bigIncome: [], bigExpense: [] };

async function loadStore() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(JSONBIN_URL + '/latest', {
      headers: { 'X-Master-Key': JSONBIN_KEY },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      return json.record || DEFAULT_STORE;
    }
  } catch (e) {}
  return DEFAULT_STORE;
}

let saveTimer = null;
function saveStore(data) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await fetch(JSONBIN_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_KEY,
        },
        body: JSON.stringify(data),
      });
    } catch (e) {}
  }, 400);
}

function uid() { return Math.random().toString(36).slice(2, 10); }

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

window.TF = { CURRENCIES, loadStore, saveStore, uid, fmt, fmtDate, sumCurr, ymKey, ymLabel, todayISO };
})();
