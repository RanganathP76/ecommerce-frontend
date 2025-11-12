// src/App.js
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import CartContext from "./context/CartContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Import pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import CollectionPage from "./pages/CollectionPage";
import CollectionProductsPage from "./pages/CollectionProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutStep1 from "./pages/CheckoutStep1";
import OrderConfirmation from "./pages/Order-Confirmation";
import TrackOrderPublic from "./pages/TrackOrderPublic";
import MyOrdersPage from "./pages/MyOrdersPage";
import AccountPage from "./pages/AccountPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import FacebookFeed from "./pages/FacebookFeed";
import FacebookFeedDownload from "./pages/FacebookFeedDownload";
// ✅ Import Facebook Pixel
import { initFacebookPixel } from "./utils/facebookPixel";

// ✅ ScrollToTop Component
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0); // Instant scroll to top
  }, [pathname]);

  return null;
}

function App() {
  const [cartItems, setCartItems] = useState(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });

  const [shippingDetails, setShippingDetails] = useState(() => {
    const stored = localStorage.getItem("shipping");
    return stored ? JSON.parse(stored) : {};
  });

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Save shipping details to localStorage
  useEffect(() => {
    localStorage.setItem("shipping", JSON.stringify(shippingDetails));
  }, [shippingDetails]);

  const saveShippingDetails = (details) => {
    setShippingDetails(details);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cart");
  };

  // ✅ Initialize Facebook Pixel once
  useEffect(() => {
    initFacebookPixel();
  }, []);

  return (
    <GoogleOAuthProvider clientId="1035657928843-47977kenpehsi3nkr54jrcr3a3h1o9qk.apps.googleusercontent.com">
      <CartContext.Provider
        value={{
          cartItems,
          setCartItems,
          clearCart,
          shippingDetails,
          saveShippingDetails,
        }}
      >
        <Router>
          <ScrollToTop /> {/* ✅ Always scroll to top on route change */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/collection/:id" element={<CollectionProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/track-order" element={<TrackOrderPublic />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/return-policy" element={<RefundPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/facebook-feed" element={<FacebookFeed />} />
            <Route path="/facebook-feed-download" element={<FacebookFeedDownload />} />
            {/* Cart & Checkout */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkoutStep1" element={<CheckoutStep1 />} />
            <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
          </Routes>
        </Router>
      </CartContext.Provider>
    </GoogleOAuthProvider>
  );
}

export default App;
