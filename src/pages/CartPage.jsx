import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPage.css';
import axios from "axios";

const CartPage = () => {
  const { items, remove, changeQty, clear } = useCart();
  const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [payAllLoading, setPayAllLoading] = useState(false);
  const navigate = useNavigate();

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
      // and only show orders whose status is pending
      const filtered = arr.filter(order => {
        const oid = order.user_id ?? order.userId ?? order.user ?? order.customerId ?? order.customer_id ?? order.userid ?? order.id ?? null;
        const oemail = (order.customerEmail ?? order.customer_email ?? order.email ?? (order.customer && order.customer.email) ?? '').toString().toLowerCase();
        const matchById = userId && oid != null && String(oid) === String(userId);
        const matchByEmail = email && oemail && oemail === String(email).toLowerCase();
        if (!(matchById || matchByEmail)) return false;

        // Normalize status value and show only pending orders
        const statusRaw = (order.status ?? order.order_status ?? order.paymentStatus ?? '').toString();
        const status = statusRaw.trim().toLowerCase();
        return status.includes('pending');
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

  async function deleteOrderById(order) {
    if (!order) return;
    const id = order.orderId ?? order.id ?? order._id ?? null;
    if (!id) {
      alert('Order id not found');
      return;
    }
    if (!window.confirm(`Remove order ${id}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`http://localhost:8082/api/v3/deleteorder/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Server ${res.status}`);
      }
      alert('Order removed');
      // refresh orders
      const raw = localStorage.getItem('user'); if (!raw) return; try { fetchOrders(JSON.parse(raw)); } catch(e){}
      setSelectedOrderId(null);
    } catch (err) {
      console.error('Failed to delete order', err);
      alert('Failed to remove order: ' + (err.message || err));
    }
  }

  async function handleProceedToCheckout(o) {
    if (!o) return;
    setCheckoutLoading(true);
    try {
      let itemsList = [];
      try { itemsList = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch (e) { itemsList = []; }

      // compute total if not present
      const computedTotal = itemsList.reduce((s, it) => s + (parseFloat(it.price) || 0) * (it.qty || 1), 0);
      const totalAmount = parseFloat(o.totalAmount) || computedTotal;
      const finalAmount = totalAmount.toFixed(2);

      const res = await axios.post(
        `http://localhost:8082/api/payments/paypal/create?amount=${finalAmount}`,
        { timeout: 30000 } // 30 second timeout
      );
  
      // Redirect user to PayPal payment page
      setCheckoutLoading(false); // Stop loading before redirect
      setCheckoutLoading(true); // Show redirecting message
      window.location.href = res.data;

    } catch (err) {
      console.error('Checkout error', err);
      if (err.code === 'ECONNABORTED') {
        alert('Payment initiation timed out. Please check your connection and try again.');
      } else {
        alert('Checkout error: ' + (err.message || err));
      }
      setCheckoutLoading(false);
    }
  }

  // Pay all fetched orders in sequence. This will POST each order as a payment record.
  async function handlePayAllOrders() {
    if (!orders || orders.length === 0) return;
    if (!window.confirm(`Proceed to pay ${orders.length} order(s)?`)) return;
    setPayAllLoading(true);
    try {
      const finalAmount = grandTotal.toFixed(2);
      const res = await axios.post(
        `http://localhost:8082/api/payments/paypal/create?amount=${finalAmount}`,
        { timeout: 30000 } // 30 second timeout
      );
  
      // Redirect user to PayPal payment page
      window.location.href = res.data;
    } catch (error) {
      console.error("Error creating PayPal payment:", error);
      if (error.code === 'ECONNABORTED') {
        alert('Payment initiation timed out. Please check your connection and try again.');
      } else {
        alert("Failed to initiate payment. Please try again.");
      }
    } finally {
      setPayAllLoading(false);
    }
  }

  return (
    <main className="cart-page orders-only">
      <div className="container">
        <div className="orders-header">
          <div>
            <h2>My Orders</h2>
            {items && items.length > 0 && <p className="cart-items-count">Cart Items: {items.length}</p>}
          </div>
          <div className="orders-actions">
            <button className="btn outline" onClick={() => {
              const raw = localStorage.getItem('user'); if (!raw) return; try { fetchOrders(JSON.parse(raw)); } catch(e){}
            }} disabled={ordersLoading}>{ordersLoading ? 'Refreshing...' : 'Refresh'}</button>
            <button className="btn outline" onClick={() => navigate('/paid-orders')}>View Paid Orders</button>
            <button className="btn primary" onClick={handlePayAllOrders} disabled={ordersLoading || payAllLoading || orders.length===0}>
              {payAllLoading ? `Processing (${orders.length})...` : 'Pay All Orders'}
            </button>
          </div>
        </div>

        {ordersLoading && <p className="muted">Loading orders...</p>}
        {ordersError && <p className="error">{ordersError}</p>}

        {orders && orders.length === 0 && !ordersLoading ? (
          <div className="empty-state">
            <p>No pending orders found for your account.</p>
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
                        <button
                          className="btn primary"
                          onClick={() => handleProceedToCheckout(o)}
                          disabled={checkoutLoading}
                        >{checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}</button>
                        <button className="btn outline" onClick={() => setSelectedOrderId(null)}>Back</button>
                        <button className="btn danger" onClick={() => deleteOrderById(o)}>Remove</button>
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
