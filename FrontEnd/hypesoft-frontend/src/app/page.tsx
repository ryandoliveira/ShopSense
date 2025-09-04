// @ts-nocheck
'use client';

import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:4000` : '');

/* -------------------- placeholder helpers -------------------- */
const PLACEHOLDER_BASE = "https://via.placeholder.com/150?text=Produto";
const CATEGORY_COLORS: Record<string | number, { bg: string; fg: string }> = {
  1: { bg: 'e9d5ff', fg: '4c1d95' }, // purple-ish for shirts
  2: { bg: 'dbeafe', fg: '0369a1' }, // blue-ish for pants
  3: { bg: 'f3f4f6', fg: '111827' }, // neutral for t-shirts
};
const DEFAULT_COLOR = { bg: 'e5e7eb', fg: '374151' };



function toTextSafe(t) {
  if (t == null) return '';
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


function placeholderUrlFor({ name = 'Produto', categoryId = null, size = 150 }) {
  const key = categoryId ?? 'default';
  const colors = CATEGORY_COLORS[key] ?? DEFAULT_COLOR;
  const bg = `#${colors.bg}`;
  const fg = `#${colors.fg}`;

  const text = toTextSafe(String(name).slice(0, 18));
  const fontSize = Math.max(12, Math.floor(size / 8));

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <rect width='100%' height='100%' fill='${bg}' rx='12' ry='12'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, system-ui, Arial, sans-serif' font-size='${fontSize}' fill='${fg}'>${text}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getImageSrc(p, size = 80) {
  if (!p) return placeholderUrlFor({ name: 'Produto', size });
  const img = String(p.image || '').trim();
  if (!img || !/^https?:\/\//i.test(img)) {
    return placeholderUrlFor({ name: p.name || 'Produto', size });
  }
  return img;
}


/* -------------------- cache & mocks -------------------- */
const CACHE_TTL = 15_000;
const CACHE = new Map();
function getCache(key) {
  const e = CACHE.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) {
    CACHE.delete(key);
    return null;
  }
  return e.data;
}
function setCache(key, data) {
  CACHE.set(key, { ts: Date.now(), data });
}
function clearCache() {
  CACHE.clear();
}

/* Mock data - usado quando a API não está disponível */
const MOCK_CATEGORIES = [
  { id: 1, name: 'Shirts' },
  { id: 2, name: 'Pants' },
  { id: 3, name: 'T-Shirts' },
];

const MOCK_PRODUCTS = [
  { id:1, name:"Linen Shirt", description:"Light linen fabric", price:45, quantity:90, categoryId:1, image: null },
  { id:2, name:"Jeans Jacket", description:"Blue jeans jacket", price:65, quantity:70, categoryId:2, image: null },
  { id:3, name:"Black T-Shirt", description:"Cotton T-shirt", price:20, quantity:8, categoryId:3, image: null },
  { id:4, name:"Slim Fit Jeans", description:"Slim jeans", price:80, quantity:0, categoryId:2, image: null },
];


/* -------------------- low-level api fetch -------------------- */
async function apiFetch(url, opts = {}) {
  const headers = new Headers(opts.headers || {});
  if (!(opts.body instanceof FormData) && !headers.get('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('authToken') : null;
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} ${txt}`);
  }
  if (res.status === 204) return null;
  const ct = (res.headers.get('content-type') || '');
  if (ct.includes('application/json')) return await res.json();
  return await res.text();
}

function extractArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data.items && Array.isArray(data.items)) return data.items;
  return [];
}

/* -------------------- main page component -------------------- */
export default function Page() {
  /* UI navigation */
  const [activeSidebar, setActiveSidebar] = useState('Dashboard'); // Dashboard | Products | Statistics | ...
  const [activeTopTab, setActiveTopTab] = useState('Overview'); // Overview, Product List, Inventory Management, ...

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* data states */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  /* modal/form */
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create | edit | view
  const [editing, setEditing] = useState(null);

  /* API detection */
  const [apiAvailable, setApiAvailable] = useState(null);

  const [totalCountAll, setTotalCountAll] = useState(null);
  const [totalValueAll, setTotalValueAll] = useState(null);


/* detect API presence  */
useEffect(() => {
  console.log('API_BASE (client):', API_BASE);
  if (!API_BASE) {
    setApiAvailable(false);
    return;
  }
  let cancelled = false;

  (async () => {
    try {
      let res = await fetch(`${API_BASE}/api/products`, { method: 'HEAD' });

      if (!res || !res.ok) {
        try {
          const h = await fetch(`${API_BASE}/health`, { method: 'GET' });
          res = h;
        } catch (errHealth) {
          try {
            const r3 = await fetch(`${API_BASE}/api/products?page=1&pageSize=1`);
            res = r3;
          } catch (err3) {
            res = null;
          }
        }
      }

      if (!cancelled) {
        setApiAvailable(Boolean(res && res.ok));
      }
    } catch (err) {
      if (!cancelled) setApiAvailable(false);
    }
  })();

  return () => { cancelled = true; };
}, []);



  /* Fetch categories */
  async function fetchCategories(force = false) {
    setFetchError(null);
    const key = 'categories';
    if (!force) {
      const cached = getCache(key);
      if (cached) { setCategories(cached); return cached; }
    }
    if (!API_BASE || apiAvailable === false) {
      setCategories(MOCK_CATEGORIES);
      setCache(key, MOCK_CATEGORIES);
      return MOCK_CATEGORIES;
    }
    try {
      const data = await apiFetch(`${API_BASE}/api/categories`);
      const arr = extractArray(data);
      setCategories(arr);
      setCache(key, arr);
      return arr;
    } catch (e) {
      setFetchError(String(e.message || e));
      setCategories(MOCK_CATEGORIES);
      return MOCK_CATEGORIES;
    }
  }

  /* Fetch products (paged) */
  async function fetchProducts(opts = {}) {
    const force = !!opts.force;
    setLoading(true);
    setFetchError(null);
    const cacheKey = `products:${page}:${pageSize}:${query}:${categoryFilter}`;
    if (!force) {
      const cached = getCache(cacheKey);
      if (cached) { setProducts(cached); setLoading(false); return; }
    }

    if (!API_BASE || apiAvailable === false) {
      const list = MOCK_PRODUCTS.slice();
      const filtered = list.filter(p =>
        (query ? p.name.toLowerCase().includes(query.toLowerCase()) : true) &&
        (categoryFilter === 'all' ? true : String(p.categoryId) === String(categoryFilter))
      );
      const pageItems = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
      setProducts(pageItems);
      setCache(cacheKey, pageItems);
      setLoading(false);
      return;
    }

    try {
      const qStr = query ? `&q=${encodeURIComponent(query)}` : '';
      const catStr = categoryFilter === 'all' ? '' : `&categoryId=${categoryFilter}`;
      const url = `${API_BASE}/api/products?page=${page}&pageSize=${pageSize}${qStr}${catStr}`;
      const data = await apiFetch(url);
      // prefer .items if backend paginates
      const items = extractArray(data);
      setProducts(items);
      setCache(cacheKey, items);
      if (data && typeof data === 'object' && 'total' in data) {
        setTotalCountAll(Number(data.total));
      }
    } catch (e) {
      setFetchError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllForStats(force = false) {
    const key = 'products:all';
    if (!force) {
      const cached = getCache(key);
      if (cached) {
        computeTotalsFromList(cached);
        return;
      }
    }
    if (!API_BASE || apiAvailable === false) {
      // use mock
      setCache(key, MOCK_PRODUCTS);
      computeTotalsFromList(MOCK_PRODUCTS);
      return;
    }
    try {
      const url = `${API_BASE}/api/products?page=1&pageSize=10000`;
      const data = await apiFetch(url);
      const items = extractArray(data);
      setCache(key, items);
      computeTotalsFromList(items);
    } catch (e) {
      // fallback: compute from already loaded products
      computeTotalsFromList(products);
    }
  }

  function computeTotalsFromList(list) {
    const cnt = list.length;
    const value = list.reduce((s, p) => s + Number(p.price || 0) * Number(p.quantity || 0), 0);
    setTotalCountAll(cnt);
    setTotalValueAll(value);
  }

  /* initial loads */
  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchProducts(); }, [page, pageSize, categoryFilter]);
  useEffect(() => { fetchAllForStats(); }, [apiAvailable]);

  /* debounce search */
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchProducts({ force: true }); }, 350);
    return () => clearTimeout(t);
  }, [query]);

  /* -------------------- CRUD actions -------------------- */
  function validateProductPayload(payload) {
    const errors = {};
    if (!payload.name || String(payload.name).trim().length < 2) errors.name = 'Name mínimo 2 caracteres';
    if (payload.price == null || Number(payload.price) < 0) errors.price = 'Preço deve ser >= 0';
    if (!Number.isInteger(Number(payload.quantity)) || Number(payload.quantity) < 0) errors.quantity = 'Quantidade inteira >= 0';
    return errors;
  }

  async function createProduct(payload) {
    const err = validateProductPayload(payload);
    if (Object.keys(err).length) throw new Error(Object.values(err).join('; '));
    if (!API_BASE || apiAvailable === false) {
      const created = { ...payload, id: Date.now() };
      setProducts(prev => [created, ...prev]);
      clearCache();
      await fetchAllForStats(true);
      return created;
    }
    const created = await apiFetch(`${API_BASE}/api/products`, { method: 'POST', body: JSON.stringify(payload) });
    clearCache();
    await fetchProducts({ force: true });
    await fetchAllForStats(true);
    await fetchCategories(true);
    return created;
  }

  async function updateProduct(id, payload) {
    if (!API_BASE || apiAvailable === false) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...payload } : p));
      clearCache();
      await fetchAllForStats(true);
      return;
    }
    await apiFetch(`${API_BASE}/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    clearCache();
    await fetchProducts({ force: true });
    await fetchAllForStats(true);
  }

  async function deleteProduct(id) {
    if (!confirm('Confirmar exclusão?')) return;
    if (!API_BASE || apiAvailable === false) {
      setProducts(prev => prev.filter(p => p.id !== id));
      clearCache();
      await fetchAllForStats(true);
      return;
    }
    await apiFetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
    clearCache();
    await fetchProducts({ force: true });
    await fetchAllForStats(true);
  }

  async function createCategory(name) {
    if (!name || !name.trim()) throw new Error('Nome obrigatório');
    if (!API_BASE || apiAvailable === false) {
      const c = { id: Date.now(), name: name.trim() };
      setCategories(prev => [...prev, c]);
      clearCache();
      return c;
    }
    const created = await apiFetch(`${API_BASE}/api/categories`, { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
    clearCache();
    await fetchCategories(true);
    return created;
  }

  async function deleteCategory(id) {
    if (!confirm('Excluir categoria?')) return;
    if (!API_BASE || apiAvailable === false) {
      setCategories(prev => prev.filter(c => c.id !== id));
      clearCache();
      return;
    }
    await apiFetch(`${API_BASE}/api/categories/${id}`, { method: 'DELETE' });
    clearCache();
    await fetchCategories(true);
    await fetchProducts({ force: true });
  }

  /* stock helpers */
  async function manualUpdateStock(id) {
    const p = products.find(x => String(x.id) === String(id)) || (getCache('products:all') || MOCK_PRODUCTS).find(x => String(x.id) === String(id));
    if (!p) return;
    const nv = prompt(`Nova quantidade para ${p.name}`, String(p.quantity));
    if (nv == null) return;
    const qn = Number(nv);
    if (Number.isNaN(qn) || qn < 0) return alert('Quantidade inválida');
    await updateProduct(id, { quantity: qn });
  }
  async function quickReduce(id) {
    const p = products.find(x => String(x.id) === String(id)) || (getCache('products:all') || MOCK_PRODUCTS).find(x => String(x.id) === String(id));
    if (!p) return;
    await updateProduct(id, { quantity: Math.max(0, Number(p.quantity) - 1) });
  }

  /* -------------------- derived stats -------------------- */
  const totalProducts = useMemo(() => totalCountAll ?? products.length, [totalCountAll, products]);
  const totalValue = useMemo(() => totalValueAll ?? products.reduce((s, p) => s + Number(p.price || 0) * Number(p.quantity || 0), 0), [totalValueAll, products]);
  const lowStock = useMemo(() => {
    const keyAll = getCache('products:all') || (API_BASE && apiAvailable !== false ? [] : MOCK_PRODUCTS);
    const list = keyAll.length ? keyAll : (products.length ? products : MOCK_PRODUCTS);
    return list.filter(p => Number(p.quantity) < 10);
  }, [products, apiAvailable]);

  /* modal open helpers */
  function openCreate() { setEditing(null); setModalMode('create'); setShowModal(true); }
  function openEdit(p) { setEditing(p); setModalMode('edit'); setShowModal(true); }
  function openView(p) { setEditing(p); setModalMode('view'); setShowModal(true); }

  /* Navigation helpers (left menu + top tabs) */
  function handleSidebarClick(name) {
    setActiveSidebar(name);
    if (name === 'Products') setActiveTopTab('Product List');
    else setActiveTopTab('Overview');
    setPage(1);
  }
  function handleTopTabClick(tab) {
    setActiveTopTab(tab);
    if (tab === 'Product List') setActiveSidebar('Products');
    if (tab === 'Inventory Management') setActiveSidebar('Products');
    setPage(1);
  }

  /* Export CSV (complemento leve pedido) */
  function exportCSV(list = products) {
    const rowsToExport = list.length ? list : [];
    if (rowsToExport.length === 0) return alert('No rows to export');
    const headers = ['id', 'name', 'description', 'price', 'quantity', 'categoryId'];
    const csv = [headers.join(',')].concat(
      rowsToExport.map(p => headers.map(h => {
        const v = p[h];
        if (v == null) return '';
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* ---------- UI render helpers ---------- */
  function renderMainContent() {
    if (activeSidebar === 'Products' || activeTopTab === 'Product List' || activeTopTab === 'Inventory Management') {
      if (activeTopTab === 'Inventory Management') {
        return renderInventoryManagement();
      }
      return renderProductsManager();
    }
    return renderOverview();
  }

  function renderOverview() {
    return (
      <>
        <section className="panel-cards">
          <div className="card">
            <div className="card-title">Total Products</div>
            <div className="card-value">{totalProducts}</div>
            <div className="card-sub">Total registered products</div>
          </div>

          <div className="card">
            <div className="card-title">Inventory Value</div>
            <div className="card-value">${Number(totalValue || 0).toFixed(2)}</div>
            <div className="card-sub">Total stock monetary value</div>
          </div>

          <div className="card">
            <div className="card-title">Sales Trends</div>
            <div className="card-value small-graph">
              <svg viewBox="0 0 160 48" width="100%" height="48"><path d="M0 30 C20 20, 40 10, 60 20 C80 30, 100 12, 120 20 C140 28, 160 18" stroke="#A78BFA" strokeWidth="2.5" fill="none" strokeLinecap="round" /></svg>
            </div>
            <div className="card-sub">Trends overview</div>
          </div>

          <div className="card">
            <div className="card-title">Low Stock</div>
            <div className="card-value">{lowStock.length}</div>
            <div className="card-sub">{lowStock.length} products under 10 units</div>
          </div>
        </section>

        <section className="bottom-grid" style={{ marginTop: 12 }}>
          <div className="chart-card">
            <h4>Products by Category</h4>
            <SmallBarChart data={categories.map(c => ({ name: c.name, value: (getCache('products:all') || MOCK_PRODUCTS).filter(p => String(p.categoryId) === String(c.id)).length }))} />
          </div>

          <aside className="aside-card">
            <h4>Low stock (&lt; 10)</h4>
            <ul className="lowstock">
              {lowStock.map(p => <li key={String(p.id)}><span>{p.name}</span><span className="text-red">{p.quantity}</span></li>)}
              {lowStock.length === 0 && <li className="muted">None</li>}
            </ul>
            <div style={{ marginTop: 12 }}>
              <h5>Manage Categories</h5>
              <CategoryManager categories={categories} onCreate={createCategory} onDelete={deleteCategory} />
            </div>
          </aside>
        </section>
      </>
    );
  }

  function renderInventoryManagement() {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3>Inventory Management</h3>
            <div className="muted">Update stock levels and review low stock items</div>
          </div>
          <div>
            <button className="btn" onClick={() => { setQuery(''); setCategoryFilter('all'); fetchProducts({ force: true }); }}>Reset Filters</button>
            <button className="btn btn-primary" onClick={() => { openCreate(); }}>Add Product</button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Product</th><th>Qty</th><th>Min?</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {(getCache('products:all') || MOCK_PRODUCTS).map(p => (
                <tr key={String(p.id)}>
                  <td>{p.name}</td>
                  <td className={Number(p.quantity) < 10 ? 'text-red' : ''}>{p.quantity}</td>
                  <td>{Number(p.quantity) < 10 ? 'Yes' : 'No'}</td>
                  <td className="text-right">
                    <button className="btn-ghost" onClick={() => manualUpdateStock(p.id)}>Update</button>
                    <button className="btn-ghost" onClick={() => quickReduce(p.id)}>-1</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  function renderProductsManager() {
    return (
      <>
        <div className="activities-head">
          <div>
            <h3>Products</h3>
            <div className="muted">Create, edit and manage your products</div>
          </div>

          <div className="controls">
            <input className="search" placeholder="Search product" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
            <select className="select" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
              <option value={10}>Show 10</option>
              <option value={25}>Show 25</option>
              <option value={50}>Show 50</option>
            </select>

            <button className="btn" onClick={() => { clearCache(); fetchProducts({ force: true }); fetchAllForStats(true); }}>Refresh</button>
            <button className="btn" onClick={() => exportCSV(products)}>Export CSV</button>
            <button className="btn btn-primary" onClick={openCreate}>+ Add</button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Qty</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="text-center">Loading...</td></tr>}
              {!loading && fetchError && <tr><td colSpan={5} className="text-center text-red">{fetchError}</td></tr>}
              {!loading && !fetchError && products.length === 0 && <tr><td colSpan={5} className="text-center muted">No products</td></tr>}
              {!loading && !fetchError && products.map(p => (
                <tr key={String(p.id)} className="hover-row">
                  <td>
                    <div className="product-cell">
                      <div className="thumb">
                        <img
                          src={getImageSrc(p, 150)}
                          alt={p.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = placeholderUrlFor({ name: p.name, categoryId: p.categoryId, size: 150 });
                          }}
                        />
                      </div>
                      <div>
                        <div className="prod-name">{p.name}</div>
                        <div className="muted small">{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>{(categories.find(c => String(c.id) === String(p.categoryId)) || {}).name || '—'}</td>
                  <td>${Number(p.price).toFixed(2)}</td>
                  <td className={Number(p.quantity) < 10 ? 'text-red' : ''}>{p.quantity}</td>
                  <td className="text-right">
                    <div className="row-actions">
                      <button className="btn-ghost" title="View" onClick={() => { openView(p); }}>•••</button>
                      <button className="btn-ghost" title="Edit" onClick={() => { openEdit(p); }}>Edit</button>
                      <button className="btn-ghost" title="Update" onClick={() => manualUpdateStock(p.id)}>Update Stock</button>
                      <button className="btn-ghost" title="-1" onClick={() => quickReduce(p.id)}>-1</button>
                      <button className="btn-danger" title="Delete" onClick={() => deleteProduct(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div>Showing {products.length} items</div>
          <div className="pager">
            <button className="btn" disabled={page <= 1} onClick={() => setPage(s => Math.max(1, s - 1))}>Prev</button>
            <button className="btn" onClick={() => setPage(s => s + 1)}>Next</button>
          </div>
        </div>
      </>
    );
  }
const [showApiBanner, setShowApiBanner] = useState(true);
const [fadeOut, setFadeOut] = useState(false);

useEffect(() => {
  if (apiAvailable !== null) {
    setShowApiBanner(true);
    setFadeOut(false);

    const timeout = setTimeout(() => setFadeOut(true), 5000);

    return () => clearTimeout(timeout);
  }
}, [apiAvailable]);


  /* -------------------- main render -------------------- */
  return (
    <div className="page-root">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="logo">HS</div>
            <div>
              <div className="brand-title">Desafio Técnico Hypesoft</div>
              <div className="brand-sub">Inventory</div>
            </div>
          </div>

          <nav className="nav">
            <div className="nav-section">GENERAL</div>
            <ul>
              <li className={`nav-item ${activeSidebar === 'Dashboard' ? 'active' : ''}`} onClick={() => handleSidebarClick('Dashboard')}>Dashboard</li>
              <li className={`nav-item ${activeSidebar === 'Statistics' ? 'active' : ''}`} onClick={() => handleSidebarClick('Statistics')}>Statistics</li>
            </ul>

            <div className="nav-section">SHOP</div>
            <ul>
              <li className={`nav-item ${activeSidebar === 'Products' ? 'active action' : 'action'}`} onClick={() => handleSidebarClick('Products')}>Products</li>
              <li className={`nav-item ${activeSidebar === 'Customers' ? 'active' : ''}`} onClick={() => handleSidebarClick('Customers')}>Customers</li>
              <li className={`nav-item ${activeSidebar === 'Invoice' ? 'active' : ''}`} onClick={() => handleSidebarClick('Invoice')}>Invoice</li>
              <li className="nav-item">Messages <span className="badge">4</span></li>
            </ul>
          </nav>

          <div className="pro-cta">
            <div className="pro-title">Try ShopSense Pro</div>
            <div className="pro-sub">Get Pro and enjoy 20+ features</div>
            <button className="btn btn-primary" onClick={() => alert('Upgrade flow')}>Upgrade Plan</button>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div className="left">
              <div className="selector">UnitedMen ▾</div>
              <ul className="top-tabs">
                {['Overview','Product List','Inventory Management','Sales Performance','Marketing','Customer Feedback'].map(tab => (
                  <li key={tab} className={`tab ${activeTopTab === tab ? 'active' : ''}`} onClick={() => handleTopTabClick(tab)}>{tab}</li>
                ))}
              </ul>
            </div>

            <div className="right">
              <div className="user">
                <div className="user-info">
                  <div className="user-name">Ryan Monsores</div>
                  <div className="user-role">Shop Admin</div>
                </div>
                <div className="user-avatar" title="You">RM</div>
              </div>
            </div>
          </header>

    {/* Banner de status da API com fade-out */}
{showApiBanner && (
  <div
    style={{
      padding: 8,
      background: apiAvailable === false ? '#FEF3F2' : '#F0FDF4',
      color: apiAvailable === false ? '#B91C1C' : '#065F46',
      borderRadius: 6,
      margin: '12px 0',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.8s ease',
    }}
    // Remove do DOM depois do fade
    onTransitionEnd={() => fadeOut && setShowApiBanner(false)}
  >
    {apiAvailable === false
      ? 'API não disponível — usando mock data.'
      : apiAvailable === true
      ? 'Conectado à API.'
      : 'Detectando API...'}
  </div>
)}



          {/* central content changes based on activeSidebar/activeTopTab */}
          <section style={{ marginTop: 12 }}>
            {renderMainContent()}
          </section>

        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <ProductForm
            mode={modalMode}
            initial={editing}
            categories={categories}
            onCancel={() => setShowModal(false)}
            onCreate={async (payload) => {
              try {
                await createProduct(payload);
                setShowModal(false);
              } catch (e) {
                alert(String(e.message || e));
              }
            }}
            onUpdate={async (id, payload) => {
              try {
                await updateProduct(id, payload);
                setShowModal(false);
              } catch (e) {
                alert(String(e.message || e));
              }
            }}
          />
        </Modal>
      )}

      {/* minimal styles inline to keep file self-contained (you can move to CSS) */}
      <style jsx>{`
        .page-root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 24px; }
        .app-shell { display:flex; gap:16px; max-width:1280px; margin:0 auto; }
        .sidebar { width:260px; background:#fff; border-radius:12px; padding:18px; box-shadow:0 8px 24px rgba(15,23,42,0.06); }
        .main { flex:1; background:transparent; }
        .brand { display:flex; gap:10px; align-items:center; margin-bottom:12px; }
        .logo { width:44px; height:44px; border-radius:8px; background:linear-gradient(135deg,#7c3aed,#06b6d4); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; }
        .nav-section { font-size:11px; color:#6b7280; margin-top:12px; margin-bottom:8px; letter-spacing:0.08em; }
        .nav ul { list-style:none; padding:0; margin:0; }
        .nav-item { padding:8px 10px; border-radius:8px; cursor:pointer; margin-bottom:6px; color:#374151; }
        .nav-item.action { background:transparent; }
        .nav-item.active { background:#f3e8ff; color:#6d28d9; font-weight:600; }
        .pro-cta { margin-top:14px; padding:12px; border-radius:8px; background:linear-gradient(90deg,#7c3aed,#06b6d4); color:#fff; text-align:center; }
        .btn { padding:8px 10px; border-radius:8px; border:1px solid #e6e9f2; background:#fff; cursor:pointer; margin-left:6px; }
        .btn-primary { background:#7c3aed; color:#fff; border:0; }
        .btn-ghost { background:transparent; border:1px solid transparent; cursor:pointer; }
        .btn-danger { background:transparent; color:#b91c1c; border:1px solid transparent; }
        .topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .top-tabs { display:flex; gap:8px; margin-left:12px; list-style:none; padding:0; }
        .tab { padding:6px 10px; border-radius:999px; cursor:pointer; color:#374151; }
        .tab.active { background:#f8fafc; color:#7c3aed; font-weight:600; }
        .panel-cards { display:grid; grid-template-columns: repeat(4,1fr); gap:12px; }
        .card { background:#fff; border-radius:10px; padding:12px; box-shadow:0 6px 18px rgba(15,23,42,0.03); }
        .card-title { font-size:12px; color:#6b7280; }
        .card-value { font-size:20px; font-weight:700; margin-top:6px; }
        .card-sub { font-size:12px; color:#9ca3af; margin-top:8px; }
        .bottom-grid { display:grid; grid-template-columns: 1fr 320px; gap:12px; }
        .chart-card { background:#fff; padding:12px; border-radius:10px; }
        .aside-card { background:#fff; padding:12px; border-radius:10px; }
        .lowstock { list-style:none; padding:0; margin:0; }
        .lowstock li { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dashed #f3f4f6; }
        .muted { color:#6b7280; }
        .text-red { color:#b91c1c; }
        .activities-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
        .controls { display:flex; gap:8px; align-items:center; }
        .search { padding:8px 10px; border-radius:8px; border:1px solid #e6e9f2; }
        .select { padding:8px 10px; border-radius:8px; border:1px solid #e6e9f2; }
        .table-wrap { background:#fff; border-radius:10px; padding:8px; box-shadow:0 6px 18px rgba(15,23,42,0.03); }
        .table { width:100%; border-collapse:collapse; }
        .table th { text-align:left; padding:10px; font-size:13px; color:#6b7280; border-bottom:1px solid #f3f4f6; }
        .table td { padding:10px; vertical-align:middle; }
        .product-cell { display:flex; gap:12px; align-items:center; }
        .thumb img { width:64px; height:64px; object-fit:cover; border-radius:8px; }
        .prod-name { font-weight:600; }
        .row-actions { display:flex; gap:6px; justify-content:flex-end; }
        .table-footer { display:flex; justify-content:space-between; align-items:center; margin-top:8px; color:#6b7280; }
        .pager button { margin-left:8px; }
        .modal-root { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; z-index:60; }
        .modal-backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.4); }
        .modal-body { position:relative; z-index:61; width:100%; max-width:720px; }
        .modal-content { background:#fff; border-radius:12px; padding:18px; box-shadow:0 12px 40px rgba(2,6,23,0.2); }
        .product-form .form-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        .product-form label { display:block; }
        .label { font-size:12px; color:#6b7280; margin-bottom:6px; }
        .product-form input, .product-form select, .product-form textarea { width:100%; padding:8px 10px; border:1px solid #e6e9f2; border-radius:8px; }
        .form-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }
        .cat-form { display:flex; gap:8px; margin-bottom:8px; }
        .cat-list { list-style:none; padding:0; margin:0; }
        .small-graph svg { display:block; }
        .hover-row:hover { background:#fafafa; }
      `}</style>
    </div>
  );
}

/* -------------------- small components -------------------- */

function Modal({ children, onClose }) {
  return (
    <div className="modal-root" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-body">
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}

function ProductForm({ mode = 'create', initial = null, categories = [], onCancel, onCreate, onUpdate }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [quantity, setQuantity] = useState(initial?.quantity ?? 0);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? 'null');
  const [image, setImage] = useState(initial?.image || placeholderUrlFor({ name: initial?.name || 'Produto', categoryId: initial?.categoryId, size: 150 }));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
    setName(initial?.name || '');
    setDescription(initial?.description || '');
    setPrice(initial?.price ?? 0);
    setQuantity(initial?.quantity ?? 0);
    setCategoryId(initial?.categoryId ?? 'null');
    setImage(initial?.image || placeholderUrlFor({ name: initial?.name || 'Produto', categoryId: initial?.categoryId, size: 150 }));
  }, [initial]);

  const submit = async (e) => {
    e?.preventDefault();
    const v = {};
    if (!name || name.trim().length < 2) v.name = 'Name min 2 chars';
    if (price == null || Number(price) < 0) v.price = 'Price >= 0';
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) v.quantity = 'Quantity integer >= 0';
    if (Object.keys(v).length) { setErrors(v); return; }
    const payload = { name: name.trim(), description, price: Number(price), quantity: Number(quantity), categoryId: categoryId === 'null' ? null : categoryId, image };
    try {
      if (mode === 'create') await onCreate(payload);
      else if (mode === 'edit' && initial) await onUpdate(initial.id, payload);
    } catch (err) {
      alert(String(err.message || err));
    }
  };

  return (
    <form onSubmit={submit} className="product-form">
      <div className="form-head" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <h3>{mode === 'create' ? 'Create Product' : mode === 'edit' ? 'Edit Product' : 'View Product'}</h3>
        <button type="button" className="btn-ghost" onClick={onCancel}>Close</button>
      </div>

      <div className="form-grid">
        <label>
          <div className="label">Name</div>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <div className="field-error" style={{ color:'#b91c1c' }}>{errors.name}</div>}
        </label>

        <label>
          <div className="label">Price</div>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          {errors.price && <div className="field-error" style={{ color:'#b91c1c' }}>{errors.price}</div>}
        </label>

        <label>
          <div className="label">Quantity</div>
          <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          {errors.quantity && <div className="field-error" style={{ color:'#b91c1c' }}>{errors.quantity}</div>}
        </label>

        <label>
          <div className="label">Category</div>
          <select value={String(categoryId)} onChange={(e) => setCategoryId(e.target.value === 'null' ? 'null' : (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)))}>
            <option value="null">No category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>

        <label className="full">
          <div className="label">Description</div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>

        <label className="full">
          <div className="label">Image URL</div>
          <input value={image} onChange={(e) => setImage(e.target.value)} />
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">{mode === 'create' ? 'Create' : 'Save'}</button>
      </div>
    </form>
  );
}

function CategoryManager({ categories = [], onCreate, onDelete }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const add = async (e) => {
    e?.preventDefault();
    if (!name.trim()) return alert('Nome requerido');
    setLoading(true);
    try {
      await onCreate(name.trim());
      setName('');
    } catch (err) {
      alert(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={add} className="cat-form">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category" />
        <button className="btn btn-primary" disabled={loading}>{loading ? '...' : 'Add'}</button>
      </form>

      <ul className="cat-list">
        {categories.map(c => (
          <li key={c.id}><span>{c.name}</span><button className="btn-ghost text-red" onClick={() => onDelete(c.id)}>Delete</button></li>
        ))}
        {categories.length === 0 && <li className="muted">No categories</li>}
      </ul>
    </div>
  );
}

function SmallBarChart({ data = [] }) {
  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0) || 1;
  const width = 600, height = 160, padding = 16;
  const barWidth = Math.max(24, (width - padding * 2) / Math.max(1, data.length));
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="small-chart" role="img" aria-label="Products by category">
      {data.map((d, i) => {
        const h = (Number(d.value) / total) * (height - 40);
        const x = padding + i * barWidth;
        const y = height - h - 20;
        return (
          <g key={d.name}>
            <rect x={x} y={y} width={barWidth * 0.6} height={h} rx={6} fill="#7c3aed" />
            <text x={x + barWidth * 0.3} y={height - 4} fontSize={11} fill="#374151" textAnchor="middle">{d.name}</text>
          </g>
        );
      })}
    </svg>
  );
}
