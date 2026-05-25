// Dashboard (ໜ້າຫຼັກ)
const { useMemo: useMemoDB } = React;

function Dashboard({ store, go }) {
  const smallIn  = sumCurr(store.smallIncome);
  const smallOut = sumCurr(store.smallExpense);
  const bigIn    = sumCurr(store.bigIncome);
  const bigOut   = sumCurr(store.bigExpense);
  const allIn    = sumCurr([...store.smallIncome, ...store.bigIncome]);
  const allOut   = sumCurr([...store.smallExpense, ...store.bigExpense]);

  const months = useMemoDB(() => {
    const map = {};
    const collect = (arr, key) => arr.forEach(r => {
      const ym = ymKey(r.date);
      if (!ym) return;
      if (!map[ym]) map[ym] = { in: { kip:0,baht:0,usd:0,yuan:0 }, out: { kip:0,baht:0,usd:0,yuan:0 } };
      CURRENCIES.forEach(c => { map[ym][key][c.code] += Number(r[c.code]) || 0; });
    });
    collect(store.smallIncome,  'in');
    collect(store.bigIncome,    'in');
    collect(store.smallExpense, 'out');
    collect(store.bigExpense,   'out');
    return Object.entries(map)
      .map(([ym, v]) => ({ ym, ...v }))
      .sort((a, b) => b.ym.localeCompare(a.ym))
      .slice(0, 6);
  }, [store]);

  const curYm = todayISO().slice(0, 7);
  const totalTx = store.smallIncome.length + store.smallExpense.length + store.bigIncome.length + store.bigExpense.length;

  return (
    <div className="page db-page">

      {/* ── Top greeting ── */}
      <div className="db-greeting">
        <div>
          <div className="db-g-sub">ວັດພະໄຊ · ລະບົບຄັງ</div>
          <div className="db-g-title">ສະຫຼຸບພາບລວມ</div>
        </div>
        <div className="db-g-date">
          <div className="db-g-day">{new Date().getDate()}</div>
          <div className="db-g-mon">{['ມ.ກ.','ກ.ພ.','ມ.ນ.','ເມ.ສ.','ພ.ພ.','ມິ.ຖ.','ກ.ລ.','ສ.ຫ.','ກ.ຍ.','ຕ.ລ.','ພ.ຈ.','ທ.ວ.'][new Date().getMonth()]}</div>
        </div>
      </div>

      {/* ── Balance hero ── */}
      <div className="db-hero">
        <div className="db-hero-top">
          <div>
            <div className="db-hero-eyebrow">ຍອດຄົງເຫຼືອ · ທຸກຄັງ</div>
            <div className="db-hero-tx">{totalTx} ທຸລະກຳທັງໝົດ</div>
          </div>
          <button className="db-hero-btn" onClick={() => go('report')}>
            <Icon.report /> ລາຍງານ
          </button>
        </div>
        <div className="db-hero-grid">
          {CURRENCIES.map(c => {
            const net = allIn[c.code] - allOut[c.code];
            return (
              <div className="db-hero-cell" key={c.code}>
                <div className="db-hero-sym">{c.symbol} {c.label}</div>
                <div className={`db-hero-amt ${net >= 0 ? 'pos' : 'neg'}`}>
                  {fmt(Math.abs(net))}
                </div>
                <div className="db-hero-tag">{net >= 0 ? '▲ ເກີນດຸນ' : '▼ ຂາດດຸນ'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="db-actions">
        {[
          { key:'small-in',  icon:'inflow',  label:'ລາຍຮັບ',  sub:'ຄັງນ້ອຍ',  color:'green', cnt: store.smallIncome.length  },
          { key:'small-out', icon:'outflow', label:'ລາຍຈ່າຍ', sub:'ຄັງນ້ອຍ',  color:'rose',  cnt: store.smallExpense.length },
          { key:'big-in',    icon:'inflow',  label:'ລາຍຮັບ',  sub:'ຄັງໃຫຍ່', color:'green', cnt: store.bigIncome.length    },
          { key:'big-out',   icon:'outflow', label:'ລາຍຈ່າຍ', sub:'ຄັງໃຫຍ່', color:'rose',  cnt: store.bigExpense.length   },
        ].map(a => (
          <button key={a.key} className={`db-act db-act-${a.color}`} onClick={() => go(a.key)}>
            <div className="db-act-ico">{Icon[a.icon]({ width:18, height:18 })}</div>
            <div className="db-act-label">{a.label}</div>
            <div className="db-act-sub">{a.sub}</div>
            <div className="db-act-cnt">{a.cnt}</div>
          </button>
        ))}
      </div>

      {/* ── Vault cards ── */}
      {[
        { key:'small', title:'ຄັງນ້ອຍ', icon:'vault',  sub:'ລາຍຮັບ-ລາຍຈ່າຍປະຈຳວັນ', inc: smallIn, out: smallOut,
          cnt: store.smallIncome.length + store.smallExpense.length },
        { key:'big',   title:'ຄັງໃຫຍ່', icon:'temple', sub:'ງານບຸນ ແລະ ກິດຈະກຳໃຫຍ່',  inc: bigIn,   out: bigOut,
          cnt: store.bigIncome.length + store.bigExpense.length },
      ].map(v => (
        <div className={`db-vault ${v.key}`} key={v.key}>
          <div className="dv-head">
            <div className="dv-icon">{Icon[v.icon]({ width:18, height:18 })}</div>
            <div className="dv-info">
              <div className="dv-title">{v.title}</div>
              <div className="dv-sub">{v.sub}</div>
            </div>
            <div className="dv-badge">{v.cnt} ທຸລະ</div>
          </div>
          <div className="dv-table">
            <div className="dv-thead">
              <span>ສະກຸນ</span>
              <span>ຮັບ</span>
              <span>ຈ່າຍ</span>
              <span>ຄົງ</span>
            </div>
            {CURRENCIES.map(c => {
              const net = v.inc[c.code] - v.out[c.code];
              const total = v.inc[c.code] + v.out[c.code];
              const pct = total > 0 ? (v.inc[c.code] / total) * 100 : 50;
              return (
                <div className="dv-row" key={c.code}>
                  <span className="dv-cur"><span className="dv-sym">{c.symbol}</span>{c.label}</span>
                  <span className="dv-in">{fmt(v.inc[c.code])}</span>
                  <span className="dv-out">{fmt(v.out[c.code])}</span>
                  <span className={`dv-net ${net >= 0 ? 'pos' : 'neg'}`}>{fmt(net)}</span>
                  <div className="dv-bar-wrap">
                    <div className="dv-bar-in"  style={{ width: `${pct}%` }} />
                    <div className="dv-bar-out" style={{ width: `${100 - pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Monthly strip ── */}
      <div className="db-sec-label">
        <span className="eyebrow">ລາຍເດືອນ</span>
        <span className="db-sec-hint">ໜ່ວຍ: ບາດ</span>
      </div>
      {months.length === 0 ? (
        <Empty text="ຍັງບໍ່ມີຂໍ້ມູນລາຍເດືອນ" />
      ) : (
        <div className="month-strip">
          {months.map(m => {
            const net = m.in.baht - m.out.baht;
            return (
              <div className={`m ${m.ym === curYm ? 'current' : ''}`} key={m.ym}>
                <div className="mn">{ymLabel(m.ym)}{m.ym === curYm && <span className="m-now">ນີ້</span>}</div>
                <div className="mv" style={{ color: 'var(--green)' }}>+{fmt(m.in.baht)}</div>
                <div className="mv" style={{ color: 'var(--rose)', fontSize: 12 }}>−{fmt(m.out.baht)}</div>
                <div className={`mb ${net >= 0 ? 'pos' : 'neg'}`}>{fmt(net)} ฿</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

window.Dashboard = Dashboard;
