import React from 'react';
import { Link } from 'react-router-dom';
import './MenuCard.css';

const MenuCard = ({ item = {}, onAdd = () => {} }) => {
	return (
		<div className="menu-card">
			<div className="menu-card-media">
				<Link to={`/menu/${item.id}`}>
					<img
						className="menu-card-img"
						src={item.image || '/assets/placeholder-food.png'}
						alt={item.name || 'menu item'}
					/>
				</Link>
			</div>
			<div className="menu-card-body">
				<h3 className="menu-card-title"><Link to={`/menu/${item.id}`}>{item.name || 'Untitled'}</Link></h3>
				<p className="menu-card-desc">{item.description || 'Delicious item'}</p>
				<div className="menu-card-footer">
					<span className="menu-card-price">₨{item.price ?? '0.00'}</span>
					<button className="menu-card-add" onClick={() => onAdd(item)}>
						Add
					</button>
				</div>
			</div>
		</div>
	);
};

export default MenuCard;
