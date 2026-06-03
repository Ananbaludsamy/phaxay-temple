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

let saveTimer = null;
let storeDirty = false;

function gasFetch(signal) {
  return fetch(SCRIPT_URL, { signal });
}

function safeStore(data) {
  return { ...DEFAULT_STORE, ...data };
}

async function loadStore(onUpdate) {
  const raw = localStorage.getItem(CACHE_KEY);
  if (raw) {
    try {
      const cached = safeStore(JSON.parse(raw));
      storeDirty = false;
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);
      gasFetch(ctrl.signal)
        .then(async res => {
          clearTimeout(t);
          if (!res.ok || storeDirty) return;
          const gas = await res.json();
          const fresh = {
            ...safeStore(gas),
            // Keep cached lists if GAS doesn't provide them (pre-redeploy or old format)
            donors: (gas.donors && gas.donors.length) ? gas.donors : cached.donors,
            expenseItemsSmall: (gas.expenseItemsSmall && gas.expenseItemsSmall.length) ? gas.expenseItemsSmall : cached.expenseItemsSmall,
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
          onUpdate && onUpdate(fresh);
        })
        .catch(() => { clearTimeout(t); });
      return cached;
    } catch (e) {}
  }

  // No cache — must wait for GAS
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await gasFetch(ctrl.signal);
    clearTimeout(t);
    if (res.ok) {
      const data = safeStore(await res.json());
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (e) {}
  return DEFAULT_STORE;
}

let onSaveError = null;

function onSaveErrorSet(fn) { onSaveError = fn; }

function saveStore(data) {
  storeDirty = true;
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      // Only sync transaction arrays — donors/expenseItemsSmall are managed via db.json
      const txns = {
        smallIncome: data.smallIncome,
        smallExpense: data.smallExpense,
        bigIncome: data.bigIncome,
        bigExpense: data.bigExpense,
      };
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(txns),
      });
    } catch (e) {
      console.error('[saveStore] failed:', e);
      onSaveError && onSaveError(e);
    }
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

window.TF = { CURRENCIES, loadStore, saveStore, onSaveErrorSet, uid, fmt, fmtDate, sumCurr, ymKey, ymLabel, todayISO };
})();
