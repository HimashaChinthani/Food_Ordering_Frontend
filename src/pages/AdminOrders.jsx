import React, { useEffect, useMemo, useState } from 'react';
import './AdminOrders.css';

const API = 'http://localhost:8082/api/v3';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [modalOrder, setModalOrder] = useState(null);

  const totalRevenue = useMemo(() => {
    return orders.reduce((s, o) => {
      const t = parseFloat(o.totalAmount || o.total || 0) || 0;
      return s + t;
    }, 0);
  }, [orders]);

  const fmt = (n) => `₨${(Number(n)||0).toFixed(2)}`;

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/getorders`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.orders || (data.data && Array.isArray(data.data) ? data.data : []));
      setOrders(arr);
    } catch (err) {
      console.error('Failed to load orders', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  // Note: status-update actions removed per request. Cards open a details modal.

  const filtered = orders.filter(o => {
    if (!query) return true;
    const q = String(query).toLowerCase();
    const id = (o.orderId || o.id || o._id || '').toString().toLowerCase();
    const name = (o.customerName || o.customer_name || (o.customer && o.customer.name) || '').toString().toLowerCase();
    const email = (o.customerEmail || o.customer_email || (o.customer && o.customer.email) || '').toString().toLowerCase();
    return id.includes(q) || name.includes(q) || email.includes(q);
  });

  return (
    <div className="admin-orders-root">
      <header className="admin-orders-hero">
        <div>
          <h2>All Orders</h2>
          <p className="muted">Overview of recent orders — search, filter and inspect details.</p>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <div className="stat-value">{filtered.length}</div>
            <div className="stat-label">Displayed Orders</div>
          </div>
          <div className="stat-card light">
            <div className="stat-value">{fmt(totalRevenue)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
      </header>

      <div className="admin-orders-controls">
        <input className="search" placeholder="Search by order id, name or email" value={query} onChange={e => setQuery(e.target.value)} />
        <button className="btn outline" onClick={loadOrders} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
      </div>
      {loading && (
        <div className="center-block">
          <p className="muted">Loading orders...</p>
        </div>
      )}

      {error && (
        <div className="center-block">
          <p className="error">{error}</p>
          <button className="btn outline" onClick={loadOrders}>Try again</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="center-block empty-state">
          <h3>No orders found</h3>
          <p className="muted">There are no orders to display. Use the refresh button to retry or check your backend.</p>
          <button className="btn" onClick={loadOrders}>Reload</button>
        </div>
      )}

      <section className="orders-grid">
        {filtered.map((o) => {
          const id = o.orderId || o.id || o._id || '';
          const date = new Date(o.orderDate || o.createdAt || Date.now()).toLocaleString();
          let items = [];
          try { items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch (e) { items = []; }
          const total = parseFloat(o.totalAmount || o.total || 0) || 0;

          return (
            <article
              className="order-card"
              key={id || Math.random()}
              role="button"
              tabIndex={0}
              onClick={() => setModalOrder(o)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setModalOrder(o); }}
            >
              <div className="card-top">
                <div className="left">
                  <div className="order-id">#{id}</div>
                  <div className="order-user">{o.customerName || o.customer_name || (o.customer && o.customer.name) || 'Guest'}</div>
                  <div className="order-email">{o.customerEmail || o.customer_email || (o.customer && o.customer.email) || ''}</div>
                </div>

                <div className="right">
                  <div className={`status ${((o.status||'pending')+'').toLowerCase()}`}>{o.status || 'PENDING'}</div>
                  <div className="order-date">{date}</div>
                  <div className="order-total">{fmt(total)}</div>
                </div>
              </div>

                <div className="order-items">
                <table>
                  <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Line Total</th></tr></thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i}>
                        <td>
                          <div className="item-name">{it.name || it.title || it.id}</div>
                          <div className="item-meta">Unit: {fmt(parseFloat(it.price)||0)}</div>
                        </td>
                        <td className="center">{it.qty || 1}</td>
                        <td className="right">{fmt(parseFloat(it.price)||0)}</td>
                        <td className="right">{fmt(((parseFloat(it.price)||0) * (it.qty||1)))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>


            </article>
          );
        })}
      </section>

      {modalOrder && (
        <div className="modal-overlay" onClick={() => setModalOrder(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details — #{modalOrder.orderId || modalOrder.id || modalOrder._id}</h3>
              <button className="close-btn" onClick={() => setModalOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-row"><strong>Customer:</strong> {modalOrder.customerName || modalOrder.customer_name || (modalOrder.customer && modalOrder.customer.name) || 'Guest'}</div>
              <div className="modal-row"><strong>Email:</strong> {modalOrder.customerEmail || modalOrder.customer_email || (modalOrder.customer && modalOrder.customer.email) || ''}</div>
              <div className="modal-row"><strong>Status:</strong> <span className={`status ${((modalOrder.status||'pending')+'').toLowerCase()}`}>{modalOrder.status || 'PENDING'}</span></div>
              <div className="modal-row"><strong>Items:</strong></div>
              <div className="modal-items">
                <table>
                  <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Line Total</th></tr></thead>
                  <tbody>
                    {(() => { let itms = []; try { itms = typeof modalOrder.items === 'string' ? JSON.parse(modalOrder.items) : (modalOrder.items || []); } catch(e) { itms = []; } return itms.map((it,i)=> (
                      <tr key={i}>
                        <td>
                          <div className="item-name">{it.name||it.title||it.id}</div>
                          <div className="item-meta">Unit: {fmt(it.price||0)}</div>
                        </td>
                        <td className="center">{it.qty||1}</td>
                        <td className="right">{fmt(it.price||0)}</td>
                        <td className="right">{fmt(((parseFloat(it.price)||0)*(it.qty||1)))}</td>
                      </tr>
                    )) })()}
                  </tbody>
                </table>
              </div>
              <div className="modal-row"><strong>Total:</strong> {fmt(modalOrder.totalAmount||modalOrder.total||0)}</div>
            </div>
            <div className="modal-actions">
              <button className="btn outline" onClick={() => setModalOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
