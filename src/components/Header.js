// src/components/Header.js
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { FaUser, FaShoppingCart } from 'react-icons/fa'; // ✅ Added icons
import CartContext from '../context/CartContext';
import './Header.css';

const Header = () => {
  const { cartItems } = useContext(CartContext);
  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);

  return (
    <header className="main-header">
      {/* Top Layer: Account - Logo - Cart */}
      <div className="header-top">
        <div className="header-left">
          <NavLink to="/account" className="icon-link">
            <FaUser className="icon" />
          </NavLink>
        </div>

        <div className="header-center">
          <NavLink to="/" className="logo">Cuztory</NavLink>
        </div>

        <div className="header-right">
          <NavLink to="/cart" className="icon-link cart-icon">
            <FaShoppingCart className="icon" />
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </NavLink>
        </div>
      </div>

      {/* Bottom Layer: Navigation */}
      <nav className="nav-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink>
        <NavLink to="/collection" className={({ isActive }) => (isActive ? 'active' : '')}>Collections</NavLink>
        <NavLink to="/track-order" className={({ isActive }) => (isActive ? 'active' : '')}>Track Order</NavLink>
        <NavLink to="/my-orders" className={({ isActive }) => (isActive ? 'active' : '')}>My Orders</NavLink>
      </nav>
    </header>
  );
};

export default Header;

