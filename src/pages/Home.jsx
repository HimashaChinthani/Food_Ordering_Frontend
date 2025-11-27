import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import MenuCard from '../components/MenuCard';
import { useCart } from '../context/CartContext';

const API = 'http://localhost:8081/api/v2';

const Home = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { add } = useCart();

  // Fetch menu items from backend
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/getmenu`);
        if (!res.ok) throw new Error('Failed to fetch menu');
        const data = await res.json();
        setMenuItems(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load menu items');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const featured = menuItems.slice(0, 4); // first 4 items as featured

  const displayImage = (img) => {
    if (!img) return null;
    if (img.startsWith('data:')) return img;
    return `data:image/png;base64,${img}`;
  };

  return (
    <main className="home-main">
      <div className="home-hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-panel">
              <div className="badge">Chef's pick</div>
              <h1>Delicious meals, delivered <span className="accent">fast</span></h1>
              <div className="hero-sub">Discover local favorites and seasonal dishes — ready to order and delivered to your door.</div>

              <p className="lead">Browse curated menus, pick your favorites, and enjoy contactless delivery.</p>

              <div className="hero-ctas">
                <Link to="/menu" className="btn primary">Explore Menu</Link>
                <Link to="/menu" className="btn ghost" style={{ marginLeft: 12 }}>Order Now</Link>
              </div>

              <div className="category-chips">
                <Link to="/menu?category=PIZZA" className="chip">PIZZA</Link>
                <Link to="/menu?category=BURGER" className="chip">BURGER</Link>
                <Link to="/menu?category=DRINKS" className="chip">DRINKS</Link>
                <Link to="/menu?category=DESSERT" className="chip">DESSERT</Link>
                <Link to="/menu?category=SNACKS" className="chip">SNACKS</Link>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <img src="/delicious.jpg" alt="Delicious plated food" loading="lazy" />
          </div>
        </div>
      </div>

      <div className="container">
        <section className="featured">
          <h2>Featured dishes</h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>{error}</p>
          ) : featured.length === 0 ? (
            <p>No featured dishes available.</p>
          ) : (
            <div className="featured-grid">
              {featured.map(item => (
                <MenuCard
                  key={item.id}
                  item={{ ...item, image: displayImage(item.image) }}
                  onAdd={() => add(item)}
                />
              ))}
            </div>
          )}
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
