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
  }, []);

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
      </div>
    </div>
  );
}
