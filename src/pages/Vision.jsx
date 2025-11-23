import React from 'react';
import './Info.css';

const Vision = () => {
  return (
    <div className="info-page">
      <div className="info-hero">
        <div className="info-content">
          <h2>Our Vision</h2>
          <p className="lead">To be the most loved local food platform — bringing discovery, convenience and fair value to communities.</p>
          <div className="pill-list">
            <span className="pill">Discovery</span>
            <span className="pill">Community Growth</span>
            <span className="pill">Sustainability</span>
          </div>
        </div>
        <img src="https://source.unsplash.com/900x600/?future,food,city" alt="Vision" />
      </div>

      <div className="info-section">
        <h3>Where we're headed</h3>
        <div className="cards">
          <div className="card"><div className="icon">🌱</div><h4>Local Growth</h4><p>Help local restaurants thrive and create jobs.</p></div>
          <div className="card"><div className="icon">🔍</div><h4>Better Discovery</h4><p>Smarter recommendations to help you find new favorites.</p></div>
          <div className="card"><div className="icon">♻️</div><h4>Sustainability</h4><p>Invest in greener delivery and packaging options.</p></div>
        </div>
      </div>
    </div>
  );
};

export default Vision;
