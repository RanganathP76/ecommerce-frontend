import React, { useEffect, useContext, useState } from "react";
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
  FaExclamationTriangle,
  FaTimes
} from "react-icons/fa";
import CartContext from "../context/CartContext";
import axiosInstance from "../axiosInstance";

const CartPage = () => {
  const { cartItems, setCartItems } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [validating, setValidating] = useState(false);

  // 🔔 UI Modal State for Price Changes & Stock Issues
  const [cartModal, setCartModal] = useState({
    show: false,
    title: "",
    message: "",
    oldPrice: null,
    newPrice: null,
    productTitle: "",
  });

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

  const totalItemsCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  // 🛡️ Live Server Verification on Cart Proceed
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setValidating(true);

    try {
      let updatedCart = [...cartItems];
      let hasChanges = false;
      const initialItemCount = cartItems.length;
      let lastFailedProductId = null;

      for (let i = updatedCart.length - 1; i >= 0; i--) {
        const item = updatedCart[i];
        try {
          const { data: serverProd } = await axiosInstance.get(`/products/${item._id}`);
          if (!serverProd) {
            lastFailedProductId = item._id;
            updatedCart.splice(i, 1);
            hasChanges = true;
            setCartModal({
              show: true,
              title: "Item Unavailable",
              message: `"${item.title}" is no longer available and was removed from your cart.`,
              oldPrice: null,
              newPrice: null,
              productTitle: item.title,
            });
            continue;
          }

          let extra = 0;
          let inStock = true;

          if (item.specifications && item.specifications.length > 0) {
            for (const spec of item.specifications) {
              const serverSpec = serverProd.specifications?.find((s) => s.key === spec.key);
              const serverVal = serverSpec?.values?.find((v) => v.value === spec.value);

              if (!serverVal || (serverVal.stock !== undefined && serverVal.stock < item.quantity)) {
                inStock = false;
                break;
              }
              if (serverVal.extraPrice) {
                extra += Number(serverVal.extraPrice);
              }
            }
          } else {
            if (serverProd.stock !== undefined && serverProd.stock < item.quantity) {
              inStock = false;
            }
          }

          if (!inStock) {
            lastFailedProductId = item._id;
            updatedCart.splice(i, 1);
            hasChanges = true;
            setCartModal({
              show: true,
              title: "Out of Stock",
              message: `Sorry, "${item.title}" is out of stock and was removed from your cart.`,
              oldPrice: null,
              newPrice: null,
              productTitle: item.title,
            });
            continue;
          }

          const freshPrice = Number(serverProd.price) + extra;
          if (Number(item.price) !== freshPrice) {
            setCartModal({
              show: true,
              title: "Price Updated",
              message: "The price for this item has changed to match the latest live store price.",
              oldPrice: Number(item.price),
              newPrice: freshPrice,
              productTitle: item.title,
            });
            updatedCart[i].price = freshPrice;
            hasChanges = true;
          }
        } catch (err) {
          lastFailedProductId = item._id;
          updatedCart.splice(i, 1);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        setCartItems(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("storage"));

        if (updatedCart.length === 0) {
          if (initialItemCount === 1 && lastFailedProductId) {
            navigate(`/product/${lastFailedProductId}`);
          } else {
            navigate("/");
          }
          setValidating(false);
          return;
        }
        setValidating(false);
        return;
      }

      setValidating(false);
      navigate("/checkoutStep1");
    } catch (e) {
      console.error(e);
      setCartModal({
        show: true,
        title: "Check Failed",
        message: "Failed to verify cart items with the server. Please try again.",
        oldPrice: null,
        newPrice: null,
        productTitle: "",
      });
      setValidating(false);
    }
  };

  return (
    <div className="cart-page-wrapper">
      <Header />

      {/* 🚀 PRICE CHANGE / OUT OF STOCK MODAL */}
      {cartModal.show && (
        <div className="cart-modal-overlay">
          <div className="cart-modal-card">
            <button 
              className="cart-modal-close" 
              onClick={() => setCartModal({ ...cartModal, show: false })}
            >
              <FaTimes />
            </button>
            <div className="cart-modal-icon-wrap">
              <FaExclamationTriangle />
            </div>
            <h3>{cartModal.title}</h3>
            {cartModal.productTitle && (
              <p className="cart-modal-prod">{cartModal.productTitle}</p>
            )}
            <p className="cart-modal-msg">{cartModal.message}</p>

            {cartModal.oldPrice !== null && cartModal.newPrice !== null && (
              <div className="cart-price-shift-container">
                <div className="cart-price-shift-box old">
                  <span className="cart-price-shift-label">Previous</span>
                  <span className="cart-price-shift-val">₹{cartModal.oldPrice}</span>
                </div>
                <div className="cart-price-shift-arrow">
                  <FaArrowRight />
                </div>
                <div className="cart-price-shift-box new">
                  <span className="cart-price-shift-label">Updated</span>
                  <span className="cart-price-shift-val">₹{cartModal.newPrice}</span>
                </div>
              </div>
            )}

            <button 
              className="cart-modal-btn" 
              onClick={() => setCartModal({ ...cartModal, show: false })}
            >
              Review & Continue
            </button>
          </div>
        </div>
      )}
      
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

                      {item.specifications && item.specifications.length > 0 && (
                        <div className="pro-spec-pills">
                          {item.specifications.map((spec, i) => (
                            <span key={i} className="spec-pill">
                              <strong>{spec.key}:</strong> {spec.value}
                            </span>
                          ))}
                        </div>
                      )}

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

            <div className="cart-summary-column">
              <div className="cart-summary-card">
                <button 
                  className="pro-checkout-btn" 
                  onClick={handleCheckout}
                  disabled={validating}
                >
                  {validating ? "Checking items..." : "Proceed to Checkout"} <FaArrowRight />
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