import React from 'react';
import './Footer.css';

const Footer = () => {
	return (
		<footer className="site-footer">
			<div className="footer-inner">
				<div className="footer-section">
					<h4>About Us</h4>
					<p>© {new Date().getFullYear()} FoodieHub — Order fresh food online.</p>
				</div>
				<div className="footer-section">
					<h4>Contact</h4>
					<p>123 Foodie Lane, Flavor Town, 12345</p>
					<p>Email: <a href="mailto:contact@foodiehub.com">contact@foodiehub.com</a></p>
					<p>Phone: <a href="tel:+1234567890">(123) 456-7890</a></p>
				</div>
				<div className="footer-section">
					<h4>Quick Links</h4>
					<a href="/menu">Menu</a>
					<a href="/about">About</a>
					<a href="/contact">Contact</a>
				</div>
			</div>
			<div className="footer-bottom">
				<p>All rights reserved.</p>
			</div>
		</footer>
	);
};

export default Footer;
