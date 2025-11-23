import React from 'react';
import { useCart } from '../context/CartContext';
import './CartPage.css';

const CartPage = () => {
  const { items, remove, changeQty, clear } = useCart();
  const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);

  return (
    <main className="cart-page">
      <div className="container">
        <h2>Your Cart</h2>
        {items.length === 0 ? (
          <p className="empty">Your cart is empty.</p>
        ) : (
          <div className="cart-list">
            {items.map(it => (
              <div className="row" key={it.id}>
                <img src={it.image} alt={it.name} />
                <div className="meta">
                  <h4>{it.name}</h4>
                  <div className="controls">
                    <button onClick={() => changeQty(it, Math.max(1, (it.qty||1)-1))}>-</button>
                    <span>{it.qty}</span>
                    <button onClick={() => changeQty(it, (it.qty||1)+1)}>+</button>
                  </div>
                </div>
                <div className="right">
                  <div className="price">₨{((it.price||0)*(it.qty||1)).toFixed(2)}</div>
                  <button className="remove" onClick={() => remove(it)}>Remove</button>
                </div>
              </div>
            ))}
            <div className="summary">
              <div>Subtotal</div>
              <div className="total">₨{subtotal.toFixed(2)}</div>
            </div>
            <div className="actions">
              <button className="checkout">Proceed to Checkout</button>
              <button className="clear" onClick={() => clear()}>Clear</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default CartPage;
