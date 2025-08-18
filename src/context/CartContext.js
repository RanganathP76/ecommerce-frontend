
import React, { createContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(savedCart);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item) => {
    // check if item already exists (optional)
    const existingIndex = cartItems.findIndex(
      (i) => i._id === item._id
    );
    let updatedCart = [];
    if (existingIndex >= 0) {
      // If product exists, increase quantity
      updatedCart = [...cartItems];
      updatedCart[existingIndex].quantity =
        (updatedCart[existingIndex].quantity || 1) + 1;
    } else {
      updatedCart = [...cartItems, { ...item, quantity: 1 }];
    }
    setCartItems(updatedCart);
  };

  const removeFromCart = (index) => {
    const updatedCart = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedCart);
  };

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider
      value={{ cartItems, setCartItems, addToCart, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
