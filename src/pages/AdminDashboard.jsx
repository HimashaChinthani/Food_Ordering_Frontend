import React, { useEffect, useMemo, useState } from 'react';
import './AdminDashboard.css';
import SAMPLE from '../data/sampleProducts';

const STORAGE_KEY = 'products';

function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE.slice();
    return JSON.parse(raw);
  } catch (e) {
    return SAMPLE.slice();
  }
}

function saveProducts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function AdminDashboard() {
  const [products, setProducts] = useState(() => loadProducts());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});
  const [members] = useState(1284); // demo

  useEffect(() => saveProducts(products), [products]);

  const revenue = useMemo(() => products.reduce((s, p) => s + ((p.price || 0) * (p.sold || 0)), 0), [products]);

  const handleSave = (e) => {
    e.preventDefault();
    // edit existing
    if (form && form.id) {
      setProducts(prev => prev.map(it => it.id === form.id ? ({ ...it, ...form, price: Number(form.price || it.price) }) : it));
      setForm({});
      setShowAdd(false);
      return;
    }

    const next = {
      id: 'p_' + Date.now(),
      name: form.name || 'New Item',
      description: form.description || '',
      price: Number(form.price) || 0,
      category: form.category || 'UNCATEGORIZED',
      image: form.image || 'https://source.unsplash.com/800x600/?food',
      sold: 0,
    };
    setProducts(p => [next, ...p]);
    setForm({});
    setShowAdd(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this item?')) return;
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="admin-root">
      <header className="admin-hero">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="muted">Manage members, revenue and menu items</p>
        </div>
        <div className="admin-stats">
          <div className="stat"><div className="value">{members}</div><div className="label">Members</div></div>
          <div className="stat"><div className="value">${revenue.toFixed(2)}</div><div className="label">Revenue</div></div>
          <div className="stat"><div className="value">{products.length}</div><div className="label">Menu Items</div></div>
        </div>
        <div className="actions"><button className="btn primary" onClick={() => { setForm({}); setShowAdd(true); }}>Add Menu Item</button></div>
      </header>

      <section className="admin-list">
        <h3>Menu Items</h3>
        <div className="items-grid">
          {products.map(p => (
            <div className="item-card" key={p.id}>
              <img src={p.image} alt={p.name} />
              <div className="item-body">
                <div className="title-row"><strong>{p.name}</strong><span className="price">${(p.price||0).toFixed(2)}</span></div>
                <div className="desc">{p.description}</div>
                <div className="meta">{p.category} · Sold: {p.sold||0}</div>
                <div className="card-actions">
                  <button className="btn small" onClick={() => { setForm(p); setShowAdd(true); }}>Edit</button>
                  <button className="btn danger small" onClick={() => handleDelete(p.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>{form && form.id ? 'Edit Menu Item' : 'Add Menu Item'}</h4>
            <form className="admin-form" onSubmit={handleSave}>
              <input placeholder="Name" value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
              <input placeholder="Category" value={form.category||''} onChange={e=>setForm(f=>({...f,category:e.target.value}))} />
              <input placeholder="Price" type="number" step="0.01" value={form.price||''} onChange={e=>setForm(f=>({...f,price:e.target.value}))} />

              <label className="small">Image (choose file from your computer)</label>
              <input type="file" accept="image/*" onChange={ev=>{
                const f = ev.target.files && ev.target.files[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = (evt) => setForm(prev=>({...prev,image:evt.target.result}));
                reader.readAsDataURL(f);
              }} />
              {form.image && <img src={form.image} alt="preview" style={{maxWidth:160,borderRadius:8,marginTop:8}} />}

              <textarea placeholder="Description" value={form.description||''} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
              <div className="modal-actions">
                <button type="button" className="btn outline" onClick={()=>{setShowAdd(false); setForm({});}}>Cancel</button>
                <button type="submit" className="btn primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
