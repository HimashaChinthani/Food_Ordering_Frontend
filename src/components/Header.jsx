import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import { useCart } from '../context/CartContext';

const Header = () => {
	const { items } = useCart();
	const count = items.reduce((s, it) => s + (it.qty || 1), 0);
	const [user, setUser] = useState(null);
	const [open, setOpen] = useState(false);
	const isAdmin = user && user.role && String(user.role).toLowerCase() === 'admin';
	const nav = useNavigate();
	const ref = useRef();

	useEffect(() => {
		try {
			const raw = localStorage.getItem('user');
			setUser(raw ? JSON.parse(raw) : null);
		} catch (e) {
			setUser(null);
		}
	}, []);

	useEffect(() => {
		function onDoc(e) {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		}
		document.addEventListener('click', onDoc);
		return () => document.removeEventListener('click', onDoc);
	}, []);

	const handleLogout = () => {
		localStorage.removeItem('user');
		setUser(null);
		setOpen(false);
		nav('/login');
	};

	return (
		<header className="site-header">
			<div className="header-inner">
				<Link to="/home" className="brand">Foodie<span>Hub</span></Link>
				<nav className="main-nav">
					<div className="nav-links">
						{isAdmin ? (
							<>
								<Link to="/admin">Dashboard</Link>
								<Link to="/admin/users">Users</Link>
								<Link to="/admin/orders">Orders</Link>
							</>
						) : (
							<>
								<Link to="/home">Home</Link>
								<Link to="/menu">Menu</Link>
								<Link to="/cart" className="cart-link">Cart{count>0 && <span className="badge">{count}</span>}</Link>
							</>
						)}
					</div>

					{!user ? (
						<Link to="/login" className="login-link">Login</Link>
					) : (
						<div className="profile" ref={ref}>
							<button className="profile-btn" onClick={() => setOpen(o => !o)}>
								{user.avatar ? (
									<img src={user.avatar} alt={user.name || 'Me'} />
								) : (
									<span className="initial">{(user.name || 'U').charAt(0).toUpperCase()}</span>
								)}
							</button>
							{open && (
								<div className="profile-menu">
									<Link to="/profile" onClick={() => setOpen(false)}>Profile</Link>
									<Link to="/orders" onClick={() => setOpen(false)}>Orders</Link>
									<button className="logout" onClick={handleLogout}>Logout</button>
								</div>
							)}
						</div>
					)}
				</nav>
			</div>
		</header>
	);
};

export default Header;
