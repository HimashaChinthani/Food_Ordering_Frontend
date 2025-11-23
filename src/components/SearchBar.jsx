import React from 'react';
import './SearchBar.css';

const SearchBar = ({ value = '', onChange = () => {} }) => {
  return (
    <div className="searchbar">
      <input
        className="search-input"
        placeholder="Search dishes, ingredients..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
