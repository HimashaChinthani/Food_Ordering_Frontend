import React, { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
	const [open, setOpen] = useState(false);
	return (
		<div className="navbar">
			<div className="nav-brand">FoodieHub</div>
			<button className="nav-toggle" onClick={() => setOpen(o => !o)}>
				{open ? 'Close' : 'Menu'}
			</button>
			<div className={`nav-links ${open ? 'open' : ''}`}>
				<a href="/menu">Menu</a>
				<a href="/login">Login</a>
				<a href="/register">Register</a>
			</div>
			</div>
		);
	};
	
	export default Navbar;
