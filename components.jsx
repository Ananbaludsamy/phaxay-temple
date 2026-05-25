// Shared UI components
const { useState, useEffect, useRef, useMemo } = React;
const { CURRENCIES, fmt, fmtDate, sumCurr, ymKey, ymLabel, todayISO, uid } = window.TF;

// ===== Icons (inline SVG, no emoji) =====
const Icon = {
  menu: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  close: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  home: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
  ),
  inflow: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 4v12m0 0l-5-5m5 5l5-5M5 20h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  outflow: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 20V8m0 0l-5 5m5-5l5 5M5 4h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  report: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M4 20V8m6 12V4m6 16v-8m6 8V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
  plus: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  trash: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M4 7h16M9 7V4h6v3m-7 0v13a1 1 0 001 1h8a1 1 0 001-1V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  temple: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 3l9 5v2H3V8l9-5zm-7 7v9h14v-9M9 19v-5h6v5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/></svg>
  ),
  vault: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="14" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M7 9v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
  ),
  edit: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  excel: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M8 13l2.5 4M13.5 13L11 17M8 17l2.5-4M13.5 17L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  search: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
};

// ===== Currency strip =====
function CurrencyStrip({ totals, subLabel }) {
  return (
    <div className="cur-strip">
      {CURRENCIES.map(c => (
        <div key={c.code} className={`cur-card ${c.cls}`}>
          <div className="label">
            <span className="symbol">{c.symbol}</span>
            <span>{c.label}</span>
          </div>
          <div className="amount">{fmt(totals[c.code])}</div>
          <div className="sub">{subLabel || c.full}</div>
        </div>
      ))}
    </div>
  );
}

// ===== Formatted currency input (live comma formatting while typing) =====
function CurrencyInput({ value, onChange }) {
  const toDisplay = (v) => {
    const s = String(v || '').replace(/[^\d.]/g, '');
    if (!s) return '';
    const [int, dec] = s.split('.');
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return dec !== undefined ? `${grouped}.${dec}` : grouped;
  };

  const handleChange = (e) => {
    const el = e.target;
    const cursor = el.selectionStart;
    const rawInput = el.value;

    // How many commas are left of the cursor in what user just typed
    const commasBefore = (rawInput.slice(0, cursor).match(/,/g) || []).length;
    const digitPos = cursor - commasBefore;

    // Strip everything non-numeric (commas, stray chars), keep one dot
    const stripped = rawInput.replace(/,/g, '').replace(/[^\d.]/g, '');
    const dotIdx = stripped.indexOf('.');
    const sanitized = dotIdx === -1
      ? stripped
      : stripped.slice(0, dotIdx + 1) + stripped.slice(dotIdx + 1).replace(/\./g, '');

    const formatted = toDisplay(sanitized);

    // Find cursor position in the new formatted string
    let newCursor = formatted.length;
    let digits = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (digits === digitPos) { newCursor = i; break; }
      if (formatted[i] !== ',') digits++;
    }

    onChange(sanitized);

    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      if (el === document.activeElement) {
        el.setSelectionRange(newCursor, newCursor);
      }
    });
  };

  return (
    <input
      className="control"
      type="text"
      inputMode="decimal"
      placeholder="0"
      value={toDisplay(value)}
      onChange={handleChange}
    />
  );
}

// ===== Amount field (4 currencies) =====
function AmountFields({ values, onChange }) {
  return (
    <div className="row cur4">
      {CURRENCIES.map(c => (
        <div className="field" key={c.code} style={{ marginBottom: 0 }}>
          <label>{c.label}</label>
          <div className="amt-input">
            <CurrencyInput
              value={values[c.code]}
              onChange={v => onChange({ ...values, [c.code]: v })}
            />
            <span className="ccy">{c.symbol}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== Empty state =====
function Empty({ text = 'ຍັງບໍ່ມີລາຍການ' }) {
  return (
    <div className="empty">
      <span className="glyph">◇</span>
      {text}
    </div>
  );
}

// ===== Toast =====
function useToast() {
  const [t, setT] = useState(null);
  useEffect(() => {
    if (!t) return;
    const id = setTimeout(() => setT(null), 1800);
    return () => clearTimeout(id);
  }, [t]);
  const node = t ? <div className="toast">{t}</div> : null;
  return [node, setT];
}

// ===== Pagination =====
const PER_PAGE = 10;

function Pager({ total, page, onPage }) {
  const pages = Math.ceil(total / PER_PAGE);
  if (pages <= 1) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderTop: '1px solid var(--line)',
      background: 'var(--bg-soft)', fontSize: 13,
    }}>
      <button className="btn ghost sm" disabled={page === 1}
        style={{ opacity: page === 1 ? 0.35 : 1 }}
        onClick={() => onPage(page - 1)}>‹ ກ່ອນ</button>
      <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>
        ໜ້າ {page} / {pages}
        <span style={{ marginLeft: 8, fontWeight: 400 }}>({total} ລາຍການ)</span>
      </span>
      <button className="btn ghost sm" disabled={page === pages}
        style={{ opacity: page === pages ? 0.35 : 1 }}
        onClick={() => onPage(page + 1)}>ຖັດໄປ ›</button>
    </div>
  );
}

// ===== Excel export =====
function exportXLSX(filename, sheets) {
  const XLSX = window.XLSX;
  if (!XLSX) { alert('ໂຫຼດ SheetJS ບໍ່ສຳເລັດ — ກວດສອບການເຊື່ອມຕໍ່ອິນເຕີເນັດ'); return; }
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, headers, rows, totalsRow }) => {
    const data = [headers, ...rows];
    if (totalsRow) data.push(totalsRow);
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(String(h).length + 6, 14) }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, filename);
}

Object.assign(window, { Icon, CurrencyStrip, CurrencyInput, AmountFields, Empty, useToast, Pager, PER_PAGE, exportXLSX });
