import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './MenuCard.css';
import QuantityModal from './QuantityModal';

const MenuCard = ({ item = {}, onAdd = () => {} }) => {
	const [openQty, setOpenQty] = useState(false);

	const handleClickAdd = () => {
		setOpenQty(true);
	};

	const handleConfirmQty = (qty) => {
		setOpenQty(false);
		onAdd(item, qty);
	};

	return (
		<div className="menu-card">
			<div className="menu-card-media">
				<Link to={`/menu/${item.id ?? item._id ?? item.menuid ?? item.menuId}`}>
					<img
						className="menu-card-img"
						src={item.image || '/assets/placeholder-food.png'}
						alt={item.name || 'menu item'}
					/>
				</Link>
			</div>
			<div className="menu-card-body">
				<h3 className="menu-card-title"><Link to={`/menu/${item.id ?? item._id ?? item.menuid ?? item.menuId}`}>{item.name || 'Untitled'}</Link></h3>
				<p className="menu-card-desc">{item.description || 'Delicious item'}</p>
				<div className="menu-card-footer">
					<span className="menu-card-price">₨{item.price ?? '0.00'}</span>
					<button className="menu-card-add" onClick={handleClickAdd}>
						Add
					</button>
				</div>
			</div>
			<QuantityModal
				open={openQty}
				initial={1}
				onClose={() => setOpenQty(false)}
				onConfirm={handleConfirmQty}
			/>
		</div>
	);
};

export default MenuCard;
