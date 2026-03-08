// AdminDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import "./AdminDashboard.css";
import "./AddItemModal.css";

const API = "http://localhost:8081/api/v2";
const ORD_API = "http://localhost:8082/api/v3";

export default function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [pendingOrders, setPendingOrders] = useState(0);

  // Form State
  const [form, setForm] = useState({
    id: null,
    name: "",
    category: "PIZZA",
    price: "",
    description: "",
    image: null,
    quantity: 0,
  });

  // Calculate revenue
  // Revenue calculated from completed orders (fetched from orders API)
  const [orderRevenue, setOrderRevenue] = useState(0);

  const loadOrdersRevenue = async () => {
    try {
      const res = await fetch(`${ORD_API}/getorders`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.orders || (data.data && Array.isArray(data.data) ? data.data : []));

      const sum = arr.reduce((s, o) => {
        const status = (o.status || o.order_status || '').toString().toLowerCase();
        if (!status.includes('completed' && 'assigned')) return s;
        const t = parseFloat(o.totalAmount || o.total || o.price || 0) || 0;
        return s + t;
      }, 0);

      setOrderRevenue(sum);
    } catch (err) {
      console.warn('Failed to load order revenue', err);
      setOrderRevenue(0);
    }
  };

  // Load all menu items
  const loadItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/getmenu`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();

      // normalize id field so frontend always has `id`
      const normalized = Array.isArray(json)
        ? json.map((p) => ({
            ...p,
            id: p.id ?? p._id ?? p.menuid ?? p.menuId ?? null,
          }))
        : [];

      setItems(normalized);
    } catch (err) {
      setError("Failed to load items");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    loadPendingOrdersCount();
    loadOrdersRevenue();
  }, []);

  async function loadPendingOrdersCount() {
    try {
      const res = await fetch(`${ORD_API}/getorders`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.orders || (data.data && Array.isArray(data.data) ? data.data : []));
      const count = arr.reduce((c, o) => c + ((String(o.status || '').toLowerCase() === 'pending') ? 1 : 0), 0);
      setPendingOrders(count);
    } catch (err) {
      console.warn('Could not load pending orders count', err);
      setPendingOrders(0);
    }
  }

  // Save (Add or Update)
  const handleSave = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.price ||
      !form.category ||
      !form.description ||
      !form.image
    ) {
      alert("All fields are required.");
      return;
    }

    if (Number(form.quantity) <= 0) {
      alert("Available quantity must be greater than 0.");
      return;
    }

    if (isNaN(form.price)) {
      alert("Price must be a number.");
      return;
    }

    let img = form.image;
    if (img?.startsWith("data:")) {
      img = img.split(",")[1]; // convert to pure base64
    }

    const payload = {
      id: form.id,
      name: form.name,
      category: form.category,
      description: form.description,
      price: Number(form.price),
      image: img,
      quantity: Number(form.quantity) || 0,
    };

    // include common alternate id keys the backend might expect
    if (form.id) {
      payload._id = form.id;
      payload.menuid = form.id;
      payload.menuId = form.id;
    }

    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `${API}/updatemenu` : `${API}/addmenu`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");
      await loadItems();
      // refresh pending orders count after save
      try { await loadPendingOrdersCount(); } catch(e){}
      alert("Saved successfully!");
      setShowForm(false);
      setForm({ id: null, name: "", category: "PIZZA", price: "", description: "", image: null, quantity: 0 });
    } catch (err) {
      alert("Save failed");
      console.log(err);
    }
  };

  // Delete item
  const handleDelete = async (id) => {
    if (!id) {
      alert("Item id not found. Cannot delete.");
      return;
    }

    if (!window.confirm("Delete this item?")) return;

    try {
      const res = await fetch(`${API}/deletmenu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await loadItems();
      // refresh pending orders count after delete
      try { await loadPendingOrdersCount(); } catch(e){}
    } catch (err) {
      alert("Delete failed");
      console.log(err);
    }
  };

  // Convert image to renderable
  const displayImage = (img) => {
    if (!img) return null;
    if (img.startsWith("data:")) return img;
    return `data:image/png;base64,${img}`;
  };

  // helper to get the item's id from different possible keys
  const getItemId = (p) => p?.id ?? p?._id ?? p?.menuid ?? p?.menuId ?? null;

  return (
    <div className="admin-root">
      <header className="admin-hero">
        <h2>Admin Dashboard</h2>

        <div className="admin-stats">
          <div className="stat items">
            <div className="value"><b>{items.length}</b></div>
            <div className="label">Menu Items</div>
          </div>
          <div className="stat pending">
            <div className="value">{pendingOrders}</div>
            <div className="label">Pending Orders</div>
          </div>
          <div className="stat">
            <div className="value revenue-value"><b>₨{orderRevenue.toFixed(2)}</b></div>
            <div className="label">Revenue</div>
          </div>
        </div>

        <button
          className="btn primary"
          onClick={() => {
            setForm({ id: null, name: "", category: "PIZZA", price: "", description: "", image: null, quantity: 0 });
            setShowForm(true);
          }}
        >
          Add Item
        </button>
      </header>

      <section className="admin-list">
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && items.length === 0 && <p>No items found.</p>}

        <div className="items-grid">
          {items.map((p) => (
            <div className="item-card" key={getItemId(p) || p.name}>
              {p.image ? (
                <img src={displayImage(p.image)} alt="menu" />
              ) : (
                <div className="no-img">No Image</div>
              )}

              <h4>{p.name}</h4>
              <p>{p.description}</p>
              <p>
                <b>₨{Number(p.price || 0).toFixed(2)}</b> | {p.category}
              </p>

              <div className="card-actions">
                <button
                  className="btn small"
                  onClick={() => {
                    setForm({
                      ...p,
                      id: getItemId(p),
                      image: p.image ? displayImage(p.image) : null,
                      quantity: p.quantity ?? p.qty ?? 0,
                    });
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>

                <button
                  className="btn danger small"
                  onClick={() => handleDelete(getItemId(p))}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showForm && (
        <div className="modal-overlay">
          <div className="add-item-modal">
            <div className="modal-header">
              <h3>{form.id ? "Edit Item" : "Add Item"}</h3>
              <span>Available: {form.quantity || 0}</span>
              <button onClick={() => setShowForm(false)} className="close-button">
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">NAME</label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="category">CATEGORY</label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    <option value="PIZZA">Pizza</option>
                    <option value="BURGER">Burger</option>
                    <option value="DRINKS">Drinks</option>
                    <option value="SNACKS">Snacks</option>
                    <option value="DESSERT">Dessert</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="price">PRICE</label>
                  <input
                    type="text"
                    id="price"
                    placeholder="Price"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="quantity">AVAILABLE QUANTITY</label>
                  <input
                    type="number"
                    id="quantity"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="image">IMAGE</label>
                  <input
                    type="file"
                    id="image"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setForm({ ...form, image: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {form.image ? (
                    <img src={form.image} alt="Preview" className="image-preview" />
                  ) : (
                    <p>No image selected</p>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="description">DESCRIPTION</label>
                  <textarea
                    id="description"
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="cancel-button">
                Cancel
              </button>
              <button onClick={handleSave} className="save-button">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}