import React from 'react';
import './Cart.css';

const Cart = ({ items = [], onRemove = () => {}, onChangeQty = () => {} }) => {
  const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
  return (
    <aside className="cart-box">
      <h3>Your Cart</h3>
      {items.length === 0 ? (
        <p className="empty">Your cart is empty</p>
      ) : (
        <div className="cart-list">
          {items.map((it) => (
            <div className="cart-item" key={it.id || it.name}>
              <img src={it.image || '/assets/placeholder-food.png'} alt={it.name} />
              <div className="meta">
                <div className="name">{it.name}</div>
                <div className="controls">
                  <button onClick={() => onChangeQty(it, Math.max(1, (it.qty||1)-1))}>-</button>
                  <span>{it.qty || 1}</span>
                  <button onClick={() => onChangeQty(it, (it.qty||1)+1)}>+</button>
                </div>
              </div>
              <div className="right">
                <div className="price">₨{((it.price||0)*(it.qty||1)).toFixed(2)}</div>
                <button className="remove" onClick={() => onRemove(it)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="cart-footer">
        <div className="subtotal">Subtotal <span>₨{subtotal.toFixed(2)}</span></div>
        <button className="checkout">Checkout</button>
      </div>
    </aside>
  );
};

export default Cart;
