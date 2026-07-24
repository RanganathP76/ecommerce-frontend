import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./AccountPage.css";

const AccountPage = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="cuz-account-page">
      <Header />

      <div className="cuz-account-wrapper">

        <h1 className="cuz-account-title">
          My Account
        </h1>

        {user && token ? (
          <>
            <div
              className="cuz-account-card"
              data-avatar={user?.name?.charAt(0)?.toUpperCase() || "C"}
            >
              <div className="cuz-account-heading">
                Welcome Back
              </div>

              <div className="cuz-account-subtitle">
                Manage your Cuztory account and orders.
              </div>

              <div className="cuz-account-details">

                <div className="cuz-account-item">
                  <span>Name</span>
                  <strong>{user.name}</strong>
                </div>

                <div className="cuz-account-item">
                  <span>Email</span>
                  <strong>{user.email}</strong>
                </div>

              </div>
            </div>

            <div className="cuz-account-actions">

              <button onClick={() => navigate("/my-orders")}>
                📦
                <span>My Orders</span>
              </button>

              <button onClick={() => navigate("/track-order")}>
                🚚
                <span>Track Order</span>
              </button>

              <button
                className="cuz-logout-btn"
                onClick={handleLogout}
              >
                ⎋
                <span>Logout</span>
              </button>

            </div>
          </>
        ) : (
          <div className="cuz-login-card">
            <h2>You're not logged in</h2>

            <p>
              Login to access your orders, profile and exclusive
              collections.
            </p>

            <button onClick={() => navigate("/login")}>
              Login Now
            </button>
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
};

export default AccountPage;