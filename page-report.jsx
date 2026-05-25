// Report page (ລາຍງານ)
function ReportPage({ store }) {
  const [tab, setTab] = useState('overview'); // overview | small | big | byMonth

  const smallIn  = sumCurr(store.smallIncome);
  const smallOut = sumCurr(store.smallExpense);
  const bigIn    = sumCurr(store.bigIncome);
  const bigOut   = sumCurr(store.bigExpense);
  const allIn    = sumCurr([...store.smallIncome, ...store.bigIncome]);
  const allOut   = sumCurr([...store.smallExpense, ...store.bigExpense]);

  const monthly = useMemo(() => {
    const map = {};
    const addRow = (r, key) => {
      const ym = ymKey(r.date);
      if (!ym) return;
      if (!map[ym]) map[ym] = {
        in:  { kip:0,baht:0,usd:0,yuan:0 },
        out: { kip:0,baht:0,usd:0,yuan:0 },
      };
      CURRENCIES.forEach(c => { map[ym][key][c.code] += Number(r[c.code]) || 0; });
    };
    [...store.smallIncome, ...store.bigIncome].forEach(r => addRow(r, 'in'));
    [...store.smallExpense, ...store.bigExpense].forEach(r => addRow(r, 'out'));
    return Object.entries(map)
      .map(([ym, v]) => ({ ym, ...v }))
      .sort((a,b) => a.ym.localeCompare(b.ym));
  }, [store]);

  const maxBaht = Math.max(1, ...monthly.flatMap(m => [m.in.baht, m.out.baht]));

  return (
    <div className="page">
      <div className="page-header">
        <div className="eyebrow">ລາຍງານ</div>
        <h1>ລາຍງານການເງິນ</h1>
        <p>ພາບລວມລາຍຮັບ-ລາຍຈ່າຍ ແຍກຕາມຄັງ ແລະ ລາຍເດືອນ</p>
      </div>

      <div className="tab-row">
        <div className={`tab ${tab==='overview'?'active':''}`} onClick={() => setTab('overview')}>ພາບລວມ</div>
        <div className={`tab ${tab==='small'?'active':''}`}    onClick={() => setTab('small')}>ຄັງນ້ອຍ</div>
        <div className={`tab ${tab==='big'?'active':''}`}      onClick={() => setTab('big')}>ຄັງໃຫຍ່</div>
        <div className={`tab ${tab==='byMonth'?'active':''}`}  onClick={() => setTab('byMonth')}>ລາຍເດືອນ</div>
        <button className="btn ghost sm" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }} onClick={() => exportXLSX('ວັດພະໄຊ-ລາຍງານ.xlsx', [
          {
            name: 'ຄັງນ້ອຍ ລາຍຮັບ',
            headers: ['#', 'ວັນທີ', 'ເຈົ້າສັດທາ', 'ກີບ (₭)', 'ບາດ (฿)', 'ໂດລາ ($)', 'ຢວນ (¥)'],
            rows: store.smallIncome.map((r, i) => [i + 1, fmtDate(r.date), r.donor, r.kip, r.baht, r.usd, r.yuan]),
            totalsRow: ['', 'ລວມ', '', smallIn.kip, smallIn.baht, smallIn.usd, smallIn.yuan],
          },
          {
            name: 'ຄັງນ້ອຍ ລາຍຈ່າຍ',
            headers: ['#', 'ວັນທີ', 'ລາຍການ', 'ຈຳນວນ', 'ກີບ (₭)', 'ບາດ (฿)', 'ໂດລາ ($)', 'ຢວນ (¥)'],
            rows: store.smallExpense.map((r, i) => [i + 1, fmtDate(r.date), r.item, r.qty, r.kip, r.baht, r.usd, r.yuan]),
            totalsRow: ['', 'ລວມ', '', '', smallOut.kip, smallOut.baht, smallOut.usd, smallOut.yuan],
          },
          {
            name: 'ຄັງໃຫຍ່ ລາຍຮັບ',
            headers: ['#', 'ວັນທີ', 'ງານບຸນ', 'ກີບ (₭)', 'ບາດ (฿)', 'ໂດລາ ($)', 'ຢວນ (¥)'],
            rows: store.bigIncome.map((r, i) => [i + 1, fmtDate(r.date), r.event, r.kip, r.baht, r.usd, r.yuan]),
            totalsRow: ['', 'ລວມ', '', bigIn.kip, bigIn.baht, bigIn.usd, bigIn.yuan],
          },
          {
            name: 'ຄັງໃຫຍ່ ລາຍຈ່າຍ',
            headers: ['#', 'ວັນທີ', 'ລາຍການ', 'ຈຳນວນ', 'ກີບ (₭)', 'ບາດ (฿)', 'ໂດລາ ($)', 'ຢວນ (¥)'],
            rows: store.bigExpense.map((r, i) => [i + 1, fmtDate(r.date), r.item, r.qty, r.kip, r.baht, r.usd, r.yuan]),
            totalsRow: ['', 'ລວມ', '', '', bigOut.kip, bigOut.baht, bigOut.usd, bigOut.yuan],
          },
        ])}>
          <Icon.excel /> Export ທັງໝົດ
        </button>
      </div>

      {tab === 'overview' && (
        <>
          <div className="section">
            <div className="s-head">
              <h3>ສະຫຼຸບຍອດທັງໝົດ</h3>
            </div>
            <div className="s-body">
              <table className="tbl" style={{ minWidth: 0 }}>
                <thead>
                  <tr>
                    <th></th><th className="num">ລາຍຮັບ</th><th className="num">ລາຍຈ່າຍ</th><th className="num">ຄົງເຫຼືອ</th>
                  </tr>
                </thead>
                <tbody>
                  {CURRENCIES.map(c => (
                    <tr key={c.code}>
                      <td><strong>{c.label}</strong></td>
                      <td className="num" style={{ color: 'var(--green)' }}>{fmt(allIn[c.code])}</td>
                      <td className="num" style={{ color: 'var(--rose)' }}>{fmt(allOut[c.code])}</td>
                      <td className="num" style={{ fontWeight: 600 }}>{fmt(allIn[c.code] - allOut[c.code])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="kli-card" style={{ marginBottom: 12 }}>
            <div className="k-head">
              <div className="k-icon"><Icon.vault /></div>
              <div>
                <div className="k-title">ຄັງນ້ອຍ</div>
                <div className="k-sub">{store.smallIncome.length + store.smallExpense.length} ທຸລະກຳ</div>
              </div>
            </div>
            <div className="k-grid">
              {CURRENCIES.map(c => (
                <div className="cell" key={c.code}>
                  <div className="lbl">{c.label} · ຄົງເຫຼືອ</div>
                  <div className="val" style={{ color: smallIn[c.code] - smallOut[c.code] >= 0 ? 'var(--green)' : 'var(--rose)' }}>
                    {fmt(smallIn[c.code] - smallOut[c.code])}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="kli-card big" style={{ marginBottom: 12 }}>
            <div className="k-head">
              <div className="k-icon"><Icon.temple /></div>
              <div>
                <div className="k-title">ຄັງໃຫຍ່</div>
                <div className="k-sub">{store.bigIncome.length + store.bigExpense.length} ທຸລະກຳ</div>
              </div>
            </div>
            <div className="k-grid">
              {CURRENCIES.map(c => (
                <div className="cell" key={c.code}>
                  <div className="lbl">{c.label} · ຄົງເຫຼືອ</div>
                  <div className="val" style={{ color: bigIn[c.code] - bigOut[c.code] >= 0 ? 'var(--green)' : 'var(--rose)' }}>
                    {fmt(bigIn[c.code] - bigOut[c.code])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'small' && (
        <div className="section">
          <div className="s-head"><h3>ຄັງນ້ອຍ</h3><span className="meta">ທຸກສະກຸນເງິນ</span></div>
          <div className="s-body">
            <table className="tbl" style={{ minWidth: 0 }}>
              <thead>
                <tr><th></th><th className="num">ລາຍຮັບ</th><th className="num">ລາຍຈ່າຍ</th><th className="num">ຄົງເຫຼືອ</th></tr>
              </thead>
              <tbody>
                {CURRENCIES.map(c => (
                  <tr key={c.code}>
                    <td><strong>{c.label}</strong></td>
                    <td className="num" style={{ color: 'var(--green)' }}>{fmt(smallIn[c.code])}</td>
                    <td className="num" style={{ color: 'var(--rose)' }}>{fmt(smallOut[c.code])}</td>
                    <td className="num" style={{ fontWeight: 600 }}>{fmt(smallIn[c.code] - smallOut[c.code])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'big' && (
        <div className="section">
          <div className="s-head"><h3>ຄັງໃຫຍ່</h3><span className="meta">ທຸກສະກຸນເງິນ</span></div>
          <div className="s-body">
            <table className="tbl" style={{ minWidth: 0 }}>
              <thead>
                <tr><th></th><th className="num">ລາຍຮັບ</th><th className="num">ລາຍຈ່າຍ</th><th className="num">ຄົງເຫຼືອ</th></tr>
              </thead>
              <tbody>
                {CURRENCIES.map(c => (
                  <tr key={c.code}>
                    <td><strong>{c.label}</strong></td>
                    <td className="num" style={{ color: 'var(--green)' }}>{fmt(bigIn[c.code])}</td>
                    <td className="num" style={{ color: 'var(--rose)' }}>{fmt(bigOut[c.code])}</td>
                    <td className="num" style={{ fontWeight: 600 }}>{fmt(bigIn[c.code] - bigOut[c.code])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'byMonth' && (
        <div className="section">
          <div className="s-head">
            <h3>ປຽບທຽບລາຍເດືອນ</h3>
            <span className="meta">ໜ່ວຍ: ບາດ</span>
          </div>
          <div className="s-body">
            {monthly.length === 0 ? (
              <Empty text="ຍັງບໍ່ມີຂໍ້ມູນ" />
            ) : monthly.map(m => (
              <div className="bar-row" key={m.ym}>
                <div className="bn">{ymLabel(m.ym)}</div>
                <div className="bars">
                  <div className="bar"><div className="fill in"  style={{ width: `${(m.in.baht / maxBaht) * 100}%` }} /></div>
                  <div className="bar"><div className="fill out" style={{ width: `${(m.out.baht / maxBaht) * 100}%` }} /></div>
                  <div className="vals">
                    <span className="v in">+{fmt(m.in.baht)}</span>
                    <span className="v out">-{fmt(m.out.baht)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

window.ReportPage = ReportPage;
