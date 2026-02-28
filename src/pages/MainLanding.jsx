import React from 'react';
import { Link } from 'react-router-dom';
import './MainLanding.css';

const MainLanding = () => {
  return (
    <div className="landing-root">
      <section className="hero-wrap">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-panel" role="region" aria-label="Main call to action">
              <div className="badge">Most loved</div>
              <h1>
                Fresh meals delivered
                <span className="accent"> fast</span>
              </h1>
              <div className="sub">Taste the difference — explore local favorites</div>
              <p className="lead">Filter by cuisine, discover chef specials, and get piping hot meals to your door.</p>

              <form className="hero-search" onSubmit={(e)=>{e.preventDefault(); window.location.href='/login'}}>
                <input aria-label="Search menu" placeholder="Search dishes, restaurants or cuisines" />
                <button className="btn primary" type="submit">Order Now</button>
              </form>

              <div className="cta-row">
                <Link to="/login" className="btn outline">Login</Link>
                <Link to="/register" className="btn ghost">Create Account</Link>
              </div>

              <div className="trust-row">
                <span className="trust-pill">Free delivery over $25</span>
                <span className="trust-pill">30‑minute estimated delivery</span>
                <span className="trust-pill">Secure payments</span>
              </div>

              <div className="hero-links">
                <a href="#features">Features</a>
                <a href="#testimonials">Testimonials</a>
                <a href="#footer">Contact</a>
              </div>
            </div>
          </div>

          <div className="hero-media" aria-hidden>
            <div className="media-frame">
              <img src="/hero.png" alt="Delicious plated food" />
              <div className="media-overlay">Freshness you can taste</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features" aria-label="features">
        <div className="feature">
          <div className="icon">🚚</div>
          <h4>Fast Delivery</h4>
          <p>Optimized routes and trusted couriers bring your meals quickly.</p>
        </div>
        <div className="feature">
          <div className="icon">🍕</div>
          <h4>Top Restaurants</h4>
          <p>Hand-picked local kitchens and popular chains in one place.</p>
        </div>
        <div className="feature">
          <div className="icon">🔒</div>
          <h4>Easy Payments</h4>
          <p>Secure checkout with multiple payment methods and receipts.</p>
        </div>
      </section>

      <section id="testimonials" className="testimonials">
        <h3>What our customers say</h3>
        <div className="test-grid">
          <div className="test-card">
            <div className="stars">★ ★ ★ ★ ☆</div>
            <p>"Great food and super quick delivery — my go-to app for dinner."</p>
            <div className="auth">— Maya R.</div>
          </div>
          <div className="test-card">
            <div className="stars">★ ★ ★ ★ ★</div>
            <p>"The selection of restaurants is amazing and payment is seamless."</p>
            <div className="auth">— Carlos M.</div>
          </div>
          <div className="test-card">
            <div className="stars">★ ★ ★ ★ ☆</div>
            <p>"I love the offers and the orders always arrive hot."</p>
            <div className="auth">— Leila A.</div>
          </div>
        </div>
      </section>

      <section id="footer" className="landing-footer">
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
