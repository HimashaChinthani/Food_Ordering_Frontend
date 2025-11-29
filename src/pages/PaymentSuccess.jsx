import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const payment = location.state && location.state.payment ? location.state.payment : null;

  return (
    <main className="payment-success-page">
      <div className="ps-container">
        <div className="ps-card">
          <div className="ps-header">
            <svg className="ps-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#e6ffef" />
              <path d="M7 12l3 3 7-7" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="ps-title-group">
              <h1 className="ps-title">Payment Successful</h1>
              <p className="ps-sub">Thank you — your payment was processed successfully.</p>
            </div>
          </div>

          {payment ? (
            <div className="ps-body">
              <div className="ps-summary">
                <div className="ps-amount">₨{(parseFloat(payment.totalAmount) || payment.amount || 0).toFixed(2)}</div>
                <div className={`ps-badge ${((payment.status||'').toString().toLowerCase())}`}>{payment.status || 'COMPLETED'}</div>
              </div>

              <div className="ps-details">
                <div><span className="label">Payment ID</span><div className="value">{payment.paymentId ?? payment.payment_id ?? payment.id ?? '-'}</div></div>
                <div><span className="label">Order ID</span><div className="value">{payment.order ? (payment.order.orderId ?? payment.order.order_id) : (payment.orderId ?? payment.order_id ?? '-')}</div></div>
                <div><span className="label">Customer</span><div className="value">{payment.customerName ?? payment.customer_name ?? '-'}</div></div>
                <div><span className="label">Email</span><div className="value">{payment.customerEmail ?? payment.customer_email ?? '-'}</div></div>
                <div><span className="label">Date</span><div className="value">{new Date(payment.orderDate ?? payment.order_date ?? Date.now()).toLocaleString()}</div></div>
              </div>

              <div className="ps-items">
                <h4>Items</h4>
                {(() => {
                  let items = [];
                  try { items = typeof payment.items === 'string' ? JSON.parse(payment.items) : (payment.items || []); } catch(e) { items = []; }
                  if (items.length === 0) return <div className="muted">No items available.</div>;
                  return (
                    <table className="ps-items-table">
                      <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
                      <tbody>
                        {items.map((it, i) => (
                          <tr key={i}><td>{it.name || it.title || it.id}</td><td>{it.qty || 1}</td><td>₨{(parseFloat(it.price)||0).toFixed(2)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>

              <div className="ps-actions">
                <button className="btn primary" onClick={() => navigate('/menu')}>Continue Shopping</button>
                <button className="btn outline" onClick={() => navigate('/cart')}>View Orders</button>
                <button className="btn ghost" onClick={() => window.print()}>Print Receipt</button>
              </div>
            </div>
          ) : (
            <div className="ps-body"><p className="muted">No payment details available.</p></div>
          )}
        </div>
      </div>
    </main>
  );
};

export default PaymentSuccess;
