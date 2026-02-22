import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import { useCart } from '../context/CartContext';

const Header = () => {
	const { items } = useCart();
	const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
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
		// fetch pending orders for logged-in user and update badge
		async function fetchPending() {
			try {
				const raw = localStorage.getItem('user');
				if (!raw) {
					setPendingOrdersCount(0);
					return;
				}
				const u = JSON.parse(raw);
				const userId = u.id ?? u._id ?? u.userId ?? u.userid ?? null;
				const email = u.email ?? u.user_email ?? null;

				const url = userId
					? `http://localhost:8082/api/v3/getorders?user_id=${encodeURIComponent(userId)}`
					: (email ? `http://localhost:8082/api/v3/getordersms?email=${encodeURIComponent(email)}` : null);

				if (!url) {
					setPendingOrdersCount(0);
					return;
				}

				const res = await fetch(url, { headers: { Accept: 'application/json' } });
				if (!res.ok) {
					setPendingOrdersCount(0);
					return;
				}

				const data = await res.json();
				const arr = Array.isArray(data) ? data : (data.orders || (data.data && Array.isArray(data.data) ? data.data : [data]));

				const filtered = arr.filter(order => {
					const oid = order.user_id ?? order.userId ?? order.user ?? order.customerId ?? order.customer_id ?? order.userid ?? order.id ?? null;
					const oemail = (order.customerEmail ?? order.customer_email ?? order.email ?? (order.customer && order.customer.email) ?? '').toString().toLowerCase();
					const matchById = userId && oid != null && String(oid) === String(userId);
					const matchByEmail = email && oemail && oemail === String(email).toLowerCase();
					if (!(matchById || matchByEmail)) return false;

					const statusRaw = (order.status ?? order.order_status ?? order.paymentStatus ?? '').toString();
					const status = statusRaw.trim().toLowerCase();
					return status.includes('pending');
				});

				setPendingOrdersCount(filtered.length);
			} catch (e) {
				setPendingOrdersCount(0);
			}
		}

		fetchPending();
	}, [items]);

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
										<Link to="/cart" className="cart-link">Cart{pendingOrdersCount > 0 && <span className="badge">{pendingOrdersCount}</span>}</Link>
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
