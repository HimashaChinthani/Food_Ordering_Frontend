import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import './CartPage.css';

const CartPage = () => {
  const { items, remove, changeQty, clear } = useCart();
  const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    try {
      const u = JSON.parse(raw);
      fetchOrders(u).catch(() => {});
    } catch (e) {
      // ignore
    }
  }, []);

  async function fetchOrders(u) {
    if (!u) return;
    const userId = u.id ?? u._id ?? u.userId ?? u.userid ?? null;
    const email = u.email ?? u.user_email ?? null;

    // prefer fetching by user_id, fallback to email-based endpoint
    const url = userId
      ? `http://localhost:8082/api/v3/getorders?user_id=${encodeURIComponent(userId)}`
      : (email ? `http://localhost:8082/api/v3/getordersms?email=${encodeURIComponent(email)}` : null);

    if (!url) {
      setOrdersError('User id or email not found');
      return;
    }

    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Server ${res.status}: ${txt}`);
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.orders || (data.data && Array.isArray(data.data) ? data.data : [data]));

      // Filter server response to ensure we only display orders belonging to the current logged-in user
      const filtered = arr.filter(order => {
        const oid = order.user_id ?? order.userId ?? order.user ?? order.customerId ?? order.customer_id ?? order.userid ?? order.id ?? null;
        const oemail = (order.customerEmail ?? order.customer_email ?? order.email ?? (order.customer && order.customer.email) ?? '').toString().toLowerCase();
        const matchById = userId && oid != null && String(oid) === String(userId);
        const matchByEmail = email && oemail && oemail === String(email).toLowerCase();
        return matchById || matchByEmail;
      });

      setOrders(filtered);
      // select first filtered order by default if present
      if (filtered.length > 0) {
        const first = filtered[0];
        const idKey = first.orderId || first.id || first._id || first.order_id || null;
        setSelectedOrderId(idKey);
      } else {
        setSelectedOrderId(null);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
      setOrdersError(err.message || 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  }

  // compute grand total across fetched orders
  const grandTotal = orders.reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);

  return (
    <main className="cart-page orders-only">
      <div className="container">
        <div className="orders-header">
          <h2>My Orders</h2>
          <div className="orders-actions">
            <button className="btn outline" onClick={() => {
              const raw = localStorage.getItem('user'); if (!raw) return; try { fetchOrders(JSON.parse(raw)); } catch(e){}
            }} disabled={ordersLoading}>{ordersLoading ? 'Refreshing...' : 'Refresh'}</button>
          </div>
        </div>

        {ordersLoading && <p className="muted">Loading orders...</p>}
        {ordersError && <p className="error">{ordersError}</p>}

        {orders && orders.length === 0 && !ordersLoading ? (
          <div className="empty-state">
            <p>No orders found for your account.</p>
            <a className="btn primary" href="/menu">Browse Menu</a>
          </div>
        ) : (
          <div className="orders-grid">
            <div className="orders-list">
              {orders.map(o => {
                const idKey = o.orderId || o.id || o._id || String(Math.random());
                const selected = idKey === selectedOrderId;
                return (
                  <div key={idKey} className={`order-card ${selected ? 'selected' : ''}`} onClick={() => setSelectedOrderId(idKey)}>
                    <div className="order-head">
                      <div className="order-meta">
                        <div className="order-id">Order #{o.orderId ?? o.id ?? ''}</div>
                        <div className="order-date">{new Date(o.orderDate || o.createdAt || Date.now()).toLocaleString()}</div>
                      </div>
                      <div className={`status-pill ${((o.status||'pending')+'').toLowerCase()}`}>{o.status}</div>
                    </div>
                    <div className="order-row muted">Click to view items & checkout</div>
                  </div>
                );
              })}
            </div>

            <div className="summary-card">
              {selectedOrderId ? (
                (() => {
                  const o = orders.find(x => (x.orderId || x.id || x._id) == selectedOrderId);
                  if (!o) return <div className="muted">Order not found.</div>;
                  let itemsList = [];
                  try { itemsList = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch(e) { itemsList = []; }
                  return (
                    <>
                      <h3>Order Details</h3>
                      <div className="summary-row"><span>Order ID</span><strong>{o.orderId ?? o.id ?? ''}</strong></div>
                      <div className="summary-row"><span>Date</span><strong>{new Date(o.orderDate || o.createdAt || Date.now()).toLocaleString()}</strong></div>
                      <div className="order-items">
                        <table className="items-table">
                          <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                          <tbody>
                            {itemsList.map((it, i) => (
                              <tr key={i}>
                                <td>{it.name || it.title || it.id}</td>
                                <td>{it.qty || 1}</td>
                                <td>₨{(parseFloat(it.price)||0).toFixed(2)}</td>
                                <td>₨{(((parseFloat(it.price)||0) * (it.qty||1))).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="summary-row"><span>Order Total</span><strong>₨{(parseFloat(o.totalAmount)||0).toFixed(2)}</strong></div>
                      <div className="summary-row"><span>All Orders Total</span><strong>₨{(grandTotal||0).toFixed(2)}</strong></div>

                      <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                        <button className="btn primary" onClick={async () => {
                          // proceed to checkout for this order
                          try {
                            const userRaw = localStorage.getItem('user');
                            const user = userRaw ? JSON.parse(userRaw) : null;
                            const payload = { orderId: o.orderId ?? o.id ?? null, user_id: user ? (user.id ?? user._id ?? user.userId) : null };
                            const res = await fetch('http://localhost:8082/api/v3/checkout', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                            });
                            if (!res.ok) {
                              const txt = await res.text().catch(()=>'');
                              alert('Checkout failed: ' + (txt || res.status));
                              return;
                            }
                            alert('Checkout successful');
                            // refresh orders
                            fetchOrders(JSON.parse(localStorage.getItem('user'))).catch(()=>{});
                          } catch (err) {
                            console.error(err);
                            alert('Checkout error: ' + (err.message || err));
                          }
                        }}>Proceed to Checkout</button>
                        <button className="btn outline" onClick={() => setSelectedOrderId(null)}>Back</button>
                      </div>
                    </>
                  );
                })()
              ) : (
                <>
                  <h3>Summary</h3>
                  <div className="summary-row"><span>Total Orders</span><strong>{orders.length}</strong></div>
                  <div className="summary-row"><span>Grand Total</span><strong>₨{grandTotal.toFixed(2)}</strong></div>
                  <div style={{ marginTop: 12 }} className="muted">Select an order to view items and proceed to checkout.</div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
};

export default CartPage;
