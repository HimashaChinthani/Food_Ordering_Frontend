import React from 'react';
import './Info.css';

const Service = () => {
  const services = [
    { icon: '🍽️', title: 'Browse Menus', desc: 'Search and discover curated menus from local favorites.' },
    { icon: '🛒', title: 'Order & Pay', desc: 'Easy ordering, flexible payments and receipts.' },
    { icon: '🚚', title: 'Delivery or Pickup', desc: 'Choose delivery or pickup depending on your schedule.' },
    { icon: '📍', title: 'Live Tracking', desc: 'Track your order in real time from kitchen to doorstep.' },
    { icon: '🎁', title: 'Offers & Rewards', desc: 'Loyalty programs and occasional discounts for repeat customers.' },
    { icon: '🤝', title: 'Partner Tools', desc: 'Tools for restaurants to manage orders and menus.' },
  ];

  return (
    <div className="info-page">
      <div className="info-hero">
        <div className="info-content">
          <h2>Services We Provide</h2>
          <p className="lead">A full suite of features to make ordering food delightful for customers and manageable for restaurants.</p>
        </div>
        <img src="https://source.unsplash.com/900x600/?food,service,delivery" alt="Service" />
      </div>

      <div className="info-section">
        <div className="cards">
          {services.map((s, i) => (
            <div className="card" key={i}>
              <div className="icon">{s.icon}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Service;
