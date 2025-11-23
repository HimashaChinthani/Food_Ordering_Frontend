import React from 'react';
import './Info.css';

const Mission = () => {
  return (
    <div className="info-page">
      <div className="info-hero">
        <div className="info-content">
          <h2>Our Mission</h2>
          <p className="lead">Deliver joy and convenience through great food — supporting restaurants and delighting customers.</p>
          <div className="pill-list">
            <span className="pill">Customer Delight</span>
            <span className="pill">Restaurant Support</span>
            <span className="pill">Sustainable Growth</span>
          </div>
        </div>
        <img src="https://source.unsplash.com/900x600/?delivery,driver,food" alt="Mission" />
      </div>

      <div className="info-section">
        <h3>How we achieve this</h3>
        <div className="cards">
          <div className="card"><div className="icon">📦</div><h4>Reliable Logistics</h4><p>Efficient delivery systems that minimize delays and ensure quality.</p></div>
          <div className="card"><div className="icon">🤝</div><h4>Partner Support</h4><p>Tools and analytics for restaurants to grow and improve menus.</p></div>
          <div className="card"><div className="icon">⭐</div><h4>Quality Controls</h4><p>Feedback loops and quality checks keep standards high.</p></div>
        </div>
      </div>
    </div>
  );
};

export default Mission;
