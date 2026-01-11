import React, { useEffect, useMemo, useState } from 'react';
import './AdminOrders.css';

const API = 'http://localhost:8082/api/v3';
const DRIVER_API = 'http://localhost:8080/api/v1';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOrder, setModalOrder] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driversError, setDriversError] = useState(null);
  const [assignModalOrder, setAssignModalOrder] = useState(null);
  const [assigningDriverId, setAssigningDriverId] = useState(null);

  const totalRevenue = useMemo(() => {
    return orders.reduce((s, o) => {
      const t = parseFloat(o.totalAmount || o.total || 0) || 0;
      return s + t;
    }, 0);
  }, [orders]);

  const fmt = (n) => `₨${(Number(n)||0).toFixed(2)}`;

  function getOrderId(order) {
    if (!order) return '';
    if (typeof order === 'string' || typeof order === 'number') return String(order).trim();
    return String(order.orderId || order.id || order._id || order.order_id || '').trim();
  }

  function getDriverId(driver) {
    if (!driver) return '';
    if (typeof driver === 'string' || typeof driver === 'number') return String(driver).trim();
    return String(driver.id || driver._id || driver.driverId || driver.driver_id || driver.userid || '').trim();
  }

  function getOrderDriverInfo(order) {
    if (!order) return { name: '', vehicle: '', phone: '', vehicleType: '' };
    const driverObj = order.driver || order.deliveryDriver || order.assignedDriver || {};
    const name = order.assignedDriverName || order.driverName || driverObj.name || driverObj.fullName || driverObj.driverName || '';
    const vehicle = order.assignedDriverVehicle || order.driverVehicleNumber || order.driverVehicle || driverObj.vehicleNumber || driverObj.vehicle_no || driverObj.vehicleNo || '';
    const vehicleType = order.assignedDriverVehicleType || order.driverVehicleType || driverObj.vehicleType || driverObj.vehicle_type || '';
    const phone = order.assignedDriverPhone || order.driverPhoneNumber || driverObj.phoneNumber || driverObj.phone || '';
    return { name, vehicle, phone, vehicleType };
  }

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    loadAvailableDrivers();
  }, []);

  useEffect(() => {
    if (!modalOrder) return;
    const id = getOrderId(modalOrder);
    if (!id) return;
    const updated = orders.find((o) => getOrderId(o) === id);
    if (updated && updated !== modalOrder) {
      setModalOrder(updated);
    }
  }, [orders, modalOrder]);

  // Enrich orders with assigned driver data from /getassigndrivers/{orderId}
  async function enrichOrdersWithAssignedDrivers(list) {
    if (!Array.isArray(list) || list.length === 0) return list;
    try {
      const enriched = await Promise.all(list.map(async (o) => {
        const id = getOrderId(o);
        if (!id) return o;
        try {
          const res = await fetch(`${API}/getassigndrivers/${encodeURIComponent(id)}`, {
            headers: { Accept: 'application/json' },
          });
          if (!res.ok) return o;
          const dto = await res.json();
          if (!dto) return o;

          const driverCore = dto.driver || dto.driverInfo || dto;
          const driverId = driverCore.driverId || dto.driverId || null;
          const name = driverCore.driverName || dto.driverName || null;
          const phone = driverCore.driverPhoneNumber || dto.driverPhoneNumber || null;
          const vehicle = driverCore.driverVehicleNumber || dto.driverVehicleNumber || null;
          const vehicleType = driverCore.driverVehicleType || dto.driverVehicleType || null;

          return {
            ...o,
            assignedDriverId: driverId || o.assignedDriverId,
            assignedDriverName: name,
            assignedDriverPhone: phone,
            assignedDriverVehicle: vehicle,
            assignedDriverVehicleType: vehicleType,
          };
        } catch (err) {
          console.warn('Failed to load assigned driver for order', id, err);
          return o;
        }
      }));
      return enriched;
    } catch (e) {
      console.warn('Failed to enrich orders with assigned drivers', e);
      return list;
    }
  }

  async function loadOrders() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/getorders`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.orders || (data.data && Array.isArray(data.data) ? data.data : []));
      // sort newest first by created/order date when possible
      const sorted = Array.from(arr).sort((a, b) => {
        const da = new Date(a.orderDate || a.createdAt || a.created_at || 0).getTime() || 0;
        const db = new Date(b.orderDate || b.createdAt || b.created_at || 0).getTime() || 0;
        return db - da;
      });
      const enriched = await enrichOrdersWithAssignedDrivers(sorted);
      setOrders(enriched);
    } catch (err) {
      console.error('Failed to load orders', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableDrivers() {
    setDriversLoading(true);
    setDriversError(null);
    try {
      const res = await fetch(`${DRIVER_API}/getdrivers`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Driver service ${res.status}`);
      const data = await res.json();

      // Normalize driver data
      const drivers = Array.isArray(data)
        ? data
        : data.drivers || data.data || [];

      const normalizedDrivers = drivers.map((driver) => {
        const id = getDriverId(driver);
        return {
          id,
          name: driver.name || driver.fullName || driver.driverName || 'Unknown',
          phoneNumber: driver.phoneNumber || driver.phone || 'N/A',
          vehicleNumber: driver.vehicleNumber || driver.vehicle_no || driver.vehicleNo || 'N/A',
          vehicleType: driver.vehicleType || driver.vehicle_type || 'N/A',
          status: (driver.status || 'AVAILABLE').toUpperCase(),
        };
      });

      // Filter only available drivers
      const availableDrivers = normalizedDrivers.filter(
        (driver) => driver.status === 'AVAILABLE'
      );

      setAvailableDrivers(availableDrivers);
    } catch (err) {
      console.error('Failed to load available drivers', err);
      setDriversError('Failed to load drivers');
      setAvailableDrivers([]);
    } finally {
      setDriversLoading(false);
    }
  }

  const openAssignModal = (order) => {
    setAssignModalOrder(order);
    loadAvailableDrivers();
  };

  const closeAssignModal = () => {
    if (assigningDriverId) return;
    setAssignModalOrder(null);
  };

  const assignDriverToOrder = async (order, driver) => {
    const orderId = getOrderId(order);
    const driverId = getDriverId(driver);
    if (!orderId) {
      alert('Order id not found.');
      return;
    }
    if (!driverId) {
      alert('Driver id not found.');
      return;
    }

    setAssigningDriverId(driverId);
    try {
      // Backend DriverAssignmentController: POST /api/v3/assigndriver/{orderId}
      // with body AssignDriverRequest { driverId }
      const payload = { driverId };

      const orderRes = await fetch(`${API}/assigndriver/${encodeURIComponent(orderId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!orderRes.ok) {
        const txt = typeof orderRes.text === 'function' ? await orderRes.text().catch(() => '') : '';
        throw new Error(txt || `Assign driver failed (${orderRes.status})`);
      }

      let driverRes = await fetch(`${DRIVER_API}/updatedriver/${encodeURIComponent(driverId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ status: 'ON_DELIVERY' }),
      });
      if (!driverRes.ok) {
        driverRes = await fetch(`${DRIVER_API}/updatedriver`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ id: driverId, status: 'ON_DELIVERY' }),
        });
      }
      if (!driverRes.ok) {
        const txt = await driverRes.text().catch(() => '');
        console.warn('Driver status update failed', txt);
      }

      setOrders((prev) => prev.map((o) => {
        if (getOrderId(o) !== orderId) return o;
        return {
          ...o,
          assignedDriverId: driverId,
          assignedDriverName: driver.name || '',
          assignedDriverPhone: driver.phoneNumber || '',
          assignedDriverVehicle: driver.vehicleNumber || '',
          assignedDriverVehicleType: driver.vehicleType || '',
        };
      }));

      setAvailableDrivers((prev) => prev.filter((d) => getDriverId(d) !== driverId));

      setAssignModalOrder(null);
      loadOrders();
      loadAvailableDrivers();
    } catch (err) {
      console.error('Failed to assign driver', err);
      //alert(err.message || 'Failed to assign driver');
    } finally {
      setAssigningDriverId(null);
    }
  };

    const openUnAssignModal = async (order) => {
      const orderId = getOrderId(order);
      const driverId = order && (order.assignedDriverId || order.driverId || order.driver_id || order.driver || '');
      if (!orderId) {
        alert('Order id not found.');
        return;
      }
      if (!driverId) {
        alert('Driver id not found.');
        return;
      }

      if (!window.confirm(`Unassign driver ${driverId} from order ${orderId}?`)) return;

      try {
        const res = await fetch(`${API}/unassigndriver/${encodeURIComponent(orderId)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ driverId }),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(txt || `Server ${res.status}`);
        }

        // Remove driver assignment locally
        setOrders((prev) => prev.map((o) => {
          if (getOrderId(o) !== orderId) return o;
          const copy = { ...o };
          delete copy.assignedDriverId;
          delete copy.assignedDriverName;
          delete copy.assignedDriverPhone;
          delete copy.assignedDriverVehicle;
          delete copy.assignedDriverVehicleType;
          return copy;
        }));

        // Try to mark driver AVAILABLE in driver service
        let drvRes = await fetch(`${DRIVER_API}/updatedriver/${encodeURIComponent(driverId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ status: 'AVAILABLE' }),
        });
        if (!drvRes.ok) {
          drvRes = await fetch(`${DRIVER_API}/updatedriver`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ id: driverId, status: 'AVAILABLE' }),
          });
        }

        if (!drvRes.ok) {
          console.warn('Driver status update failed while unassigning', await drvRes.text().catch(() => ''));
        } else {
          // Add driver back to availableDrivers list if not present
          const addedDriver = {
            id: driverId,
            name: order.assignedDriverName || order.driverName || 'Driver',
            phoneNumber: order.assignedDriverPhone || order.driverPhone || '',
            vehicleNumber: order.assignedDriverVehicle || order.driverVehicle || '',
            vehicleType: order.assignedDriverVehicleType || order.driverVehicleType || '',
            status: 'AVAILABLE',
          };
          setAvailableDrivers((prev) => {
            if (prev.find((d) => getDriverId(d) === driverId)) return prev;
            return [addedDriver, ...prev];
          });
        }

        // Refresh orders from backend to keep in sync
        loadOrders();
        loadAvailableDrivers();
      } catch (err) {
        console.error('Failed to unassign driver', err);
        alert('Failed to unassign driver: ' + (err.message || err));
      }
    };

  async function deleteOrderByIdAdmin(id) {
    if (!id) return;
    if (!window.confirm(`Remove order ${id}? This will permanently delete the order.`)) return;
    try {
      const res = await fetch(`${API}/deleteorder/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Server ${res.status}`);
      }
      // refresh
      loadOrders();
    } catch (err) {
      console.error('Failed to delete order', err);
      alert('Failed to remove order: ' + (err.message || err));
    }
  }

  const buildInvoiceHtmlFromJson = (data, order, type) => {
    const title = type === 'driver' ? 'Driver Bill' : 'Customer Bill';
    const items = Array.isArray(data.items) ? data.items : (order.items || []);
    const rows = (items || []).map(it => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${it.name||it.title||it.id||''}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${it.qty||1}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${(it.price!=null)?('₨'+Number(it.price).toFixed(2)):'₨0.00'}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${(it.qty&&it.price)?('₨'+(Number(it.qty)*Number(it.price)).toFixed(2)):'₨0.00'}</td>
      </tr>
    `).join('');
    const subtotal = data.total || order.totalAmount || order.total || 0;
    const customerName = (order.customerName || order.customer_name || (order.customer && order.customer.name) || 'Guest');

    return `
      <div style="font-family:Segoe UI, Arial, sans-serif;color:#111;padding:20px;">
        <h2 style="margin:0 0 8px">${title}</h2>
        <div style="margin-bottom:12px;color:#555">Order ID: ${order.orderId || order.id || order._id || ''} • Date: ${new Date(order.orderDate||order.createdAt||order.created_at||Date.now()).toLocaleString()}</div>
        <div style="margin-bottom:12px"><strong>Customer:</strong> ${customerName}</div>
        <table style="width:100%;border-collapse:collapse;margin-top:6px">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px;border:1px solid #ddd;background:#f3f4f6">Item</th>
              <th style="padding:8px;border:1px solid #ddd;background:#f3f4f6">Qty</th>
              <th style="padding:8px;border:1px solid #ddd;background:#f3f4f6">Unit</th>
              <th style="padding:8px;border:1px solid #ddd;background:#f3f4f6">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="4" style="padding:12px;text-align:center;color:#666">No items</td></tr>`}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right"><strong>Total</strong></td>
              <td style="padding:8px;border:1px solid #ddd;text-align:right"><strong>₨${Number(subtotal||0).toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  };

  const openPrintWindow = (html) => {
    const newWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      alert('Unable to open print window (blocked).');
      return;
    }
    const doc = newWindow.document;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Bill</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin:0; padding:12px; background:#fff; -webkit-print-color-adjust:exact; }
        @media print { body { margin:0 } .no-print { display:none } }
      </style>
    </head><body>${html}</body></html>`);
    doc.close();
    setTimeout(() => {
      newWindow.focus();
      newWindow.print();
    }, 300);
  };

  // Print given full HTML document via a hidden iframe (no new window)
  const printHtmlInIframe = (htmlDoc) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    // Use srcdoc where supported
    try {
      iframe.srcdoc = htmlDoc;
    } catch (e) {
      // fallback: create blob URL
      const blob = new Blob([htmlDoc], { type: 'text/html' });
      iframe.src = URL.createObjectURL(blob);
    }
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('Iframe print failed', err);
        // fallback: open in new window
        openPrintWindow(htmlDoc);
      }
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch (e) {}
      }, 1000);
    };
  };

  const printBill = async (orderId, type) => {
    const order = orders.find(o => getOrderId(o) === String(orderId)) || { id: orderId };
    try {
      const res = await fetch(`${API}/bill/${encodeURIComponent(orderId)}/${type}`);
      const ct = res.headers.get('content-type') || '';

      // If server returns a PDF, print it via a hidden iframe (no new window)
      if (ct.includes('application/pdf')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } catch (e) {
            // fallback: open the PDF in a new tab if iframe print fails
            window.open(url, '_blank');
          }
          setTimeout(() => {
            try { document.body.removeChild(iframe); } catch (e) {}
            try { URL.revokeObjectURL(url); } catch (e) {}
          }, 1000);
        };
        return;
      }

      // Non-PDF responses: handle JSON or text/html using existing window flow
      const ctLower = ct.toLowerCase();
      if (ctLower.includes('application/json')) {
        const data = await res.json();
        const htmlDoc = `<!doctype html><html><head><meta charset="utf-8"><title>Bill</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;font-family:Segoe UI,Arial,sans-serif;color:#111}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ddd}</style></head><body>${buildInvoiceHtmlFromJson(data, order, type)}</body></html>`;
        printHtmlInIframe(htmlDoc);
        return;
      }

      const text = await res.text();
      const isHtml = /<\/?(html|body|div|table|pre|h1|h2)/i.test(text);
      const htmlDoc = isHtml ? text : `<!doctype html><html><head><meta charset="utf-8"><title>Bill</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div style="font-family:Segoe UI,Arial,sans-serif;padding:18px;color:#111"><pre style="white-space:pre-wrap">${text.replace(/</g,'&lt;')}</pre></div></body></html>`;
      printHtmlInIframe(htmlDoc);
    } catch (err) {
      console.error('Failed to fetch bill', err);
      alert('Failed to fetch bill: ' + (err.message || err));
    }
  };

  // helper to render item image (supports base64 or data: uri)
  const renderItemImage = (img) => {
    if (!img) return null;
    try {
      if (String(img).startsWith('data:')) return img;
    } catch (e) {}
    return `data:image/png;base64,${img}`;
  };

  // Note: status-update actions removed per request. Cards open a details modal.

  const filtered = orders.filter(o => {
    if (!query) return true;
    const q = String(query).toLowerCase();
    const id = (o.orderId || o.id || o._id || '').toString().toLowerCase();
    const name = (o.customerName || o.customer_name || (o.customer && o.customer.name) || '').toString().toLowerCase();
    const email = (o.customerEmail || o.customer_email || (o.customer && o.customer.email) || '').toString().toLowerCase();
    return id.includes(q) || name.includes(q) || email.includes(q);
  });

  // apply status filter
  const statusFiltered = filtered.filter(o => {
    if (!statusFilter || statusFilter === 'all') return true;
    const statusRaw = (o.status || o.order_status || o.paymentStatus || '').toString().toLowerCase();
    if (statusFilter === 'pending') return statusRaw.includes('pending');
    if (statusFilter === 'completed') return statusRaw.includes('completed');
    return true;
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
        <div className="filter-group">
          <button
            className={statusFilter === 'all' ? 'btn primary' : 'btn outline'}
            onClick={() => setStatusFilter('all')}
          >All</button>
          <button
            className={statusFilter === 'pending' ? 'btn primary' : 'btn outline'}
            onClick={() => setStatusFilter('pending')}
          >Pending</button>
          <button
            className={statusFilter === 'completed' ? 'btn primary' : 'btn outline'}
            onClick={() => setStatusFilter('completed')}
          >Completed</button>
        </div>

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

      {/* TABLE VIEW */}
      <section className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Driver</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {statusFiltered.map((o) => {
              const id = getOrderId(o);
              const date = new Date(
                o.orderDate || o.createdAt || o.created_at || Date.now()
              ).toLocaleString();

              const total = parseFloat(o.totalAmount || o.total || 0) || 0;
              const driver = getOrderDriverInfo(o);
              const status = ((o.status || 'pending') + '').toLowerCase();
              const hasDriver = !!o.assignedDriverId;

              return (
                <tr key={id}>
                  {/* ID */}
                  <td className="id">#{id}</td>

                  {/* CUSTOMER */}
                  <td>
                    <strong>
                      {o.customerName ||
                        o.customer_name ||
                        (o.customer && o.customer.name) ||
                        'Guest'}
                    </strong>
                    <div className="sub">
                      {o.customerEmail ||
                        o.customer_email ||
                        (o.customer && o.customer.email)}
                    </div>
                  </td>

                  {/* DATE */}
                  <td className="date-cell">{date}</td>

                  {/* TOTAL */}
                  <td className="price">{fmt(total)}</td>

                  {/* STATUS */}
                  <td>
                    <div className="status-badges">
                      {hasDriver && (
                        <span className="status-badge assigned">ASSIGNED</span>
                      )}

                      {status.includes('completed') && (
                        <span className="status-badge completed">COMPLETED</span>
                      )}

                      {!hasDriver && !status.includes('completed') && (
                        <span className={`status-badge ${status}`}>
                          {(o.status || 'PENDING').toUpperCase()}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* DRIVER */}
                  <td>
                    {hasDriver ? (
                      <>
                        {driver.name && <strong>{driver.name}</strong>}
                        {driver.vehicle && (
                          <div className="sub">
                            {driver.vehicle}
                            {driver.vehicleType ? ` · ${driver.vehicleType}` : ''}
                          </div>
                        )}
                        {driver.phone && <div className="sub">{driver.phone}</div>}
                        {!driver.name && !driver.vehicle && !driver.phone && (
                          <div className="sub">Driver ID: {o.assignedDriverId}</div>
                        )}
                      </>
                    ) : (
                      <span className="muted">Not Assigned</span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td>
                    <div className="action-btns">
                      <button
                        className="btn small"
                        onClick={() => {
                          const basicOrderDetails = {
                            orderId: o.orderId || o.id || o._id,
                            customerName: o.customerName || o.customer_name || (o.customer && o.customer.name) || 'Guest',
                            customerEmail: o.customerEmail || o.customer_email || (o.customer && o.customer.email) || '',
                            status: o.status || 'PENDING',
                            totalAmount: o.totalAmount || o.total || 0,
                          };
                          setModalOrder(basicOrderDetails);
                        }}
                      >
                        View
                      </button>
                      <button className="btn outline small" onClick={() => printBill(id, 'customer')}>Print Customer Bill</button>
                      {hasDriver && (
                        <button className="btn outline small" onClick={() => printBill(id, 'driver')}>Print Driver Bill</button>
                      )}
            {hasDriver && !status.includes('pending') && (
                        <button
                          className="btn outline small"
                          onClick={() => openUnAssignModal(o)}
                        >
                          UnAssign
                        </button>
                      )}
                      
                      {!hasDriver && !status.includes('pending') && (
                        <button
                          className="btn outline small"
                          onClick={() => openAssignModal(o)}
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {assignModalOrder && (
        <div className="modal-overlay" onClick={closeAssignModal}>
          <div className="modal-card driver-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Driver — #{getOrderId(assignModalOrder)}</h3>
              <button className="close-btn" onClick={closeAssignModal}>✕</button>
            </div>
            <div className="modal-body">
              {driversError && <div className="assign-driver-feedback error">{driversError}</div>}
              {driversLoading && <p className="muted">Loading available drivers...</p>}
              {!driversLoading && availableDrivers.length === 0 && !driversError && (
                <div className="assign-driver-empty">
                  <h4>No available drivers</h4>
                  <p className="muted">All drivers are currently busy. Try refreshing once a driver becomes available.</p>
                </div>
              )}
              {!driversLoading && availableDrivers.length > 0 && (
                <div className="drivers-list">
                  {availableDrivers.map((driver) => {
                    const driverId = getDriverId(driver);
                    return (
                      <div className="driver-row" key={driverId || driver.email || driver.name}>
                        <div className="driver-info">
                          <div className="driver-name">{driver.name || 'Driver'}</div>
                          <div className="driver-meta">{driver.vehicleNumber || 'Vehicle N/A'}{driver.vehicleType ? ` · ${driver.vehicleType}` : ''}</div>
                          {driver.phoneNumber && <div className="driver-meta">{driver.phoneNumber}</div>}
                        </div>
                        <button
                          className="btn primary small"
                          onClick={() => assignDriverToOrder(assignModalOrder, driver)}
                          disabled={assigningDriverId === driverId}
                        >
                          {assigningDriverId === driverId ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn outline" onClick={closeAssignModal} disabled={Boolean(assigningDriverId)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

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
              {(() => {
                const driverInfo = getOrderDriverInfo(modalOrder);
                if (!driverInfo.name && !driverInfo.vehicle) return null;
                return (
                  <div className="modal-row"><strong>Driver:</strong> {driverInfo.name || 'Assigned'}{driverInfo.vehicle ? ` — ${driverInfo.vehicle}` : ''}{driverInfo.vehicleType ? ` (${driverInfo.vehicleType})` : ''}{driverInfo.phone ? ` · ${driverInfo.phone}` : ''}</div>
                );
              })()}
              <div className="modal-row"><strong>Items:</strong></div>
              <div className="modal-items">
                <table>
                  <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Line Total</th></tr></thead>
                  <tbody>
                    {(() => {
                      let itms = [];
                      try {
                        itms = typeof modalOrder.items === 'string' ? JSON.parse(modalOrder.items) : (modalOrder.items || []);
                      } catch (e) { itms = []; }
                      return itms.map((it, i) => (
                        <tr key={i}>
                          <td>
                            <div className="item-cell">
                              <div className="item-media">
                                {it.image ? (
                                  <img src={renderItemImage(it.image)} alt={it.name || it.title || ''} />
                                ) : (
                                  <div className="no-thumb" />
                                )}
                                <div className="qty-badge">{it.qty || 1}</div>
                              </div>
                              <div className="item-info">
                                <div className="item-name">{it.name || it.title || it.id}</div>
                                <div className="item-meta">Unit: {fmt(it.price || 0)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="center">{it.qty || 1}</td>
                          <td className="right">{fmt(it.price || 0)}</td>
                          <td className="right">{fmt(((parseFloat(it.price) || 0) * (it.qty || 1)))}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="modal-row"><strong>Total:</strong> {fmt(modalOrder.totalAmount||modalOrder.total||0)}</div>
            </div>
            <div className="modal-actions">
              <button className="btn outline" onClick={() => setModalOrder(null)}>Close</button>
              {((modalOrder.status||'')+'').toLowerCase().includes('completed') && (
                <button className="btn danger" onClick={() => { if(window.confirm('Remove this completed order?')){ deleteOrderByIdAdmin(modalOrder.orderId || modalOrder.id || modalOrder._id); setModalOrder(null);} }}>Remove</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
