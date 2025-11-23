import React, { useState } from 'react';
import './Info.css';

const Contact = () => {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // This is a demo form — just show success message
    setSent(true);
    setTimeout(() => setSent(false), 3500);
  };

  return (
    <div className="info-page">
      <div className="info-hero">
        <div className="info-content">
          <h2>Contact Us</h2>
          <p className="lead">Questions, feedback, or partnership inquiries — we’re here to help.</p>
          <div className="info-actions">
            <a className="btn" href="mailto:support@foodiehub.example">Email Support</a>
            <a className="btn-secondary" href="tel:+15551234567">Call Us</a>
          </div>
        </div>
        <img src="https://source.unsplash.com/900x600/?helpdesk,contact" alt="Contact" />
      </div>

      <div className="contact-grid">
        <div className="contact-form">
          <form onSubmit={handleSubmit} className="contact-form-inner">
            <input name="name" placeholder="Your name" required />
            <input name="email" type="email" placeholder="Email address" required />
            <textarea name="message" placeholder="How can we help?" required />
            <button type="submit">Send Message</button>
            {sent && <div style={{marginTop:10,color:'#2a9d8f'}}>Message sent (demo)</div>}
          </form>
        </div>

        <div>
          <div className="contact-card">
            <h4>Contact Details</h4>
            <div className="contact-list">
              <div><strong>Email:</strong> support@foodiehub.example</div>
              <div><strong>Phone:</strong> +1 (555) 123-4567</div>
              <div><strong>Address:</strong> 123 Food St, Flavor Town</div>
            </div>
          </div>

          <div style={{marginTop:14}} className="contact-card">
            <h4>Map</h4>
            <div className="map-placeholder">Map placeholder</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
