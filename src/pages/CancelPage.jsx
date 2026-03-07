import React from 'react';
import { Link } from 'react-router-dom';
import './CancelPage.css';

const CancelPage = () => {
  return (
    <div className="page-container">
      <div className="content-container">
        <h1>Payment Cancelled</h1>
        <p>Your payment has been cancelled.</p>
        <p>You can go back to the cart and try again.</p>
        <Link to="/cart" className="btn primary">Back to Cart</Link>
      </div>
    </div>
  );
};

export default CancelPage;
