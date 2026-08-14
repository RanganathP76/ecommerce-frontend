import React, { useEffect, useContext } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./CartPage.css";
import { 
  FaTrashAlt, 
  FaPlus, 
  FaMinus, 
  FaShoppingBag, 
  FaArrowRight, 
  FaShieldAlt, 
  FaTruck, 
  FaUndo 
} from "react-icons/fa";
import CartContext from "../context/CartContext";

const CartPage = () => {
  const { cartItems, setCartItems } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(savedCart);
  }, [location.pathname, setCartItems]);

  const updateQuantity = (index, delta) => {
    const updated = [...cartItems];
    const newQty = (updated[index].quantity || 1) + delta;

    if (newQty <= 0) {
      handleDelete(index);
      return;
    }

    updated[index].quantity = newQty;
    setCartItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  };

  

  const handleDelete = (indexToDelete) => {
    const updatedCart = cartItems.filter((_, index) => index !== indexToDelete);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("storage"));
  };

  const getSubtotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + parseFloat(item.price || 0) * (item.quantity || 1),
      0
    );
  };

  const totalItemsCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  const handleCheckout = () => {
    navigate("/checkoutStep1");
  };

  return (
    <div className="cart-page-wrapper">
      <Header />
      
      <div className="cart-container">
        <div className="cart-header-title">
          <h2>Shopping Cart</h2>
          <span className="cart-item-count-badge">
            {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}
          </span>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty-state">
            <div className="empty-icon-circle">
              <FaShoppingBag />
            </div>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/" className="continue-shopping-btn">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="cart-grid-layout">
            {/* LEFT COLUMN: Items List */}
            <div className="cart-items-column">
              {cartItems.map((item, index) => {
                const qty = item.quantity || 1;
                const price = parseFloat(item.price || 0);
                const itemTotal = qty * price;

                return (
                  <div className="pro-cart-card" key={index}>
                    <img
                      src={item.image || "/placeholder.png"}
                      alt={item.title}
                      className="pro-cart-img"
                    />

                    <div className="pro-cart-content">
                      <div className="pro-cart-top">
                        <h4 className="pro-item-title">{item.title}</h4>
                        <button
                          className="pro-delete-btn"
                          onClick={() => handleDelete(index)}
                          title="Remove item"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>

                      {/* Specifications / Variants */}
                      {item.specifications && item.specifications.length > 0 && (
                        <div className="pro-spec-pills">
                          {item.specifications.map((spec, i) => (
                            <span key={i} className="spec-pill">
                              <strong>{spec.key}:</strong> {spec.value}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Customization Details */}
                      {item.customization && item.customization.length > 0 && (
                        <div className="pro-customization-box">
                          <span className="custom-box-heading">Customizations:</span>
                          {item.customization.map((field, i) => (
                            <div key={i} className="custom-line">
                              <span className="custom-key">{field.label}:</span>{" "}
                              {field.type === "file" ? (
                                <a 
                                  href={field.value} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="file-preview-link"
                                >
                                  View Uploaded File
                                </a>
                              ) : (
                                <span className="custom-val">{field.value}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bottom Row: Stepper & Multiplied Pricing */}
                      <div className="pro-cart-bottom">
                        <div className="cart-stepper">
                          <button
                            className="cart-stepper-btn"
                            onClick={() => updateQuantity(index, -1)}
                            title="Decrease"
                          >
                            <FaMinus />
                          </button>
                          <span className="cart-stepper-qty">{qty}</span>
                          <button
                            className="cart-stepper-btn"
                            onClick={() => updateQuantity(index, 1)}
                            title="Increase"
                          >
                            <FaPlus />
                          </button>
                        </div>

                        {/* Multiplied Price Section */}
                        <div className="pro-pricing-block">
                          {qty > 1 ? (
                            <>
                              <span className="calc-breakdown">
                                {qty} × ₹{price.toLocaleString("en-IN")}
                              </span>
                              <span className="total-item-price">
                                ₹{itemTotal.toLocaleString("en-IN")}
                              </span>
                            </>
                          ) : (
                            <span className="total-item-price">
                              ₹{price.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT COLUMN: Summary & Checkout */}
            <div className="cart-summary-column">
              <div className="cart-summary-card">

                <button className="pro-checkout-btn" onClick={handleCheckout}>
                  Proceed to Checkout <FaArrowRight />
                </button>

               
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CartPage;