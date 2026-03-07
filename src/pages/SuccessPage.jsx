import React from 'react';
import { Link } from 'react-router-dom';
import './SuccessPage.css';

const SuccessPage = () => {
  return (
    <div className="page-container">
      <div className="content-container">
        <h1>Payment Successful!</h1>
        <p>Thank you for your purchase.</p>
        <p>Your order has been processed successfully.</p>
        <Link to="/" className="btn primary">Go to Homepage</Link>
      </div>
    </div>
  );
};

export default SuccessPage;
