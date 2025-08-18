import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AccountPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
const AccountPage = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user')); // assuming user is stored after login
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="account-container">
        <Header />
      <h2>My Account</h2>

      {user ? (
        <>
          <div className="account-info">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>

          <div className="account-actions">
            <button onClick={() => navigate('/my-orders')}>My Orders</button>
            <button onClick={() => navigate('/track-order')}>Track Order</button>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </>
      ) : (
        <p>You are not logged in. <span className="login-link" onClick={() => navigate('/login')}>Login Now</span></p>
      )}
      <Footer />
    </div>
  );
};

export default AccountPage;
