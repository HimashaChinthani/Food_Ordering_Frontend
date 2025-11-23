import React, { useMemo, useState } from 'react';
import MenuCard from '../components/MenuCard';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import './MenuPage.css';
import SAMPLE from '../data/sampleProducts';
import { useCart } from '../context/CartContext';

const CATEGORIES = ['PIZZA','BURGER','DRINKS','DESSERT','SNACKS'];

const MenuPage = () => {
  const [products] = useState(SAMPLE);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(null);
  const { add } = useCart();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter(p => {
      if (cat && p.category !== cat) return false;
      if (!term) return true;
      return (p.name + ' ' + p.description).toLowerCase().includes(term);
    });
  }, [products, q, cat]);

  const handleAdd = (item) => add(item);

  return (
    <div className="menu-page">
      <div className="menu-container">
        <div className="menu-controls">
          <h2 className="page-title">Our Menu</h2>
          <div className="controls-row">
            <SearchBar value={q} onChange={setQ} />
            <CategoryFilter categories={CATEGORIES} selected={cat} onSelect={setCat} />
          </div>
          <div className="current-section">{cat ? cat : 'All'}</div>
        </div>

        <div className="menu-content">
          <div className="menu-list">
            {filtered.length === 0 ? (
              <p className="empty">No items match your search.</p>
            ) : (
              filtered.map(item => (
                <MenuCard key={item.id} item={item} onAdd={handleAdd} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
