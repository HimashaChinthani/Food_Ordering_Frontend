import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import SAMPLE from '../data/sampleProducts';
import MenuCard from '../components/MenuCard';
import { useCart } from '../context/CartContext';

const Home = () => {
  const featured = SAMPLE.slice(0, 4);
  const { add } = useCart();

  return (
    <main className="home-main">
      <div className="home-hero">
        <div className="hero-inner">
          <div className="hero-left">
            <h1>Delicious meals, delivered fast</h1>
            <p className="hero-sub">Discover local favorites and new dishes — ready to order and delivered to your door.</p>
            <div className="hero-ctas">
              <Link to="/menu" className="btn primary">Explore Menu</Link>
              <Link to="/menu" className="btn ghost" style={{marginLeft:12}}>Order Now</Link>
            </div>

            <div className="category-chips">
              <Link to="/menu?category=PIZZA" className="chip">PIZZA</Link>
              <Link to="/menu?category=BURGER" className="chip">BURGER</Link>
              <Link to="/menu?category=DRINKS" className="chip">DRINKS</Link>
              <Link to="/menu?category=DESSERT" className="chip">DESSERT</Link>
              <Link to="/menu?category=SNACKS" className="chip">SNACKS</Link>
            </div>
          </div>

          <div className="hero-right">
            <img src="https://source.unsplash.com/900x700/?food,meal" alt="Delicious food" />
          </div>
        </div>
      </div>

      <div className="container">
        <section className="featured">
          <h2>Featured dishes</h2>
          <div className="featured-grid">
            {featured.map(item => (
              <MenuCard key={item.id} item={item} onAdd={() => add(item)} />
            ))}
          </div>
        </section>

        <section className="features-grid">
          <div className="feature">
            <div className="icon">🚚</div>
            <h4>Fast Delivery</h4>
            <p>Hot meals at your door in minutes.</p>
          </div>
          <div className="feature">
            <div className="icon">🥗</div>
            <h4>Fresh Ingredients</h4>
            <p>Sourced daily from trusted vendors.</p>
          </div>
          <div className="feature">
            <div className="icon">🔒</div>
            <h4>Secure Payment</h4>
            <p>Safe checkout with multiple options.</p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Home;
