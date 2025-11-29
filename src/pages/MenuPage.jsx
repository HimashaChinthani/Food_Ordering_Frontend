import React, { useMemo, useState, useEffect } from 'react';
import MenuCard from '../components/MenuCard';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import './MenuPage.css';
import { useCart } from '../context/CartContext';

const API = "http://localhost:8081/api/v2";
const CATEGORIES = ['PIZZA','BURGER','DRINKS','DESSERT','SNACKS'];

const MenuPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [q, setQ] = useState('');
  const [cat, setCat] = useState(null);

  const { add } = useCart();

  // Convert Base64 to renderable URL
  const displayImage = (img) => {
    if (!img) return null;
    if (img.startsWith("data:")) return img;
    return `data:image/png;base64,${img}`;
  };

  // Load menu items from backend
  const loadItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/getmenu`);
      if (!res.ok) throw new Error("Failed to fetch");

      const json = await res.json();

      // Convert images to displayable format
      const processed = json.map(i => ({
        ...i,
        image: displayImage(i.image)
      }));

      setProducts(processed);

    } catch (err) {
      console.error(err);
      setError("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Apply search + category filters
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter(p => {
      if (cat && p.category !== cat) return false;
      if (!term) return true;
      return (p.name + ' ' + p.description)
        .toLowerCase()
        .includes(term);
    });
  }, [products, q, cat]);

  const handleAdd = (item, qty = 1) => add(item, qty);

  return (
    <div className="menu-page">
      <div className="menu-container">

        <div className="menu-controls">
          <h2 className="page-title">Our Menu</h2>

          <div className="controls-row">
            <SearchBar value={q} onChange={setQ} />
            <CategoryFilter 
              categories={CATEGORIES} 
              selected={cat} 
              onSelect={setCat} 
            />
          </div>

          <div className="current-section">
            {cat ? cat : 'All'}
          </div>
        </div>

        <div className="menu-content">

          {loading && <p>Loading menu...</p>}
          {error && <p className="error">{error}</p>}

          {!loading && (
            <div className="menu-list">
              {filtered.length === 0 ? (
                <p className="empty">No items match your search.</p>
              ) : (
                filtered.map(item => (
                  <MenuCard 
                    key={item.id} 
                    item={item} 
                    onAdd={handleAdd} 
                  />
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default MenuPage;
