// 4 management pages: small income / small expense / big income / big expense

// ====== ຄັງນ້ອຍ ລາຍຮັບ ======
function SmallIncomePage({ store, setStore, toast }) {
  const EMPTY_AMTS = { kip: '', baht: '', usd: '', yuan: '' };
  const [donor, setDonor] = useState('');
  const [nameI, setNameI] = useState('');
  const [date, setDate]   = useState(todayISO());
  const [amts, setAmts]   = useState(EMPTY_AMTS);
  const [editId, setEditId] = useState(null);
  const [page, setPage]   = useState(1);
  const [search, setSearch] = useState('');

  const useDropdown = donor !== '';
  const useManual   = nameI.trim() !== '';

  const startEdit = (row) => {
    const inList = store.donors.includes(row.donor);
    setDonor(inList ? row.donor : '');
    setNameI(inList ? '' : row.donor);
    setDate(row.date);
    setAmts({ kip: row.kip || '', baht: row.baht || '', usd: row.usd || '', yuan: row.yuan || '' });
    setEditId(row.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null); setDonor(''); setNameI('');
    setDate(todayISO()); setAmts(EMPTY_AMTS);
  };

  const submit = () => {
    const finalDonor = useDropdown ? donor : nameI.trim();
    if (!finalDonor) { toast('ກະລຸນາເລືອກ ຫຼື ປ້ອນຊື່ເຈົ້າສັດທາ'); return; }
    if (!date) { toast('ກະລຸນາເລືອກວັນທີ'); return; }
    if (!CURRENCIES.some(c => Number(amts[c.code]) > 0)) {
      toast('ກະລຸນາປ້ອນຈຳນວນເງິນຢ່າງໜ້ອຍ 1 ສະກຸນ'); return;
    }
    const values = { date, donor: finalDonor, kip: Number(amts.kip)||0, baht: Number(amts.baht)||0, usd: Number(amts.usd)||0, yuan: Number(amts.yuan)||0 };
    const nextDonors = (!useDropdown && nameI.trim() && !store.donors.includes(nameI.trim()))
      ? [nameI.trim(), ...store.donors] : store.donors;

    if (editId) {
      setStore({ ...store, smallIncome: store.smallIncome.map(r => r.id === editId ? { ...r, ...values } : r), donors: nextDonors });
      toast('ອັບເດດລາຍຮັບແລ້ວ');
    } else {
      setStore({ ...store, smallIncome: [{ id: uid(), ...values }, ...store.smallIncome], donors: nextDonors });
      setPage(1);
      toast('ບັນທຶກລາຍຮັບສຳເລັດ');
    }
    cancelEdit();
  };

  const remove = (id) => {
    setStore({ ...store, smallIncome: store.smallIncome.filter(r => r.id !== id) });
    toast('ລຶບລາຍການແລ້ວ');
  };

  const totals = sumCurr(store.smallIncome);
  const q = search.trim().toLowerCase();
  const rows = q ? store.smallIncome.filter(r =>
    r.donor.toLowerCase().includes(q) || r.date.includes(q)
  ) : store.smallIncome;
  const slice = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="page">
      <div className="page-header">
        <div className="eyebrow">ຄັງນ້ອຍ</div>
        <h1>ຈັດການລາຍຮັບ</h1>
        <p>ບັນທຶກເງິນທີ່ໄດ້ຮັບຈາກເຈົ້າສັດທາໃນແຕ່ລະວັນ</p>
      </div>

      <CurrencyStrip totals={totals} subLabel="ຍອດລວມທີ່ໄດ້ຮັບ" />

      <div className="section">
        <div className="s-head">
          <h3>{editId ? 'ແກ້ໄຂລາຍຮັບ' : 'ປ້ອນຂໍ້ມູນລາຍຮັບ'}</h3>
          <span className="meta">ຄັງນ້ອຍ</span>
        </div>
        <div className="s-body">
          <div className="field either">
            <div className="helper" />
            <div className="field" style={{ marginBottom: 8 }}>
              <label>ເຈົ້າສັດທາ (ເລືອກຈາກລາຍຊື່)</label>
              <select className="control select" value={donor} disabled={useManual}
                onChange={e => setDonor(e.target.value)}>
                <option value="">— ເລືອກເຈົ້າສັດທາ —</option>
                {store.donors.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 4 }}>
              <label>ຊື່ ແລະ ນາມສະກຸນ (ປ້ອນໃໝ່)</label>
              <input className="control" placeholder="ປ້ອນຊື່ ແລະ ນາມສະກຸນ"
                value={nameI} disabled={useDropdown} onChange={e => setNameI(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>ວັນທີ</label>
            <input className="control" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>ຈຳນວນເງິນຕາມສະກຸນ</label>
            <AmountFields values={amts} onChange={setAmts} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1 }} onClick={submit}>
              <Icon.plus /> {editId ? 'ອັບເດດລາຍຮັບ' : 'ບັນທຶກລາຍຮັບ'}
            </button>
            {editId && (
              <button className="btn ghost" style={{ width: 'auto', padding: '13px 16px' }} onClick={cancelEdit}>
                ຍົກເລີກ
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="s-head">
          <h3>ລາຍການລາຍຮັບທັງໝົດ</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="meta">{rows.length} ລາຍການ</span>
            {store.smallIncome.length > 0 && (
              <button className="btn ghost sm" onClick={() => exportXLSX('ຄັງນ້ອຍ-ລາຍຮັບ.xlsx', [{
                name: 'ຄັງນ້ອຍ ລາຍຮັບ',
                headers: ['#', 'ວັນທີ', 'ເຈົ້າສັດທາ', 'ກີບ (₭)', 'ບາດ (฿)', 'ໂດລາ ($)', 'ຢວນ (¥)'],
                rows: rows.map((r, i) => [i + 1, fmtDate(r.date), r.donor, r.kip, r.baht, r.usd, r.yuan]),
                totalsRow: ['', 'ລວມ', '', totals.kip, totals.baht, totals.usd, totals.yuan],
              }])}>
                <Icon.excel /> Excel
              </button>
            )}
          </div>
        </div>
        <div className="search-bar">
          <span className="search-ico"><Icon.search /></span>
          <input placeholder="ຄົ້ນຫາ ເຈົ້າສັດທາ ຫຼື ວັນທີ…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && <button className="search-clear" onClick={() => { setSearch(''); setPage(1); }}>✕</button>}
        </div>
        {rows.length === 0 ? (
          <div className="s-body"><Empty text={search ? 'ບໍ່ພົບລາຍການ' : 'ຍັງບໍ່ມີລາຍການລາຍຮັບ'} /></div>
        ) : (
          <>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th><th>ວັນທີ</th><th>ເຈົ້າສັດທາ</th>
                    <th className="num">ກີບ</th><th className="num">ບາດ</th>
                    <th className="num">ໂດລາ</th><th className="num">ຢວນ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((r, i) => (
                    <tr key={r.id} style={{ background: editId === r.id ? 'var(--gold-soft)' : '' }}>
                      <td style={{ color: 'var(--ink-3)', fontSize: 11 }}>{(page - 1) * PER_PAGE + i + 1}</td>
                      <td>{fmtDate(r.date)}</td>
                      <td>{r.donor}</td>
                      <td className="num">{fmt(r.kip)}</td>
                      <td className="num">{fmt(r.baht)}</td>
                      <td className="num">{fmt(r.usd)}</td>
                      <td className="num">{fmt(r.yuan)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ color: 'var(--gold)', padding: '2px 4px' }} title="ແກ້ໄຂ" onClick={() => startEdit(r)}><Icon.edit /></button>
                          <button className="del" title="ລຶບ" onClick={() => remove(r.id)}><Icon.trash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager total={rows.length} page={page} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

// ====== ຄັງນ້ອຍ ລາຍຈ່າຍ ======
function SmallExpensePage({ store, setStore, toast }) {
  const EMPTY_AMTS = { kip: '', baht: '', usd: '', yuan: '' };
  const [item, setItem]   = useState('');
  const [nameI, setNameI] = useState('');
  const [date, setDate]   = useState(todayISO());
  const [qty, setQty]     = useState('1');
  const [amts, setAmts]   = useState(EMPTY_AMTS);
  const [editId, setEditId] = useState(null);
  const [page, setPage]   = useState(1);
  const [search, setSearch] = useState('');

  const useDropdown = item !== '';
  const useManual   = nameI.trim() !== '';

  const startEdit = (row) => {
    const inList = store.expenseItemsSmall.includes(row.item);
    setItem(inList ? row.item : '');
    setNameI(inList ? '' : row.item);
    setDate(row.date);
    setQty(String(row.qty || 1));
    setAmts({ kip: row.kip || '', baht: row.baht || '', usd: row.usd || '', yuan: row.yuan || '' });
    setEditId(row.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null); setItem(''); setNameI('');
    setDate(todayISO()); setQty('1'); setAmts(EMPTY_AMTS);
  };

  const submit = () => {
    const final = useDropdown ? item : nameI.trim();
    if (!final) { toast('ກະລຸນາເລືອກ ຫຼື ປ້ອນລາຍການ'); return; }
    if (!date) { toast('ກະລຸນາເລືອກວັນທີ'); return; }
    if (!CURRENCIES.some(c => Number(amts[c.code]) > 0)) {
      toast('ກະລຸນາປ້ອນຈຳນວນເງິນຢ່າງໜ້ອຍ 1 ສະກຸນ'); return;
    }
    const values = { date, item: final, qty: Number(qty)||1, kip: Number(amts.kip)||0, baht: Number(amts.baht)||0, usd: Number(amts.usd)||0, yuan: Number(amts.yuan)||0 };
    const nextItems = (!useDropdown && nameI.trim() && !store.expenseItemsSmall.includes(nameI.trim()))
      ? [nameI.trim(), ...store.expenseItemsSmall] : store.expenseItemsSmall;

    if (editId) {
      setStore({ ...store, smallExpense: store.smallExpense.map(r => r.id === editId ? { ...r, ...values } : r), expenseItemsSmall: nextItems });
      toast('ອັບເດດລາຍຈ່າຍແລ້ວ');
    } else {
      setStore({ ...store, smallExpense: [{ id: uid(), ...values }, ...store.smallExpense], expenseItemsSmall: nextItems });
      setPage(1);
      toast('ບັນທຶກລາຍຈ່າຍສຳເລັດ');
    }
    cancelEdit();
  };

  const remove = (id) => {
    setStore({ ...store, smallExpense: store.smallExpense.filter(r => r.id !== id) });
    toast('ລຶບລາຍການແລ້ວ');
  };

  const totals = sumCurr(store.smallExpense);
  const q = search.trim().toLowerCase();
  const rows = q ? store.smallExpense.filter(r =>
    r.item.toLowerCase().includes(q) || r.date.includes(q)
  ) : store.smallExpense;
  const slice = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="page">
      <div className="page-header">
        <div className="eyebrow">ຄັງນ້ອຍ</div>
        <h1>ຈັດການລາຍຈ່າຍ</h1>
        <p>ບັນທຶກຄ່າໃຊ້ຈ່າຍປະຈຳວັນຂອງວັດ</p>
      </div>

      <CurrencyStrip totals={totals} subLabel="ຍອດລວມທີ່ຈ່າຍໄປ" />

      <div className="section">
        <div className="s-head">
          <h3>{editId ? 'ແກ້ໄຂລາຍຈ່າຍ' : 'ປ້ອນຂໍ້ມູນລາຍຈ່າຍ'}</h3>
          <span className="meta">ຄັງນ້ອຍ</span>
        </div>
        <div className="s-body">
          <div className="field either">
            <div className="helper" />
            <div className="field" style={{ marginBottom: 8 }}>
              <label>ເລືອກລາຍການ</label>
              <select className="control select" value={item} disabled={useManual}
                onChange={e => setItem(e.target.value)}>
                <option value="">— ເລືອກລາຍການ —</option>
                {store.expenseItemsSmall.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 4 }}>
              <label>ລາຍການທີ່ຕ້ອງຈ່າຍ (ປ້ອນໃໝ່)</label>
              <input className="control" placeholder="ປ້ອນລາຍການທີ່ຕ້ອງຈ່າຍ"
                value={nameI} disabled={useDropdown} onChange={e => setNameI(e.target.value)} />
            </div>
          </div>
          <div className="row" style={{ marginBottom: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>ວັນທີ</label>
              <input className="control" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>ຈຳນວນ</label>
              <input className="control" type="number" inputMode="numeric" min="1" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>ຈຳນວນເງິນຕາມສະກຸນ</label>
            <AmountFields values={amts} onChange={setAmts} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1 }} onClick={submit}>
              <Icon.plus /> {editId ? 'ອັບເດດລາຍຈ່າຍ' : 'ບັນທຶກລາຍຈ່າຍ'}
            </button>
            {editId && (
              <button className="btn ghost" style={{ width: 'auto', padding: '13px 16px' }} onClick={cancelEdit}>
                ຍົກເລີກ
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="s-head">
          <h3>ລາຍການລາຍຈ່າຍທັງໝົດ</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="meta">{rows.length} ລາຍການ</span>
            {store.smallExpense.length > 0 && (
              <button className="btn ghost sm" onClick={() => exportXLSX('ຄັງນ້ອຍ-ລາຍຈ່າຍ.xlsx', [{
                name: 'ຄັງນ້ອຍ ລາຍຈ່າຍ',
                headers: ['#', 'ວັນທີ', 'ລາຍການ', 'ຈຳນວນ', 'ກີບ (₭)', 'ບາດ (฿)', 'ໂດລາ ($)', 'ຢວນ (¥)'],
                rows: rows.map((r, i) => [i + 1, fmtDate(r.date), r.item, r.qty, r.kip, r.baht, r.usd, r.yuan]),
                totalsRow: ['', 'ລວມ', '', '', totals.kip, totals.baht, totals.usd, totals.yuan],
              }])}>
                <Icon.excel /> Excel
              </button>
            )}
          </div>
        </div>
        <div className="search-bar">
          <span className="search-ico"><Icon.search /></span>
          <input placeholder="ຄົ້ນຫາ ລາຍການ ຫຼື ວັນທີ…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && <button className="search-clear" onClick={() => { setSearch(''); setPage(1); }}>✕</button>}
        </div>
        {rows.length === 0 ? (
          <div className="s-body"><Empty text={search ? 'ບໍ່ພົບລາຍການ' : 'ຍັງບໍ່ມີລາຍການລາຍຈ່າຍ'} /></div>
        ) : (
          <>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th><th>ວັນທີ</th><th>ລາຍການ</th><th className="num">ຈຳນວນ</th>
                    <th className="num">ກີບ</th><th className="num">ບາດ</th>
                    <th className="num">ໂດລາ</th><th className="num">ຢວນ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((r, i) => (
                    <tr key={r.id} style={{ background: editId === r.id ? 'var(--gold-soft)' : '' }}>
                      <td style={{ color: 'var(--ink-3)', fontSize: 11 }}>{(page - 1) * PER_PAGE + i + 1}</td>
                      <td>{fmtDate(r.date)}</td>
                      <td>{r.item}</td>
                      <td className="num">{r.qty}</td>
                      <td className="num">{fmt(r.kip)}</td>
                      <td className="num">{fmt(r.baht)}</td>
                      <td className="num">{fmt(r.usd)}</td>
                      <td className="num">{fmt(r.yuan)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ color: 'var(--gold)', padding: '2px 4px' }} title="ແກ້ໄຂ" onClick={() => startEdit(r)}><Icon.edit /></button>
                          <button className="del" title="ລຶບ" onClick={() => remove(r.id)}><Icon.trash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager total={rows.length} page={page} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

// ====== ຄັງໃຫຍ່ ລາຍຮັບ ======
function BigIncomePage({ store, setStore, toast }) {
  const EMPTY_AMTS = { kip: '', baht: '', usd: '', yuan: '' };
  const [event, setEvent] = useState('');
  const [date, setDate]   = useState(todayISO());
  const [amts, setAmts]   = useState(EMPTY_AMTS);
  const [editId, setEditId] = useState(null);
  const [page, setPage]   = useState(1);
  const [search, setSearch] = useState('');

  const startEdit = (row) => {
    setEvent(row.event);
    setDate(row.date);
    setAmts({ kip: row.kip || '', baht: row.baht || '', usd: row.usd || '', yuan: row.yuan || '' });
    setEditId(row.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null); setEvent(''); setDate(todayISO()); setAmts(EMPTY_AMTS);
  };

  const submit = () => {
    if (!event.trim()) { toast('ກະລຸນາປ້ອນລາຍການງານບຸນ'); return; }
    if (!date) { toast('ກະລຸນາເລືອກວັນທີ'); return; }
    if (!CURRENCIES.some(c => Number(amts[c.code]) > 0)) {
      toast('ກະລຸນາປ້ອນຈຳນວນເງິນຢ່າງໜ້ອຍ 1 ສະກຸນ'); return;
    }
    const values = { date, event: event.trim(), kip: Number(amts.kip)||0, baht: Number(amts.baht)||0, usd: Number(amts.usd)||0, yuan: Number(amts.yuan)||0 };

    if (editId) {
      setStore({ ...store, bigIncome: store.bigIncome.map(r => r.id === editId ? { ...r, ...values } : r) });
      toast('ອັບເດດລາຍຮັບງານບຸນແລ້ວ');
    } else {
      setStore({ ...store, bigIncome: [{ id: uid(), ...values }, ...store.bigIncome] });
      setPage(1);
      toast('ບັນທຶກລາຍຮັບງານບຸນແລ້ວ');
    }
    cancelEdit();
  };

  const remove = (id) => {
    setStore({ ...store, bigIncome: store.bigIncome.filter(r => r.id !== id) });
    toast('ລຶບລາຍການແລ້ວ');
  };

  const totals = sumCurr(store.bigIncome);
  const q = search.trim().toLowerCase();
  const rows = q ? store.bigIncome.filter(r =>
    r.event.toLowerCase().includes(q) || r.date.includes(q)
  ) : store.bigIncome;
  const slice = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="page">
      <div className="page-header">
        <div className="eyebrow">ຄັງໃຫຍ່</div>
        <h1>ຈັດການລາຍຮັບ</h1>
        <p>ບັນທຶກລາຍຮັບຈາກງານບຸນ ແລະ ກິດຈະກຳໃຫຍ່</p>
      </div>

      <CurrencyStrip totals={totals} subLabel="ຍອດລວມທີ່ໄດ້ຮັບ" />

      <div className="section">
        <div className="s-head">
          <h3>{editId ? 'ແກ້ໄຂລາຍຮັບ' : 'ປ້ອນຂໍ້ມູນລາຍຮັບ'}</h3>
          <span className="meta">ຄັງໃຫຍ່</span>
        </div>
        <div className="s-body">
          <div className="field">
            <label>ລາຍການງານບຸນ</label>
            <input className="control" placeholder="ລາຍການງານບຸນ"
              value={event} onChange={e => setEvent(e.target.value)} />
          </div>
          <div className="field">
            <label>ວັນທີ</label>
            <input className="control" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>ຈຳນວນເງິນຕາມສະກຸນ</label>
            <AmountFields values={amts} onChange={setAmts} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1 }} onClick={submit}>
              <Icon.plus /> {editId ? 'ອັບເດດລາຍຮັບ' : 'ບັນທຶກລາຍຮັບ'}
            </button>
            {editId && (
              <button className="btn ghost" style={{ width: 'auto', padding: '13px 16px' }} onClick={cancelEdit}>
                ຍົກເລີກ
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="s-head">
          <h3>ລາຍການລາຍຮັບທັງໝົດ</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="meta">{rows.length} ລາຍການ</span>
            {store.bigIncome.length > 0 && (
              <button className="btn ghost sm" onClick={() => exportXLSX('ຄັງໃຫຍ່-ລາຍຮັບ.xlsx', [{
                name: 'ຄັງໃຫຍ່ ລາຍຮັບ',
                headers: ['#', 'ວັນທີ', 'ງານບຸນ', 'ກີບ (₭)', 'ບາດ (฿)', 'ໂດລາ ($)', 'ຢວນ (¥)'],
                rows: rows.map((r, i) => [i + 1, fmtDate(r.date), r.event, r.kip, r.baht, r.usd, r.yuan]),
                totalsRow: ['', 'ລວມ', '', totals.kip, totals.baht, totals.usd, totals.yuan],
              }])}>
                <Icon.excel /> Excel
              </button>
            )}
          </div>
        </div>
        <div className="search-bar">
          <span className="search-ico"><Icon.search /></span>
          <input placeholder="ຄົ້ນຫາ ງານບຸນ ຫຼື ວັນທີ…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && <button className="search-clear" onClick={() => { setSearch(''); setPage(1); }}>✕</button>}
        </div>
        {rows.length === 0 ? (
          <div className="s-body"><Empty text={search ? 'ບໍ່ພົບລາຍການ' : 'ຍັງບໍ່ມີລາຍການລາຍຮັບ'} /></div>
        ) : (
          <>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th><th>ວັນທີ</th><th>ງານບຸນ</th>
                    <th className="num">ກີບ</th><th className="num">ບາດ</th>
                    <th className="num">ໂດລາ</th><th className="num">ຢວນ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((r, i) => (
                    <tr key={r.id} style={{ background: editId === r.id ? 'var(--gold-soft)' : '' }}>
                      <td style={{ color: 'var(--ink-3)', fontSize: 11 }}>{(page - 1) * PER_PAGE + i + 1}</td>
                      <td>{fmtDate(r.date)}</td>
                      <td>{r.event}</td>
                      <td className="num">{fmt(r.kip)}</td>
                      <td className="num">{fmt(r.baht)}</td>
                      <td className="num">{fmt(r.usd)}</td>
                      <td className="num">{fmt(r.yuan)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ color: 'var(--gold)', padding: '2px 4px' }} title="ແກ້ໄຂ" onClick={() => startEdit(r)}><Icon.edit /></button>
                          <button className="del" title="ລຶບ" onClick={() => remove(r.id)}><Icon.trash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager total={rows.length} page={page} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

// ====== ຄັງໃຫຍ່ ລາຍຈ່າຍ ======
function BigExpensePage({ store, setStore, toast }) {
  const EMPTY_AMTS = { kip: '', baht: '', usd: '', yuan: '' };
  const [item, setItem]   = useState('');
  const [date, setDate]   = useState(todayISO());
  const [qty, setQty]     = useState('1');
  const [amts, setAmts]   = useState(EMPTY_AMTS);
  const [editId, setEditId] = useState(null);
  const [page, setPage]   = useState(1);
  const [search, setSearch] = useState('');

  const startEdit = (row) => {
    setItem(row.item);
    setDate(row.date);
    setQty(String(row.qty || 1));
    setAmts({ kip: row.kip || '', baht: row.baht || '', usd: row.usd || '', yuan: row.yuan || '' });
    setEditId(row.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null); setItem(''); setDate(todayISO()); setQty('1'); setAmts(EMPTY_AMTS);
  };

  const submit = () => {
    if (!item.trim()) { toast('ກະລຸນາປ້ອນຊື່ລາຍການ'); return; }
    if (!date) { toast('ກະລຸນາເລືອກວັນທີ'); return; }
    if (!CURRENCIES.some(c => Number(amts[c.code]) > 0)) {
      toast('ກະລຸນາປ້ອນຈຳນວນເງິນຢ່າງໜ້ອຍ 1 ສະກຸນ'); return;
    }
    const values = { date, item: item.trim(), qty: Number(qty)||1, kip: Number(amts.kip)||0, baht: Number(amts.baht)||0, usd: Number(amts.usd)||0, yuan: Number(amts.yuan)||0 };

    if (editId) {
      setStore({ ...store, bigExpense: store.bigExpense.map(r => r.id === editId ? { ...r, ...values } : r) });
      toast('ອັບເດດລາຍຈ່າຍແລ້ວ');
    } else {
      setStore({ ...store, bigExpense: [{ id: uid(), ...values }, ...store.bigExpense] });
      setPage(1);
      toast('ບັນທຶກລາຍຈ່າຍແລ້ວ');
    }
    cancelEdit();
  };

  const remove = (id) => {
    setStore({ ...store, bigExpense: store.bigExpense.filter(r => r.id !== id) });
    toast('ລຶບລາຍການແລ້ວ');
  };

  const totals = sumCurr(store.bigExpense);
  const q = search.trim().toLowerCase();
  const rows = q ? store.bigExpense.filter(r =>
    r.item.toLowerCase().includes(q) || r.date.includes(q)
  ) : store.bigExpense;
  const slice = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="page">
      <div className="page-header">
        <div className="eyebrow">ຄັງໃຫຍ່</div>
        <h1>ຈັດການລາຍຈ່າຍ</h1>
        <p>ບັນທຶກຄ່າໃຊ້ຈ່າຍງານບຸນ ແລະ ການກໍ່ສ້າງ</p>
      </div>

      <CurrencyStrip totals={totals} subLabel="ຍອດລວມທີ່ຈ່າຍໄປ" />

      <div className="section">
        <div className="s-head">
          <h3>{editId ? 'ແກ້ໄຂລາຍຈ່າຍ' : 'ປ້ອນຂໍ້ມູນລາຍຈ່າຍ'}</h3>
          <span className="meta">ຄັງໃຫຍ່</span>
        </div>
        <div className="s-body">
          <div className="field">
            <label>ຊື່ລາຍການທີ່ຕ້ອງຈ່າຍ</label>
            <input className="control" placeholder="ລາຍການທີ່ຕ້ອງຈ່າຍ"
              value={item} onChange={e => setItem(e.target.value)} />
          </div>
          <div className="row" style={{ marginBottom: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>ວັນທີ</label>
              <input className="control" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>ຈຳນວນ</label>
              <input className="control" type="number" inputMode="numeric" min="1" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>ຈຳນວນເງິນຕາມສະກຸນ</label>
            <AmountFields values={amts} onChange={setAmts} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1 }} onClick={submit}>
              <Icon.plus /> {editId ? 'ອັບເດດລາຍຈ່າຍ' : 'ບັນທຶກລາຍຈ່າຍ'}
            </button>
            {editId && (
              <button className="btn ghost" style={{ width: 'auto', padding: '13px 16px' }} onClick={cancelEdit}>
                ຍົກເລີກ
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="s-head">
          <h3>ລາຍການລາຍຈ່າຍທັງໝົດ</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="meta">{rows.length} ລາຍການ</span>
            {store.bigExpense.length > 0 && (
              <button className="btn ghost sm" onClick={() => exportXLSX('ຄັງໃຫຍ່-ລາຍຈ່າຍ.xlsx', [{
                name: 'ຄັງໃຫຍ່ ລາຍຈ່າຍ',
                headers: ['#', 'ວັນທີ', 'ລາຍການ', 'ຈຳນວນ', 'ກີບ (₭)', 'ບາດ (฿)', 'ໂດລາ ($)', 'ຢວນ (¥)'],
                rows: rows.map((r, i) => [i + 1, fmtDate(r.date), r.item, r.qty, r.kip, r.baht, r.usd, r.yuan]),
                totalsRow: ['', 'ລວມ', '', '', totals.kip, totals.baht, totals.usd, totals.yuan],
              }])}>
                <Icon.excel /> Excel
              </button>
            )}
          </div>
        </div>
        <div className="search-bar">
          <span className="search-ico"><Icon.search /></span>
          <input placeholder="ຄົ້ນຫາ ລາຍການ ຫຼື ວັນທີ…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && <button className="search-clear" onClick={() => { setSearch(''); setPage(1); }}>✕</button>}
        </div>
        {rows.length === 0 ? (
          <div className="s-body"><Empty text={search ? 'ບໍ່ພົບລາຍການ' : 'ຍັງບໍ່ມີລາຍການລາຍຈ່າຍ'} /></div>
        ) : (
          <>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th><th>ວັນທີ</th><th>ລາຍການ</th><th className="num">ຈຳນວນ</th>
                    <th className="num">ກີບ</th><th className="num">ບາດ</th>
                    <th className="num">ໂດລາ</th><th className="num">ຢວນ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((r, i) => (
                    <tr key={r.id} style={{ background: editId === r.id ? 'var(--gold-soft)' : '' }}>
                      <td style={{ color: 'var(--ink-3)', fontSize: 11 }}>{(page - 1) * PER_PAGE + i + 1}</td>
                      <td>{fmtDate(r.date)}</td>
                      <td>{r.item}</td>
                      <td className="num">{r.qty}</td>
                      <td className="num">{fmt(r.kip)}</td>
                      <td className="num">{fmt(r.baht)}</td>
                      <td className="num">{fmt(r.usd)}</td>
                      <td className="num">{fmt(r.yuan)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ color: 'var(--gold)', padding: '2px 4px' }} title="ແກ້ໄຂ" onClick={() => startEdit(r)}><Icon.edit /></button>
                          <button className="del" title="ລຶບ" onClick={() => remove(r.id)}><Icon.trash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager total={rows.length} page={page} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { SmallIncomePage, SmallExpensePage, BigIncomePage, BigExpensePage });
