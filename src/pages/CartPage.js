import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./CartPage.css";
import { FaTrashAlt } from "react-icons/fa";
import CartContext from "../context/CartContext";

const CartPage = () => {
  const { cartItems, setCartItems } = useContext(CartContext);
  const navigate = useNavigate();

  // Load cart from localStorage once on mount
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCartItems(savedCart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only run on mount, remove cartItems from dependencies

  const getTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + (parseFloat(item.price || 0) * (item.quantity || 1)),
      0
    );
  };

  const handleCheckout = () => {
    navigate("/checkoutStep1");
  };

  const handleDelete = (indexToDelete) => {
    const updatedCart = cartItems.filter((_, index) => index !== indexToDelete);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  return (
    <div>
      <Header />
      <div className="cart-page">
        <h2>Your Cart</h2>
        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div className="cart-items">
            {cartItems.map((item, index) => (
              <div className="cart-item" key={index}>
                <img
                  src={item.image || "/placeholder.png"}
                  alt={item.title}
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <div className="cart-item-header">
                    <h4>{item.title}</h4>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(index)}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                  <p>Price: ₹{item.price} x {item.quantity || 1}</p>
                  {item.customization && item.customization.length > 0 && (
                    <div className="customization-details">
                      <h5>Customization:</h5>
                      {item.customization.map((field, i) => (
                        <div key={i} className="custom-field">
                          <strong>{field.label}:</strong>
                          {field.type === "file" ? (
                            <span> {field.value.split("/").pop()}</span>
                          ) : (
                            <span> {field.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="cart-summary">
              <h3>Total: ₹{getTotal()}</h3>
              <button className="checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CartPage;
