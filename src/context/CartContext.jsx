import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem('cart');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try { 
      localStorage.setItem('cart', JSON.stringify(items)); 
    } catch(e){}
  }, [items]);

  const add = (item, qty = 1) => {
    const q = Math.max(1, parseInt(qty) || 1);
    setItems(prev => {
      const found = prev.find(p => p.id === item.id);
      if (found) return prev.map(p => p.id === item.id ? { ...p, qty: (p.qty || 1) + q } : p);
      return [...prev, { ...item, qty: q }];
    });
    trySendOrder(item, q);
  };

  // Backend API endpoint
  const ORDER_API = 'http://localhost:8082/api/v3/addorder';

  async function trySendOrder(item, qty = 1) {
    if (!item) return;

    try {
      // Default user info
      let userId = null;
      let customerName = 'Guest';
      let customerEmail = '';

      // Get logged-in user info from localStorage
      try {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          const user = JSON.parse(rawUser);
          userId = user.id || user.userId || null;
          customerName = user.name || user.fullName || user.username || customerName;
          customerEmail = user.email || user.username || customerEmail;
        }
      } catch (e) {
        // fallback to older keys if present
        userId = localStorage.getItem('userId') || null;
        customerName = localStorage.getItem('customerName') || customerName;
        customerEmail = localStorage.getItem('customerEmail') || customerEmail;
      }

      const orderPayload = {
        userId, // <-- added user_id
        customerName,
        customerEmail,
        status: 'PENDING',
        totalAmount: (parseFloat(item.price) || 0) * qty,
        orderDate: new Date().toISOString(),
        items: JSON.stringify([
          { id: item.id ?? item._id ?? item.menuId, name: item.name, price: item.price, qty }
        ])
      };

      // Fire-and-forget POST
      fetch(ORDER_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      }).then(async res => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          console.warn('Order API responded with error', res.status, text);
          try { window.alert('Failed to add order: ' + (text || res.statusText || res.status)); } catch (e) {}
        } else {
          const data = await res.json().catch(() => null);
          console.log('Order created', data);
          try { window.alert('Successfully added your order'); } catch (e) {}
        }
      }).catch(err => {
        console.warn('Failed to send order to backend', err.message || err);
        try { window.alert('Failed to add order: network error'); } catch (e) {}
      });
    } catch (err) {
      console.warn('trySendOrder error', err);
    }
  }

  const remove = (item) => setItems(prev => prev.filter(p => p.id !== item.id));
  const changeQty = (item, qty) => setItems(prev => prev.map(p => p.id === item.id ? { ...p, qty } : p));
  const clear = () => setItems([]);

  const value = { items, add, remove, changeQty, clear };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
