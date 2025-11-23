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
    try { localStorage.setItem('cart', JSON.stringify(items)); } catch(e){}
  }, [items]);

  const add = (item) => {
    setItems(prev => {
      const found = prev.find(p => p.id === item.id);
      if (found) return prev.map(p => p.id === item.id ? { ...p, qty: (p.qty || 1) + 1 } : p);
      return [...prev, { ...item, qty: 1 }];
    });
  };
  const remove = (item) => setItems(prev => prev.filter(p => p.id !== item.id));
  const changeQty = (item, qty) => setItems(prev => prev.map(p => p.id === item.id ? { ...p, qty } : p));
  const clear = () => setItems([]);

  const value = { items, add, remove, changeQty, clear };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
