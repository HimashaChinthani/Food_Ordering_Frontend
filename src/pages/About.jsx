import React from 'react';
import './Info.css';

const About = () => {
  return (
    <div className="info-page">
      <div className="info-hero">
        <div className="info-content">
          <h2>About FoodieHub</h2>
          <p className="lead">We connect hungry people with the best local kitchens — fast, friendly, and reliable.</p>
          <div className="info-actions">
            <a className="btn-secondary" href="#services">Our Services</a>
            <a className="btn" href="#team" style={{ background: '#11303f', color: '#fff' }}>Meet the Team</a>
          </div>
          <div className="pill-list">
            <span className="pill">Curated Menus</span>
            <span className="pill">Real-time Tracking</span>
            <span className="pill">Secure Payments</span>
          </div>
        </div>
        <div className="media-frame about-frame">
          <img src="/about.jpg" alt="About FoodieHub" />
          <div className="media-badge">Our Story</div>
        </div>
      </div>

      <div className="cards" id="services">
        <div className="card">
          <div className="icon">🍽️</div>
          <h4>Curated Menus</h4>
          <p>Hand-picked dishes from trusted local restaurants so you always find something delicious.</p>
        </div>
        <div className="card">
          <div className="icon">🚚</div>
          <h4>Fast Delivery</h4>
          <p>Optimized routes and reliable drivers ensure your food arrives hot and on time.</p>
        </div>
        <div className="card">
          <div className="icon">🔒</div>
          <h4>Secure Payments</h4>
          <p>We support multiple payment methods with secure processing and simple receipts.</p>
        </div>
      </div>

      <div className="info-section" id="team">
        <h3>Our Team</h3>
        <p>Small, passionate team focused on product, operations and local partnerships. We work closely with restaurants to bring great food to your neighborhood.</p>
      </div>
    </div>
  );
};

export default About;
