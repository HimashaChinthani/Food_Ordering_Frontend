import React from 'react';
import { Link } from 'react-router-dom';
import './MainLanding.css';

const MainLanding = () => {
  return (
    <div className="landing-root">
      <section className="hero-wrap">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>Delivering Delight — One Meal at a Time</h1>
            <p className="lead">Discover local favorites, order in seconds, and enjoy food delivered hot to your door.</p>

            <div className="cta-row">
              <Link to="/login" className="btn primary">Login</Link>
              <Link to="/register" className="btn outline">Create Account</Link>
            </div>

            <div className="trust-row">
              <span className="trust-pill">Free delivery over $25</span>
              <span className="trust-pill">30‑minute estimated delivery</span>
              <span className="trust-pill">Secure payments</span>
            </div>

            <div className="hero-links">
              <Link to="/about">About</Link>
              <Link to="/service">Services</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>

          <div className="hero-media" aria-hidden>
            <img src="https://source.unsplash.com/900x700/?gourmet,food,plated" alt="Hero food" />
          </div>
        </div>
      </section>

      <section className="features" aria-label="features">
        <div className="feature">
          <h4>Fast Delivery</h4>
          <p>Optimized routes and trusted couriers bring your meals quickly.</p>
        </div>
        <div className="feature">
          <h4>Top Restaurants</h4>
          <p>Hand-picked local kitchens and popular chains in one place.</p>
        </div>
        <div className="feature">
          <h4>Easy Payments</h4>
          <p>Secure checkout with multiple payment methods and receipts.</p>
        </div>
      </section>

      <section className="testimonials">
        <h3>What our customers say</h3>
        <div className="test-grid">
          <div className="test-card">
            <p>"Great food and super quick delivery — my go-to app for dinner."</p>
            <div className="auth">— Maya R.</div>
          </div>
          <div className="test-card">
            <p>"The selection of restaurants is amazing and payment is seamless."</p>
            <div className="auth">— Carlos M.</div>
          </div>
          <div className="test-card">
            <p>"I love the offers and the orders always arrive hot."</p>
            <div className="auth">— Leila A.</div>
          </div>
        </div>
      </section>

      <section className="landing-footer">
        <div className="footer-grid">
          <div>
            <h4>FoodieHub</h4>
            <p>Delivering the best of your neighborhood to your door.</p>
          </div>
          <div>
            <h5>Explore</h5>
            <Link to="/about">About</Link>
            <Link to="/service">Services</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div>
            <h5>Legal</h5>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>
        <div className="copyright">© {new Date().getFullYear()} FoodieHub. All rights reserved.</div>
      </section>
    </div>
  );
};

export default MainLanding;
