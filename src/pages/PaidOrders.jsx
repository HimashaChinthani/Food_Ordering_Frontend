import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

const PaidOrders = () => {
  const [paidOrders, setPaidOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [driverDetails, setDriverDetails] = useState({});
  const [driverLoading, setDriverLoading] = useState({});
  const [assignmentLoading, setAssignmentLoading] = useState({});
  const navigate = useNavigate();

  const fmt = (n) => `₨${(Number(n) || 0).toFixed(2)}`;

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      setError('User not found. Please login.');
      return;
    }
    try {
      const u = JSON.parse(raw);
      fetchPaidOrders(u);
    } catch (e) {
      setError('Failed to parse user data');
    }
  }, []);

  useEffect(() => {
    // Auto-fetch driver details when an order is selected
    if (selectedOrderId && paidOrders.length > 0) {
      const selectedOrder = paidOrders.find(
        x => (x.paymentId || x.orderId || x.id || x._id) == selectedOrderId
      );
      
      if (selectedOrder) {
        const orderId = selectedOrder.orderId || selectedOrder.id || selectedOrderId;
        console.log('Selected order ID:', orderId);
        
        // Fetch assigned driver info from API
        (async () => {
          const assignmentData = await fetchAssignedDriver(orderId);
          if (assignmentData) {
            const driverId = assignmentData.driverId || assignmentData.driver_id || null;
            console.log('Got driver ID from API:', driverId);
            
            // Fetch driver details using the driver ID from assignment API
            if (driverId && !driverDetails[selectedOrderId] && !driverLoading[selectedOrderId]) {
              fetchDriverDetails(driverId, selectedOrderId);
            }
          }
        })();
      }
    }
  }, [selectedOrderId, paidOrders]);

  async function fetchPaidOrders(u) {
    if (!u) {
      setError('User not found');
      return;
    }

    const userId = u.id ?? u._id ?? u.userId ?? u.userid ?? null;
    if (!userId) {
      setError('User ID not found');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:8082/api/v3/paid-orders/user/${encodeURIComponent(userId)}`,
        { headers: { Accept: 'application/json' } }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Server ${res.status}: ${txt}`);
      }

      const data = await res.json();
      const arr = Array.isArray(data)
        ? data
        : (data.orders || (data.data && Array.isArray(data.data) ? data.data : [data]));

      setPaidOrders(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.error('Failed to load paid orders', err);
      setError('Failed to load paid orders');
      setPaidOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAssignedDriver(orderId) {
    if (!orderId) {
      console.warn('No order ID provided');
      return null;
    }

    setAssignmentLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const url = `http://localhost:8082/api/v3/getassigndrivers/${encodeURIComponent(orderId)}`;
      console.log('Fetching assigned driver from:', url);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => `HTTP ${res.status}`);
        console.error('Failed to fetch assigned driver:', errorText);
        return null;
      }

      const data = await res.json();
      console.log('Assigned driver data:', data);

      // Handle various response formats
      let assignmentData = null;
      if (Array.isArray(data)) {
        assignmentData = data[0] || data;
      } else if (data && typeof data === 'object') {
        assignmentData = data.data || data;
      }

      if (assignmentData) {
        console.log('Driver ID extracted:', assignmentData.driverId || assignmentData.driver_id);
      }

      return assignmentData;
    } catch (err) {
      console.error('Error fetching assigned driver:', err.message);
      return null;
    } finally {
      setAssignmentLoading(prev => ({ ...prev, [orderId]: false }));
    }
  }

  async function fetchDriverDetails(driverId, orderId) {
    if (!driverId) {
      console.warn('No driver ID provided');
      return;
    }

    // Don't fetch if already loading or already loaded
    if (driverLoading[orderId] || driverDetails[orderId]) return;

    setDriverLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      // Try multiple API endpoints for better compatibility
      let url = `http://localhost:8080/api/v1/getdriver/${encodeURIComponent(driverId)}`;
      console.log('Attempting to fetch driver from:', url);
      
      let res = await fetch(url, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        }
      });

      // If first endpoint fails, try alternative format
      if (!res.ok) {
        console.log('First endpoint failed, trying alternative...');
        url = `http://localhost:8080/api/v1/getdriver?id=${encodeURIComponent(driverId)}`;
        res = await fetch(url, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
          }
        });
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => `HTTP ${res.status}`);
        console.error('Failed to fetch driver details:', errorText);
        setDriverDetails(prev => ({
          ...prev,
          [orderId]: { error: `Unable to load driver details: ${errorText}` }
        }));
        return;
      }

      const data = await res.json();
      console.log('Driver data received:', data);
      
      // Handle various response formats
      let driver = null;
      
      if (Array.isArray(data)) {
        driver = data[0] || data.find(d => d && d.id === driverId);
      } else if (data && typeof data === 'object') {
        driver = data.data || data;
      }

      if (!driver || !Object.keys(driver).length) {
        throw new Error('No valid driver data returned');
      }

      console.log('Setting driver details:', driver);
      setDriverDetails(prev => ({
        ...prev,
        [orderId]: driver
      }));
    } catch (err) {
      console.error('Error fetching driver details:', err.message);
      setDriverDetails(prev => ({
        ...prev,
        [orderId]: { error: `Error: ${err.message}` }
      }));
    } finally {
      setDriverLoading(prev => ({ ...prev, [orderId]: false }));
    }
  }

  const grandTotal = paidOrders.reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);

  return (
    <main className="cart-page orders-only">
      <div className="container">
        <div className="orders-header">
          <div>
            <h2>Paid Orders</h2>
            <p className="muted">History of completed orders</p>
          </div>
          <div className="orders-actions">
            <button className="btn outline" onClick={() => {
              const raw = localStorage.getItem('user');
              if (!raw) return;
              try {
                fetchPaidOrders(JSON.parse(raw));
              } catch (e) { }
            }} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
            <button className="btn outline" onClick={() => navigate('/cart')}>Back to Orders</button>
          </div>
        </div>

        {loading && <p className="muted">Loading paid orders...</p>}
        {error && <p className="error">{error}</p>}

        {paidOrders && paidOrders.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No paid orders found.</p>
            <a className="btn primary" href="/menu">Browse Menu</a>
          </div>
        ) : (
          <div className="orders-grid">
            <div className="orders-list">
              {paidOrders.map(o => {
                const idKey = o.paymentId || o.orderId || o.id || o._id || String(Math.random());
                const selected = idKey === selectedOrderId;
                return (
                  <div
                    key={idKey}
                    className={`order-card ${selected ? 'selected' : ''}`}
                    onClick={() => setSelectedOrderId(idKey)}
                  >
                    <div className="order-head">
                      <div className="order-meta">
                        <div className="order-id">
                          Order #{o.orderId ?? o.id ?? o.paymentId ?? ''}
                        </div>
                        <div className="order-date">
                          {new Date(o.orderDate || o.createdAt || o.paymentDate || Date.now()).toLocaleString()}
                        </div>
                      </div>
                      <div className={`status-pill completed`}>
                        {o.status || o.order_status || o.paymentStatus || 'Paid'}
                      </div>
                    </div>
                    <div className="order-row">
                      <span className="muted">Amount:</span>
                      <strong>{fmt(o.totalAmount)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="summary-card">
              {selectedOrderId ? (
                (() => {
                  const o = paidOrders.find(
                    x => (x.paymentId || x.orderId || x.id || x._id) == selectedOrderId
                  );
                  if (!o) return <p>Order not found</p>;

                  let itemsList = [];
                  try {
                    itemsList = Array.isArray(o.items) ? o.items : [];
                  } catch (e) { }

                  const orderStatus = (o.status || o.order_status || o.paymentStatus || 'Paid').toLowerCase();

                  return (
                    <>
                      <h3>Order Details</h3>
                      <div className="summary-row">
                        <span>Order ID</span>
                        <strong>{o.orderId ?? o.id ?? o.paymentId ?? '-'}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Payment ID</span>
                        <strong>{o.paymentId ?? '-'}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Status</span>
                        <strong style={{ color: '#28a745' }}>
                          {o.status || o.order_status || o.paymentStatus || 'Paid'}
                        </strong>
                      </div>
                      <div className="summary-row">
                        <span>Customer</span>
                        <strong>{o.customerName ?? o.name ?? '-'}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Email</span>
                        <strong>{o.customerEmail ?? o.email ?? '-'}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Date</span>
                        <strong>
                          {new Date(
                            o.orderDate || o.createdAt || o.paymentDate || Date.now()
                          ).toLocaleString()}
                        </strong>
                      </div>

                      {assignmentLoading[selectedOrderId] && (
                        <p className="muted" style={{ marginTop: 12 }}>Loading assignment info...</p>
                      )}

                      {driverLoading[selectedOrderId] && (
                        <p className="muted" style={{ marginTop: 12 }}>Loading driver details...</p>
                      )}

                      {driverDetails[selectedOrderId] && (
                        <div style={{ marginTop: 20, paddingTop: 15, borderTop: '1px solid #eee' }}>
                          {driverDetails[selectedOrderId].error ? (
                            <p className="error">{driverDetails[selectedOrderId].error}</p>
                          ) : (
                            <>
                              <h4>Assigned Driver</h4>
                              <div className="summary-row">
                                <span>Driver Name</span>
                                <strong>
                                  {o.assignedDriverName || driverDetails[selectedOrderId].name || driverDetails[selectedOrderId].driverName || driverDetails[selectedOrderId].firstName || '-'}
                                </strong>
                              </div>
                              <div className="summary-row">
                                <span>Phone Number</span>
                                <strong>
                                  {o.assignedDriverPhone || driverDetails[selectedOrderId].phoneNumber || driverDetails[selectedOrderId].phone || driverDetails[selectedOrderId].mobileNo || '-'}
                                </strong>
                              </div>
                              <div className="summary-row">
                                <span>Vehicle Number</span>
                                <strong>
                                  {o.assignedDriverVehicle || driverDetails[selectedOrderId].vehicleNumber || driverDetails[selectedOrderId].vehicle || driverDetails[selectedOrderId].vehicleNo || '-'}
                                </strong>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {!assignmentLoading[selectedOrderId] && !driverLoading[selectedOrderId] && !driverDetails[selectedOrderId] && (
                        <div style={{ marginTop: 12, padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                          <p className="muted">No driver assigned to this order</p>
                        </div>
                      )}
                      {itemsList.length > 0 && (
                        <>
                          <h4 style={{ marginTop: 20 }}>Items</h4>
                          <div style={{ margin: '10px 0' }}>
                            {itemsList.map((it, idx) => (
                              <div
                                key={idx}
                                className="summary-row"
                                style={{ fontSize: '0.9em', borderBottom: '1px solid #eee' }}
                              >
                                <span>
                                  {it.name || it.itemName || `Item ${idx + 1}`} x{it.qty || it.quantity || 1}
                                </span>
                                <strong>
                                  {fmt(
                                    ((it.price || it.itemPrice || 0) * (it.qty || it.quantity || 1))
                                  )}
                                </strong>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      <div className="summary-row" style={{ marginTop: 15, fontWeight: 'bold' }}>
                        <span>Total</span>
                        <strong>{fmt(o.totalAmount)}</strong>
                      </div>
                    </>
                  );
                })()
              ) : (
                <>
                  <h3>Summary</h3>
                  <div className="summary-row">
                    <span>Total Paid Orders</span>
                    <strong>{paidOrders.length}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Grand Total</span>
                    <strong>{fmt(grandTotal)}</strong>
                  </div>
                  <div style={{ marginTop: 12 }} className="muted">
                    Select an order to view details.
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default PaidOrders;
