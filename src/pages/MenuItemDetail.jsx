import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SAMPLE from '../data/sampleProducts';
import './MenuItemDetail.css';
import { useCart } from '../context/CartContext';

const MenuItemDetail = () => {
  const { id } = useParams();
  const item = SAMPLE.find(s => String(s.id) === String(id));
  const { add } = useCart();

  if (!item) return (
    <div style={{padding:24}}>Item not found. <Link to="/menu">Back to menu</Link></div>
  );

  return (
    <div className="detail-page">
      <div className="detail-container">
        <div className="detail-media">
          <img src={item.image} alt={item.name} />
        </div>
        <div className="detail-info">
          <h2>{item.name}</h2>
          <p className="category">{item.category}</p>
          <p className="desc">{item.description}</p>
          <div className="meta">
            <div className="price">₨{item.price.toFixed(2)}</div>
            <div>
              <button className="btn primary" onClick={() => add(item)}>Add to cart</button>
              <Link to="/menu" className="btn ghost" style={{marginLeft:10}}>Back</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemDetail;
