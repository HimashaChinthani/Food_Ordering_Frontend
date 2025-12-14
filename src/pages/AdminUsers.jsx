import React, { useEffect, useMemo, useState } from 'react';
import './AdminUsers.css';

const API = 'http://localhost:8080/api/v1';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driversError, setDriversError] = useState(null);
  const [driverDeletingId, setDriverDeletingId] = useState(null);
  const initialDriverForm = {
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    vehicleNumber: '',
    vehicleType: '',
    status: 'AVAILABLE',
  };
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverForm, setDriverForm] = useState(initialDriverForm);
  const [driverSaving, setDriverSaving] = useState(false);
  const [driverFeedback, setDriverFeedback] = useState({ type: '', message: '' });
  const [editingDriver, setEditingDriver] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/getusers`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const json = await res.json();
        const normalized = (Array.isArray(json) ? json : []).map((u) => {
          const id = String(u?._id ?? u?.id ?? u?.userId ?? u?.userid ?? u?.user_id ?? u?.uid ?? '').trim() || null;
          return { ...u, id };
        });
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

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setDriversLoading(true);
    setDriversError(null);
    try {
      const res = await fetch(`${API}/getdrivers`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to fetch drivers');
      const json = await res.json();
      const normalized = (Array.isArray(json) ? json : []).map((d) => {
        const id = String(d?._id ?? d?.id ?? d?.driverId ?? d?.driver_id ?? d?.userid ?? '').trim() || null;
        return {
          ...d,
          id,
          phoneNumber: d?.phoneNumber ?? d?.phone ?? '',
          vehicleNumber: d?.vehicleNumber ?? d?.vehicle_no ?? '',
          vehicleType: d?.vehicleType ?? d?.vehicle_type ?? '',
          status: (d?.status || 'AVAILABLE').toUpperCase(),
        };
      });
      // eslint-disable-next-line no-console
      console.log('AdminUsers: fetched drivers', normalized);
      setDrivers(normalized);
    } catch (err) {
      console.warn('Failed to load drivers', err);
      setDriversError('Failed to load drivers');
      setDrivers([]);
    } finally {
      setDriversLoading(false);
    }
  };

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

  const openDriverModal = (driver = null) => {
    const nextEditing = driver ? driver : null;
    setEditingDriver(nextEditing);

    if (nextEditing) {
      setDriverForm({
        name: nextEditing.name || '',
        email: nextEditing.email || '',
        password: '',
        phoneNumber: nextEditing.phoneNumber || '',
        vehicleNumber: nextEditing.vehicleNumber || '',
        vehicleType: nextEditing.vehicleType || '',
        status: (nextEditing.status || 'AVAILABLE').toUpperCase(),
      });
    } else {
      setDriverForm({ ...initialDriverForm });
    }
    setDriverFeedback({ type: '', message: '' });
    setShowDriverModal(true);
  };

  const closeDriverModal = () => {
    if (driverSaving) return;
    setShowDriverModal(false);
    setDriverFeedback({ type: '', message: '' });
    setEditingDriver(null);
    setDriverForm({ ...initialDriverForm });
  };

  const handleDriverFieldChange = (field) => (e) => {
    const value = e.target.value;
    setDriverForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitDriver = async (e) => {
    e.preventDefault();
    setDriverSaving(true);
    setDriverFeedback({ type: '', message: '' });

    const editingTargetId = editingDriver ? getDriverId(editingDriver) : '';
    const isUpdate = Boolean(editingDriver && editingTargetId);

    if (editingDriver && !isUpdate) {
      // eslint-disable-next-line no-console
      console.warn('Driver edit missing identifier; falling back to add flow');
      setEditingDriver(null);
    }

    try {
      const payload = {
        name: driverForm.name,
        email: driverForm.email,
        password: driverForm.password,
        phoneNumber: driverForm.phoneNumber,
        vehicleNumber: driverForm.vehicleNumber,
        vehicleType: driverForm.vehicleType,
        status: driverForm.status,
      };

      let res = null;

      if (isUpdate) {
        const filteredPayload = { ...payload };
        if (!filteredPayload.password) delete filteredPayload.password;

        const attempts = [
          {
            url: `${API}/updatedriver/${encodeURIComponent(editingTargetId)}`,
            method: 'PUT',
            body: JSON.stringify(filteredPayload),
          },
          {
            url: `${API}/updatedriver`,
            method: 'PUT',
            body: JSON.stringify({ id: editingTargetId, ...filteredPayload }),
          },
          {
            url: `${API}/updatedriver`,
            method: 'POST',
            body: JSON.stringify({ id: editingTargetId, ...filteredPayload }),
          },
        ];

        for (const attempt of attempts) {
          try {
            const response = await fetch(attempt.url, {
              method: attempt.method,
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: attempt.body,
            });
            if (response.ok) {
              res = response;
              break;
            }
            res = response;
          } catch (err) {
            console.warn('Driver update attempt failed', attempt.url, err);
          }
        }
      } else {
        res = await fetch(`${API}/adddrivers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res || !res.ok) {
        const txt = await res?.text?.().catch(() => '') ?? '';
        throw new Error(txt || `Failed to ${isUpdate ? 'update' : 'add'} driver`);
      }

      setDriverFeedback({ type: 'success', message: isUpdate ? 'Driver updated successfully' : 'Driver added successfully' });
      setDriverForm({ ...initialDriverForm });
      await loadDrivers();
      setTimeout(() => {
        closeDriverModal();
      }, 1200);
    } catch (err) {
      console.warn('Driver save failed', err);
      setDriverFeedback({ type: 'error', message: err.message || `Failed to ${isUpdate ? 'update' : 'add'} driver` });
    } finally {
      setDriverSaving(false);
    }
  };

  const getDriverId = (driver) => {
    if (!driver) return '';
    if (typeof driver === 'string' || typeof driver === 'number') return String(driver).trim();
    return String(driver?.id ?? driver?._id ?? driver?.driverId ?? driver?.driver_id ?? '').trim();
  };

  const deleteDriver = async (driver) => {
    const id = getDriverId(driver);
    if (!id) {
      alert('Driver id not found');
      return;
    }
    if (!window.confirm('Delete this driver?')) return;

    setDriverDeletingId(id);
    try {
      let res = await fetch(`${API}/deletedriver/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        res = await fetch(`${API}/deletedriver`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Delete failed (${res.status})`);
      }
      setDriverFeedback({ type: 'success', message: 'Driver deleted successfully' });
      await loadDrivers();
      setTimeout(() => setDriverFeedback({ type: '', message: '' }), 2000);
    } catch (err) {
      console.warn('Failed to delete driver', err);
      setDriverFeedback({ type: 'error', message: err.message || 'Failed to delete driver' });
    } finally {
      setDriverDeletingId(null);
    }
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
          <button className="btn primary" onClick={openDriverModal}>Add Driver</button>
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

      <section className="users-list" style={{ marginTop: 32 }}>
        <div className="drivers-header">
          <h3>Drivers</h3>
          <p className="muted">Manage delivery drivers</p>
        </div>

        {driversLoading && <div className="notice">Loading drivers...</div>}
        {driversError && <div className="notice error">{driversError}</div>}
        {driverFeedback.message && !showDriverModal && (
          <div className={`notice ${driverFeedback.type === 'error' ? 'error' : ''}`}>{driverFeedback.message}</div>
        )}
        {!driversLoading && drivers.length === 0 && !driversError && (
          <div className="notice">No drivers found.</div>
        )}

        {drivers.length > 0 && (
          <div className="table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Driver</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th style={{ width: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver, idx) => (
                  <tr key={getDriverId(driver) || idx}>
                    <td className="idx">{idx + 1}</td>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">
                          <div className="initial">{(driver.name || 'D').charAt(0).toUpperCase()}</div>
                        </div>
                        <div className="user-meta">
                          <div className="name">{driver.name || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="email-col">{driver.email || '—'}</td>
                    <td className="email-col">{driver.phoneNumber || '—'}</td>
                    <td className="email-col">{driver.vehicleNumber || '—'}<div className="driver-vehicle-type">{driver.vehicleType || ''}</div></td>
                    <td>
                      <span className={`role-badge driver ${String(driver.status || 'AVAILABLE').toLowerCase()}`}>
                        {String(driver.status || 'AVAILABLE').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="user-actions" style={{ gap: 8 }}>
                      <button className="btn outline small" onClick={() => openDriverModal(driver)}>Edit</button>
                      <button
                        className="btn danger small action-btn"
                        onClick={() => deleteDriver(driver)}
                        disabled={driverDeletingId === getDriverId(driver)}
                      >
                        {driverDeletingId === getDriverId(driver) ? 'Removing...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showDriverModal && (
        <div className="admin-users-modal-overlay" onClick={closeDriverModal}>
          <div className="admin-users-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingDriver ? 'Edit Driver' : 'Add Driver'}</h3>
            {driverFeedback.message && (
              <div className={`modal-feedback ${driverFeedback.type}`}>{driverFeedback.message}</div>
            )}
            <form className="modal-grid" onSubmit={submitDriver}>
              <div className="modal-group">
                <label>Name</label>
                <input value={driverForm.name} onChange={handleDriverFieldChange('name')} required />
              </div>
              <div className="modal-group">
                <label>Email</label>
                <input type="email" value={driverForm.email} onChange={handleDriverFieldChange('email')} required />
              </div>
              <div className="modal-group">
                <label>Password</label>
                <input
                  type="password"
                  value={driverForm.password}
                  onChange={handleDriverFieldChange('password')}
                  required={!editingDriver}
                  placeholder={editingDriver ? 'Leave blank to keep current password' : ''}
                />
              </div>
              <div className="modal-group">
                <label>Phone Number</label>
                <input value={driverForm.phoneNumber} onChange={handleDriverFieldChange('phoneNumber')} required />
              </div>
              <div className="modal-group">
                <label>Vehicle Number</label>
                <input value={driverForm.vehicleNumber} onChange={handleDriverFieldChange('vehicleNumber')} required />
              </div>
              <div className="modal-group">
                <label>Vehicle Type</label>
                <select value={driverForm.vehicleType} onChange={handleDriverFieldChange('vehicleType')} required>
                  <option value="">Select vehicle type</option>
                  <option value="Bike">Bike</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Car">Car</option>
                  <option value="Van">Van</option>
                  <option value="Truck">Truck</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="modal-group">
                <label>Status</label>
                <select value={driverForm.status} onChange={handleDriverFieldChange('status')} required>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="ON_DELIVERY">ON_DELIVERY</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn outline" onClick={closeDriverModal} disabled={driverSaving}>Cancel</button>
                <button type="submit" className="btn primary" disabled={driverSaving}>
                  {driverSaving ? 'Saving...' : editingDriver ? 'Update Driver' : 'Save Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
