import React from 'react';
import './Footer.css';

const Footer = () => {
	return (
		<footer className="site-footer">
			<div className="footer-inner">
				<p>© {new Date().getFullYear()} FoodieHub — Order fresh food online.</p>
			</div>
		</footer>
	);
};

export default Footer;
