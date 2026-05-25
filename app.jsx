// App shell: sidebar + routing
const ROUTES = [
  { key: 'home',      label: 'ໜ້າຫຼັກ',          group: null,      icon: 'home'    },
  { key: 'small-in',  label: 'ຄັງນ້ອຍ ລາຍຮັບ',   group: 'ຄັງນ້ອຍ', icon: 'inflow'  },
  { key: 'small-out', label: 'ຄັງນ້ອຍ ລາຍຈ່າຍ',  group: 'ຄັງນ້ອຍ', icon: 'outflow' },
  { key: 'big-in',    label: 'ຄັງໃຫຍ່ ລາຍຮັບ',   group: 'ຄັງໃຫຍ່', icon: 'inflow'  },
  { key: 'big-out',   label: 'ຄັງໃຫຍ່ ລາຍຈ່າຍ',  group: 'ຄັງໃຫຍ່', icon: 'outflow' },
  { key: 'report',    label: 'ລາຍງານ',           group: null,      icon: 'report'  },
];

function App() {
  const [store, setStore]     = useState(null);   // null = ກຳລັງໂຫຼດ
  const [route, setRoute]     = useState('home');
  const [navOpen, setNavOpen] = useState(false);
  const [toastEl, showToast]  = useToast();

  // load from db.json on mount
  useEffect(() => {
    window.TF.loadStore().then(data => setStore(data));
  }, []);

  // save to db.json whenever store changes
  useEffect(() => {
    if (store) window.TF.saveStore(store);
  }, [store]);

  const go = (r) => { setRoute(r); setNavOpen(false); window.scrollTo({ top: 0 }); };

  // loading screen
  if (!store) {
    return (
      <div className="app" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--ink-3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◇</div>
          <div style={{ fontSize: 16 }}>ກຳລັງໂຫຼດ...</div>
        </div>
      </div>
    );
  }

  const current = ROUTES.find(r => r.key === route) || ROUTES[0];

  const groups = [];
  let lastGroup = '__none';
  ROUTES.forEach(r => {
    if (r.group !== lastGroup) {
      groups.push({ name: r.group, items: [] });
      lastGroup = r.group;
    }
    groups[groups.length - 1].items.push(r);
  });

  return (
    <div className="app" data-screen-label={current.label}>
      {/* Topbar */}
      <div className="topbar">
        <button className="menu-btn" aria-label="ເມນູ" onClick={() => setNavOpen(true)}>
          <Icon.menu />
        </button>
        <div className="title-wrap">
          <div className="eyebrow">ວັດພະໄຊ</div>
          <div className="title">{current.label}</div>
        </div>
        <div className="spacer" />
        <div className="crest" title="ວັດ">ວ</div>
      </div>

      {/* Pages */}
      {route === 'home'      && <Dashboard store={store} go={go} />}
      {route === 'small-in'  && <SmallIncomePage  store={store} setStore={setStore} toast={showToast} />}
      {route === 'small-out' && <SmallExpensePage store={store} setStore={setStore} toast={showToast} />}
      {route === 'big-in'    && <BigIncomePage    store={store} setStore={setStore} toast={showToast} />}
      {route === 'big-out'   && <BigExpensePage   store={store} setStore={setStore} toast={showToast} />}
      {route === 'report'    && <ReportPage       store={store} />}

      {/* Sidebar */}
      <div className={`scrim ${navOpen ? 'open' : ''}`} onClick={() => setNavOpen(false)} />
      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="crest">ວ</div>
          <div>
            <div className="name">ວັດພະໄຊ</div>
            <div className="sub">ລະບົບຈັດການຄັງ ວັດພະໄຊ</div>
          </div>
          <button className="menu-btn" style={{ marginLeft: 'auto', background: 'transparent', border: 'none' }} onClick={() => setNavOpen(false)}>
            <Icon.close />
          </button>
        </div>
        <nav>
          {groups.map((g, i) => (
            <div key={i}>
              {g.name && <div className="nav-group">{g.name}</div>}
              {g.items.map(item => (
                <button
                  key={item.key}
                  className={`nav-item ${route === item.key ? 'active' : ''}`}
                  onClick={() => go(item.key)}
                >
                  <span className="ico">{Icon[item.icon]()}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="foot">
          ພັດທະນາໂດຍ ພຣະ ອານັນ ບາລັດສະມີ ** 2026 **
        </div>
      </aside>

      {toastEl}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
