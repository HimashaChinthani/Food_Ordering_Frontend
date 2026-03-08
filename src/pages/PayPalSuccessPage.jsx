import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PaymentSuccess.css';

// Helper to persist payment details in localStorage
export function persistPendingPayment(data) {
  try {
    localStorage.setItem('pending_payment', JSON.stringify(data));
  } catch (e) {
    console.error('Failed to persist pending payment', e);
  }
}

// Helper to clear persisted payment details
function clearPendingPayment() {
  localStorage.removeItem('pending_payment');
}

const PayPalSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const paymentStatus = params.get('payment');

    // If payment status is already known, just show it
    if (paymentStatus === 'completed') {
      setLoading(false);
      // You might want to fetch final payment details here
      return;
    }
    if (paymentStatus === 'failed') {
      setLoading(false);
      setError('Payment failed or was cancelled.');
      return;
    }

    // Fallback capture if no status is present
    if (token) {
      const pendingPaymentRaw = localStorage.getItem('pending_payment');
      if (!pendingPaymentRaw) {
        setError('No pending payment found to capture.');
        setLoading(false);
        return;
      }

      try {
        const pendingPayment = JSON.parse(pendingPaymentRaw);
        const { amount, orderDbId } = pendingPayment;

        axios.post("http://localhost:8082/api/payments/paypal/capture", null, {
          params: {
            token: token,
            amount: amount,
            orderDbId: orderDbId
          }
        })
        .then(response => {
          setPayment(response.data);
          clearPendingPayment(); // Clean up after successful capture
        })
        .catch(err => {
          console.error("Error capturing payment:", err);
          setError(err.response?.data?.message || err.message || "An error occurred during payment capture.");
        })
        .finally(() => {
          setLoading(false);
        });

      } catch (e) {
        setError('Failed to parse pending payment details.');
        setLoading(false);
      }
    } else {
      setError('No payment token found.');
      setLoading(false);
    }
  }, [location]);

  const handlePayAllOrders = async (paypalOrderId, amount, orderIds) => {
    try {
      const res = await axios.post(
        "http://localhost:8082/api/payments/paypal/capture",
        {
          orderId: paypalOrderId,      // string from PayPal create order
          amount: amount,              // total amount to charge
          orderDbIds: orderIds         // array of cart order IDs
        }
      );
      console.log("Payment status:", res.data);
      // redirect or update UI after success
    } catch (err) {
      console.error("Error creating PayPal payment:", err);
    }
  };

  if (loading) {
    return (
      <main className="payment-success-page">
        <div className="ps-container">
          <div className="ps-card">
            <div className="ps-header">
              <h1 className="ps-title">Processing Payment...</h1>
              <p className="ps-sub">Please wait while we confirm your payment.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="payment-success-page">
        <div className="ps-container">
          <div className="ps-card">
            <div className="ps-header">
              <h1 className="ps-title">Payment Failed</h1>
              <p className="ps-sub">{error}</p>
              <div className="ps-actions" style={{ marginTop: 20 }}>
                <button className="btn primary" onClick={() => navigate('/cart')}>Return to Cart</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // This is the success UI from PaymentSuccess.jsx, adapted for this component
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
                  try {
                    if (Array.isArray(payment)) {
                      items = payment.flatMap(p => {
                        try { return typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || []); } catch { return []; }
                      });
                    } else if (payment && Array.isArray(payment.items)) {
                      items = payment.items.flatMap(it => Array.isArray(it) ? it : [it]);
                    } else if (payment && payment.payments && Array.isArray(payment.payments)) {
                      items = payment.payments.flatMap(p => {
                        try { return typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || []); } catch { return []; }
                      });
                    } else if (payment && typeof payment.items === 'string') {
                      items = JSON.parse(payment.items);
                    } else {
                      items = (payment && payment.items) || [];
                    }
                  } catch (e) { items = []; }

                  if (!items || items.length === 0) return <div className="muted">No items available.</div>;
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
            <div className="ps-body"><p className="muted">No payment details available, but payment was successful.</p></div>
          )}
        </div>
      </div>
    </main>
  );
};

export default PayPalSuccessPage;
