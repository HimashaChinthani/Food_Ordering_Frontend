// AdminDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import "./AdminDashboard.css";

const API = "http://localhost:8081/api/v2";

export default function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [form, setForm] = useState({
    id: null,
    name: "",
    category: "PIZZA",
    price: "",
    description: "",
    image: null,
  });

  // Calculate revenue
  const revenue = useMemo(
    () =>
      items.reduce(
        (s, p) => s + (Number(p.price || 0) * Number(p.sold || 0)),
        0
      ),
    [items]
  );

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
  }, []);

  // Save (Add or Update)
  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.name || !form.price) {
      alert("Name & Price required");
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
      alert("Saved successfully!");
      setShowForm(false);
      setForm({});
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
          <div className="stat">
            <div className="value">{items.length}</div>
            <div className="label">Menu Items</div>
          </div>
          <div className="stat">
            <div className="value">${revenue.toFixed(2)}</div>
            <div className="label">Revenue</div>
          </div>
        </div>

        <button
          className="btn primary"
          onClick={() => {
            setForm({ id: null });
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
                <b>${p.price}</b> | {p.category}
              </p>

              <div className="card-actions">
                <button
                  className="btn small"
                  onClick={() => {
                    setForm({
                      ...p,
                      id: getItemId(p),
                      image: p.image ? displayImage(p.image) : null,
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
          <div className="modal">
            <h3>{form.id ? "Edit Item" : "Add Item"}</h3>

            <form onSubmit={handleSave}>
              <input
                type="text"
                placeholder="Name"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <select
                value={form.category || "PIZZA"}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="PIZZA">Pizza</option>
                <option value="BURGER">Burger</option>
                <option value="DRINKS">Drinks</option>
                <option value="SNACKS">Snacks</option>
                <option value="DESSERT">Dessert</option>
              </select>

              <input
                type="number"
                placeholder="Price"
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) =>
                    setForm({ ...form, image: evt.target.result });
                  reader.readAsDataURL(file);
                }}
              />

              {form.image && (
                <img
                  src={form.image}
                  alt="preview"
                  style={{ width: 120, marginTop: 10 }}
                />
              )}

              <textarea
                placeholder="Description"
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button className="btn primary" type="submit">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
