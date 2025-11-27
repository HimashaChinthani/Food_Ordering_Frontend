import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const API = 'http://localhost:8080/api/v1';

function resolveId(u) {
  if (!u) return null;
  return String(u.id ?? u._id ?? u.userId ?? u.userid ?? '').trim() || null;
}

export default function Profile() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    const u = JSON.parse(raw);
    setUser(u);
    setForm({
      name: u.name || '',
      email: u.email || '',
      phoneNumber: u.phoneNumber || u.phone || '',
      address: u.address || '',
      password: '',
      avatar: u.avatar || '',
      role: u.role || 'user',
    });
    setAvatarPreview(u.avatar || null);
    // fetch orders for this user
    fetchOrders(u).catch(() => {});
  }, []);

  async function fetchOrders(u) {
    if (!u) return;
    const email = u.email || '';
    if (!email) return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const url = `http://localhost:8082/api/v3/getordersms?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Server returned ${res.status}: ${txt}`);
      }
      const data = await res.json();
      // Expecting an array of orders for this user
      const arr = Array.isArray(data) ? data : (data.orders || [data]);
      setOrders(arr);
    } catch (err) {
      console.error('Failed to fetch orders', err);
      setOrdersError('Failed to load orders: ' + (err.message || ''));
    } finally {
      setOrdersLoading(false);
    }
  }

  const handleChange = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  const handleAvatar = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
      setForm((s) => ({ ...s, avatar: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const updateLocalUser = (newUser) => {
    const raw = localStorage.getItem('user');
    const cur = raw ? JSON.parse(raw) : {};
    const merged = { ...cur, ...newUser };
    localStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    const id = resolveId(user);
    if (!id) return alert('User id not found');

    const payload = {
      id,
      name: form.name,
      phoneNumber: form.phoneNumber,
      address: form.address,
      avatar: form.avatar,
    };
    if (form.password) payload.password = form.password;

    setSaving(true);
    try {
      const res = await fetch(`${API}/updateuser`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update user');

      const data = await res.json();
      updateLocalUser(data);
      alert('Profile updated successfully');
      setForm((s) => ({ ...s, password: '' }));
    } catch (err) {
      console.error(err);
      alert('Failed to update profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    const id = resolveId(user);
    if (!id) return alert('User id not found');
    if (!window.confirm('Delete your account permanently?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API}/deleteuser/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete account');

      localStorage.removeItem('user');
      alert('Account deleted successfully');
      nav('/login');
    } catch (err) {
      console.error(err);
      alert('Failed to delete account: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return <div className="profile-root"><p>Please login to view profile.</p></div>;

  return (
    <div className="profile-root">
      <div className="profile-card">
        <div className="profile-media">
          <div className="avatar-large">
            {avatarPreview ? <img src={avatarPreview} alt="avatar" /> : <div className="initial">{(user.name||'U')[0].toUpperCase()}</div>}
          </div>
          <div className="meta">
            <h2>{user.name}</h2>
            <div className={`role-badge ${((user.role||'user')+'').toLowerCase()}`}>{user.role}</div>
            <div className="email">{user.email}</div>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <label>Name</label>
          <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />

          <label>Email (read-only)</label>
          <input value={form.email} readOnly />

          <label>Phone</label>
          <input value={form.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} />

          <label>Address</label>
          <input value={form.address} onChange={(e) => handleChange('address', e.target.value)} />

          <label>New Password (leave blank to keep)</label>
          <input type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} />

          <label>Avatar</label>
          <input type="file" accept="image/*" onChange={(e) => handleAvatar(e.target.files[0])} />

          <div className="form-actions">
            <button type="button" className="btn outline" onClick={() => {
              setForm({ name: user.name, email: user.email, phoneNumber: user.phoneNumber, address: user.address, password: '', avatar: user.avatar, role: user.role });
              setAvatarPreview(user.avatar);
            }}>Reset</button>
            <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>

        <div className="danger-zone">
          <h4>Danger Zone</h4>
          <p>Delete your account permanently.</p>
          <button className="btn danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete Account'}</button>
        </div>
        <div className="orders-section">
          <h3>My Orders</h3>
          <div style={{ marginBottom: 10 }}>
            <button className="btn outline" onClick={() => fetchOrders(user)} disabled={ordersLoading}>{ordersLoading ? 'Refreshing...' : 'Refresh'}</button>
          </div>
          {ordersLoading ? <p>Loading orders...</p> : null}
          {ordersError ? <p style={{ color: 'var(--danger)' }}>{ordersError}</p> : null}
          {orders && orders.length === 0 && !ordersLoading ? <p>No orders yet.</p> : null}
          <div className="orders-list">
            {orders.map((o) => (
              <div key={o.orderId || o.id || o._id || Math.random()} className="order-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><strong>Order:</strong> {o.orderId ?? o.id ?? ''}</div>
                  <div><strong>{new Date(o.orderDate || o.createdAt || Date.now()).toLocaleString()}</strong></div>
                </div>
                <div style={{ marginTop: 8 }}><strong>Status:</strong> {o.status}</div>
                <div style={{ marginTop: 8 }}><strong>Total:</strong> ₨{o.totalAmount}</div>
                <div style={{ marginTop: 8 }}>
                  <strong>Items:</strong>
                  <ul>
                    {(() => {
                      try {
                        const items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
                        return items.map((it, i) => <li key={i}>{it.name || it.title || it.id} x {it.qty || 1} — ₨{it.price ?? it.amount ?? 0}</li>);
                      } catch (e) {
                        return <li>{String(o.items)}</li>;
                      }
                    })()}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
