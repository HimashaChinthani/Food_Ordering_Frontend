import React from 'react';
import './CategoryFilter.css';

const CategoryFilter = ({ categories = [], selected = null, onSelect = () => {} }) => {
  return (
    <div className="category-filter">
      <button
        className={`cat-btn ${selected === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`cat-btn ${selected === cat ? 'active' : ''}`}
          onClick={() => onSelect(selected === cat ? null : cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
