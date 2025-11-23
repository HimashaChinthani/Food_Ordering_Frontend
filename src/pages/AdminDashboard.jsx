import React, { useEffect, useMemo, useState } from 'react';
import './AdminDashboard.css';
import SAMPLE from '../data/sampleProducts';

const STORAGE_KEY = 'products';

// Load products from backend OR local sample
function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE.slice();
    return JSON.parse(raw);
  } catch (e) {
    return SAMPLE.slice();
  }
}

// Save to localStorage
function saveProducts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function AdminDashboard() {
  const [products, setProducts] = useState(() => loadProducts());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});
  const [members] = useState(1284); // demo

  useEffect(() => saveProducts(products), [products]);

  const revenue = useMemo(
    () => products.reduce((s, p) => s + ((p.price || 0) * (p.sold || 0)), 0),
    [products]
  );

  // Backend Add / Edit Menu Item
  const handleSave = async (e) => {
    e.preventDefault();

    // Convert dataURL to Base64 without prefix
    let imageBase64 = form.image || null;
    if (imageBase64 && imageBase64.includes(',')) {
      imageBase64 = imageBase64.split(',')[1];
    }

    const menuItem = {
      id: form.id || null,
      name: form.name,
      category: form.category,
      description: form.description,
      price: Number(form.price),
      image: imageBase64, // proper base64 string for LONGBLOB
      sold: form.sold || 0,
      available: true, // always available
    };

    try {
      const response = await fetch("http://localhost:8081/api/v2/addmenu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(menuItem),
      });

      if (!response.ok) throw new Error("Failed to save menu item");

      const saved = await response.json();

      if (form.id) {
        setProducts(prev => prev.map(p => p.id === form.id ? saved : p));
      } else {
        setProducts(prev => [saved, ...prev]);
      }

      alert("Menu item saved successfully!");
      setForm({});
      setShowAdd(false);
    } catch (err) {
      console.error("Error saving menu item:", err);
      alert("Error saving menu item");
    }
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

        <div className="actions">
          <button className="btn primary" onClick={() => { setForm({}); setShowAdd(true); }}>Add Menu Item</button>
        </div>
      </header>

      <section className="admin-list">
        <h3>Menu Items</h3>
        <div className="items-grid">
          {products.map(p => (
            <div className="item-card" key={p.id}>
              {p.image && <img src={`data:image/png;base64,${p.image}`} alt={p.name} />}
              <div className="item-body">
                <div className="title-row">
                  <strong>{p.name}</strong>
                  <span className="price">${(p.price || 0).toFixed(2)}</span>
                </div>

                <div className="desc">{p.description}</div>
                <div className="meta">{p.category} · Sold: {p.sold || 0}</div>

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
            <h4>{form.id ? 'Edit Menu Item' : 'Add Menu Item'}</h4>

            <form className="admin-form" onSubmit={handleSave}>
              <input
                placeholder="Name"
                value={form.name || ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />

              {/* Category Dropdown */}
              <select
                value={form.category || 'PIZZA'}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                required
              >
                <option value="PIZZA">Pizza</option>
                <option value="BURGER">Burger</option>
                <option value="DRINKS">Drinks</option>
                <option value="DESSERT">Dessert</option>
                <option value="SNACKS">Snacks</option>
              </select>

              <input
                placeholder="Price"
                type="number"
                step="0.01"
                value={form.price || ''}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                required
              />

              <label className="small">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(ev) => {
                  const file = ev.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = (event) =>
                    setForm(prev => ({ ...prev, image: event.target.result }));
                  reader.readAsDataURL(file);
                }}
                required={!form.image}
              />

              {form.image && (
                <img
                  src={form.image}
                  alt="preview"
                  style={{ maxWidth: 160, borderRadius: 8, marginTop: 8 }}
                />
              )}

              <textarea
                placeholder="Description"
                value={form.description || ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />

              <div className="modal-actions">
                <button type="button" className="btn outline" onClick={() => { setShowAdd(false); setForm({}); }}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
