import React, { useEffect, useMemo, useState } from 'react';
import './AdminUsers.css';

const API = 'http://localhost:8080/api/v1';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Load users from backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/getusers`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const json = await res.json();
        // normalize id into a single `id` field for the UI
        const normalized = (Array.isArray(json) ? json : []).map((u) => {
          const id = String(u?._id ?? u?.id ?? u?.userId ?? u?.userid ?? u?.user_id ?? u?.uid ?? '').trim() || null;
          return { ...u, id };
        });
        // debug: show fetched users (open console to inspect)
        // eslint-disable-next-line no-console
        console.log('AdminUsers: fetched users', normalized);
        setUsers(normalized);
      } catch (err) {
        console.error(err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter users by search query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      );
    });
  }, [users, query]);

  // Safely get user ID — accepts a user object or a raw id string/number
  // Try common id fields: _id, id, userId, userid, user_id, uid
  const getUserId = (u) => {
    if (u == null) return '';
    if (typeof u === 'string' || typeof u === 'number') return String(u).trim();
    const candidate = u?._id ?? u?.id ?? u?.userId ?? u?.userid ?? u?.user_id ?? u?.uid ?? '';
    return String(candidate).trim();
  };

  // Handle user deletion. Accepts either a user object or an id.
  const handleDelete = async (target) => {
    const id = getUserId(target);
    if (!id) {
      alert('User id not found');
      return;
    }
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;

    const enc = encodeURIComponent(id);
    const urlWithId = `${API}/deleteuser/${enc}`;

    // Try different deletion strategies to match backend expectation
    try {
      setDeletingId(id);

      // 1) Preferred: URL-based DELETE
      // eslint-disable-next-line no-console
      console.log('Attempting DELETE', urlWithId);
      let res = await fetch(urlWithId, { method: 'DELETE' });

      // 2) Fallback: DELETE to /deleteuser with JSON body { id }
      if (!res || !res.ok) {
        // eslint-disable-next-line no-console
        console.log('Fallback: DELETE with JSON body to /deleteuser');
        res = await fetch(`${API}/deleteuser`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      }

      // 3) Final fallback: POST to /deleteuser with JSON body { id }
      if (!res || !res.ok) {
        // eslint-disable-next-line no-console
        console.log('Fallback: POST to /deleteuser with JSON body');
        res = await fetch(`${API}/deleteuser`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      }

      if (!res) throw new Error('Network error while deleting');
      if (!res.ok) {
        const t = await res.text().catch(() => null);
        throw new Error(t || `Delete failed (${res.status})`);
      }

      // success
      setUsers((s) => s.filter((user) => getUserId(user) !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete user: ' + (err.message || err));
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <div className="admin-users-root">
      <header className="admin-users-hero">
        <div>
          <h2>Users</h2>
          <p className="muted">All registered users in the system</p>
        </div>
        <div className="actions">
          <input
            className="users-search"
            placeholder="Search by name, email or role"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <section className="users-list">
        {loading && <div className="notice">Loading users...</div>}
        {error && <div className="notice error">{error}</div>}
        {!loading && filtered.length === 0 && <div className="notice">No users found.</div>}

        {filtered.length > 0 && (
          <div className="table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr key={getUserId(u) || idx}>
                    <td className="idx">{idx + 1}</td>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name || 'U'} />
                          ) : (
                            <div className="initial">{(u.name || 'U').charAt(0).toUpperCase()}</div>
                          )}
                        </div>
                        <div className="user-meta">
                          <div className="name">{u.name ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="email-col">{u.email ?? '—'}</td>
                    <td>
                      <span className={`role-badge ${((u.role || 'user') + '').toLowerCase()}`}>
                        {(u.role || 'user').toString()}
                      </span>
                    </td>
                    <td className="user-actions">
                      <button
                        className="btn danger small action-btn"
                        onClick={() => handleDelete(u)}
                        disabled={deletingId === getUserId(u)}
                      >
                        {deletingId === getUserId(u) ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
