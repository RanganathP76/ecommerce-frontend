import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import CartContext from "../context/CartContext";
import "./CheckoutStep1.css";
import Footer from "../components/Footer";
import PageLoader from "../components/PageLoader";
import { FaExclamationTriangle, FaArrowRight, FaTimes } from "react-icons/fa";

const CheckoutStep1 = () => {
  const { cartItems: contextCartItems, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  // If a direct buy item was sent via route state, checkout ONLY that item; otherwise use the cart
  const isDirectBuy = Boolean(location.state?.directBuyItem);
  const [checkoutItems, setCheckoutItems] = useState(() => {
    if (location.state?.directBuyItem) {
      return [location.state.directBuyItem];
    }
    const saved = JSON.parse(localStorage.getItem("cart")) || [];
    return saved.length > 0 ? saved : contextCartItems;
  });

  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [shippingRates, setShippingRates] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState(null);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const clickedOnceRef = useRef(false);

  const [priceChangeModal, setPriceChangeModal] = useState({
    show: false,
    title: "",
    message: "",
    oldPrice: null,
    newPrice: null,
    productTitle: "",
  });

  const RAZORPAY_KEY = "rzp_live_HirbfaYGKt499v";
  const token = localStorage.getItem("token");

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setShippingInfo({ ...shippingInfo, phone: value });
    }
  };

  const itemsPrice = checkoutItems.reduce((acc, item) => {
    const price = parseFloat(item.price || 0);
    return acc + (isNaN(price) ? 0 : price * (item.quantity || 1));
  }, 0);

  const shippingPrice = selectedShipping ? selectedShipping.rate : 0;

  const getDiscount = () => {
    if (paymentOptions?.fullPrepaid?.enabled) {
      const { discountType, discountValue } = paymentOptions.fullPrepaid;
      return discountType === "percent"
        ? (itemsPrice * discountValue) / 100
        : discountValue;
    }
    return 0;
  };

  const getAdvance = () => {
    if (paymentOptions?.partialPayment?.enabled) {
      const { partialType, partialValue } = paymentOptions.partialPayment;
      return partialType === "percent"
        ? (itemsPrice * partialValue) / 100
        : partialValue;
    }
    return 0;
  };

  const discount = selectedPayment === "fullPrepaid" ? getDiscount() : 0;
  const advance = selectedPayment === "partialPayment" ? getAdvance() : 0;
  const total = itemsPrice + shippingPrice - discount;
  const payableNow =
    selectedPayment === "partialPayment"
      ? advance
      : selectedPayment === "fullPrepaid"
      ? total
      : 0;

  const previewFullPrepaidTotal = Math.round(
    itemsPrice + shippingPrice - getDiscount()
  );
  const previewFullPrepaidSave = Math.round(getDiscount());
  const previewPartialNow = Math.round(getAdvance());
  const previewPartialLater = Math.round(itemsPrice + shippingPrice - getAdvance());
  const previewCOD = Math.round(itemsPrice + shippingPrice);

  useEffect(() => {
    axiosInstance
      .get("/shipping-rates")
      .then((res) => {
        const enabledRates = res.data.filter((rate) => rate.enabled);
        setShippingRates(enabledRates);
        if (enabledRates.length > 0) setSelectedShipping(enabledRates[0]);
      })
      .catch(console.error);

    axiosInstance
      .get("/payment-config/get")
      .then((res) => {
        setPaymentOptions(res.data);
        if (res.data?.fullPrepaid?.enabled) setSelectedPayment("fullPrepaid");
        else if (res.data?.partialPayment?.enabled)
          setSelectedPayment("partialPayment");
        else if (res.data?.cod?.enabled) setSelectedPayment("COD");
      })
      .catch(console.error);
  }, []);

  const guardClick = () => {
    if (processing || clickedOnceRef.current) return false;
    clickedOnceRef.current = true;
    setProcessing(true);
    return true;
  };

  const verifyLatestCartData = async () => {
    let updatedCheckout = [...checkoutItems];
    let hasChanges = false;
    const initialItemCount = checkoutItems.length;
    let lastFailedProductId = null;

    for (let i = updatedCheckout.length - 1; i >= 0; i--) {
      const item = updatedCheckout[i];
      try {
        const { data: serverProd } = await axiosInstance.get(`/products/${item._id}`);
        if (!serverProd) {
          lastFailedProductId = item._id;
          updatedCheckout.splice(i, 1);
          hasChanges = true;
          setPriceChangeModal({
            show: true,
            title: "Item Unavailable",
            message: `"${item.title}" is no longer available and was removed.`,
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

            if (!serverVal || (serverVal.stock !== undefined && serverVal.stock < (item.quantity || 1))) {
              inStock = false;
              break;
            }
            if (serverVal.extraPrice) {
              extra += Number(serverVal.extraPrice);
            }
          }
        } else {
          if (serverProd.stock !== undefined && serverProd.stock < (item.quantity || 1)) {
            inStock = false;
          }
        }

        if (!inStock) {
          lastFailedProductId = item._id;
          updatedCheckout.splice(i, 1);
          hasChanges = true;
          setPriceChangeModal({
            show: true,
            title: "Out of Stock",
            message: `Sorry, "${item.title}" is out of stock.`,
            oldPrice: null,
            newPrice: null,
            productTitle: item.title,
          });
          continue;
        }

        const freshPrice = Number(serverProd.price) + extra;
        if (Number(item.price) !== freshPrice) {
          setPriceChangeModal({
            show: true,
            title: "Price Updated",
            message: "The price for this item has been updated to reflect current pricing.",
            oldPrice: Number(item.price),
            newPrice: freshPrice,
            productTitle: item.title,
          });
          updatedCheckout[i].price = freshPrice;
          hasChanges = true;
        }
      } catch (err) {
        lastFailedProductId = item._id;
        updatedCheckout.splice(i, 1);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setCheckoutItems(updatedCheckout);
      if (!isDirectBuy) {
        localStorage.setItem("cart", JSON.stringify(updatedCheckout));
        window.dispatchEvent(new Event("storage"));
      }

      if (updatedCheckout.length === 0) {
        if (initialItemCount === 1 && lastFailedProductId) {
          navigate(`/product/${lastFailedProductId}`);
        } else {
          navigate("/");
        }
        return false;
      }
      return false;
    }

    return true;
  };

  const handleCOD = async () => {
    if (!guardClick()) return;

    if (
      !shippingInfo.name ||
      !shippingInfo.email ||
      !shippingInfo.phone ||
      !shippingInfo.address ||
      !shippingInfo.city ||
      !shippingInfo.state ||
      !shippingInfo.postalCode ||
      !selectedShipping
    ) {
      alert("Please fill in all required shipping fields (including email).");
      setProcessing(false);
      clickedOnceRef.current = false;
      return;
    }

    if (shippingInfo.phone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      setProcessing(false);
      clickedOnceRef.current = false;
      return;
    }

    const isValid = await verifyLatestCartData();
    if (!isValid) {
      setProcessing(false);
      clickedOnceRef.current = false;
      return;
    }

    const orderItems = checkoutItems.map((item) => ({
      product: item._id,
      name: item.title,
      image: item.image || "",
      quantity: item.quantity ? Number(item.quantity) : 1,
      customization: item.customization || [],
      specifications: item.specifications || [],
    }));

    axiosInstance
      .post(
        "/orders/create",
        {
          orderItems,
          shippingInfo,
          shippingId: selectedShipping._id,
          paymentMethod: "COD",
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      .then((res) => {
        if (!isDirectBuy) {
          clearCart();
        }
        window.location.href = `/order-confirmation/${res.data.order._id}`;
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.message || "Order creation failed.");
        setProcessing(false);
        clickedOnceRef.current = false;
      });
  };

  const handlePrepaid = async () => {
    if (!guardClick()) return;

    if (
      !shippingInfo.name ||
      !shippingInfo.email ||
      !shippingInfo.phone ||
      !shippingInfo.address ||
      !shippingInfo.city ||
      !shippingInfo.state ||
      !shippingInfo.postalCode ||
      !selectedShipping
    ) {
      alert("Please fill in all required shipping fields (including email).");
      setProcessing(false);
      clickedOnceRef.current = false;
      return;
    }

    if (shippingInfo.phone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      setProcessing(false);
      clickedOnceRef.current = false;
      return;
    }

    const isValid = await verifyLatestCartData();
    if (!isValid) {
      setProcessing(false);
      clickedOnceRef.current = false;
      return;
    }

    if (!razorpayLoaded) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => setRazorpayLoaded(true);
      document.body.appendChild(script);
      await new Promise((resolve) => (script.onload = resolve));
    }

    try {
      const orderItems = checkoutItems.map((item) => ({
        product: item._id,
        name: item.title,
        image: item.image || "",
        quantity: item.quantity ? Number(item.quantity) : 1,
        customization: item.customization || [],
        specifications: item.specifications || [],
      }));

      const res = await axiosInstance.post(
        "/orders/create",
        {
          orderItems,
          shippingInfo,
          shippingId: selectedShipping._id,
          paymentMethod: selectedPayment === "partialPayment" ? "PARTIAL" : "RAZORPAY",
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      const { razorpayOrder } = res.data;

      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY,
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "Cuztory",
        description: "Order Payment",
        order_id: razorpayOrder.id,
        handler: async function (response) {
          setProcessingPayment(true);
          if (!isDirectBuy) {
            clearCart();
          }
          try {
            let retries = 15;
            while (retries--) {
              const result = await axiosInstance.get(
                `/orders/by-razorpay/${response.razorpay_order_id}`
              );
              if (result.data.success) {
                window.location.replace(
                  `/order-confirmation/${result.data.orderId}`
                );
                return;
              }
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
            alert("Payment received. Your order is still being finalized.");
            window.location.replace("/my-orders");
          } catch (err) {
            console.error(err);
            window.location.replace("/my-orders");
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            clickedOnceRef.current = false;
            alert("Payment cancelled, Please try again.");
          },
        },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Payment initiation failed.");
      setProcessing(false);
      clickedOnceRef.current = false;
    }
  };

  if (processingPayment) {
    return <PageLoader />;
  }

  return (  
    <div className="checkout-container">
      {priceChangeModal.show && (
        <div className="price-modal-overlay">
          <div className="price-modal-card">
            <button 
              className="price-modal-close" 
              onClick={() => setPriceChangeModal({ ...priceChangeModal, show: false })}
            >
              <FaTimes />
            </button>
            <div className="price-modal-icon-wrap">
              <FaExclamationTriangle />
            </div>
            <h3>{priceChangeModal.title}</h3>
            <p className="price-modal-prod">{priceChangeModal.productTitle}</p>
            <p className="price-modal-msg">{priceChangeModal.message}</p>

            {priceChangeModal.oldPrice !== null && priceChangeModal.newPrice !== null && (
              <div className="price-shift-container">
                <div className="price-shift-box old">
                  <span className="price-shift-label">Previous</span>
                  <span className="price-shift-val">₹{priceChangeModal.oldPrice}</span>
                </div>
                <div className="price-shift-arrow">
                  <FaArrowRight />
                </div>
                <div className="price-shift-box new">
                  <span className="price-shift-label">Updated</span>
                  <span className="price-shift-val">₹{priceChangeModal.newPrice}</span>
                </div>
              </div>
            )}

            <button 
              className="price-modal-btn" 
              onClick={() => setPriceChangeModal({ ...priceChangeModal, show: false })}
            >
              Review & Continue
            </button>
          </div>
        </div>
      )}

      <div className="checkout-header">
        <div className="checkout-header-inner">
          <span className="brand-name">Cuztory</span>
        </div>
      </div>

      <h2>Checkout</h2>

      <div className="checkout-cart-wrapper">
        <h3>{isDirectBuy ? "Order Summary" : "Your Cart"}</h3>
        <div className="checkout-cart-box">
          {checkoutItems.map((item, idx) => (
            <div key={idx} className="checkout-cart-item">
              <img
                src={item.image || "/placeholder.png"}
                alt={item.title}
                className="checkout-cart-image"
              />
              <div className="checkout-cart-details">
                <strong>{item.title}</strong>
                <br />
                <span>
                  ₹{item.price} x {item.quantity}
                </span>

                {item.specifications?.length > 0 && (
                  <div className="cart-specs">
                    {item.specifications.map((s, i) => (
                      <div key={i}>
                        <strong>{s.key}:</strong> {s.value}
                      </div>
                    ))}
                  </div>
                )}

                {item.customization?.length > 0 &&
                  item.customization.map((c, i) => (
                    <div key={i}>
                      <strong>{c.label}:</strong>{" "}
                      {c.type === "file" ? c.value?.split("/").pop() : c.value}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shipping-info">
        <h3>Shipping Info</h3>
        <input
          type="text"
          placeholder="name"
          value={shippingInfo.name}
          onChange={(e) =>
            setShippingInfo({ ...shippingInfo, name: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="email"
          value={shippingInfo.email}
          onChange={(e) =>
            setShippingInfo({ ...shippingInfo, email: e.target.value })
          }
        />

        <div className="phone-input-container">
          <span className="phone-prefix">+91</span>
          <input
            type="tel"
            placeholder="Enter 10 digit mobile number"
            value={shippingInfo.phone}
            onChange={handlePhoneChange}
            className="phone-field"
          />
        </div>

        <textarea
          placeholder="address"
          className="big-address"
          value={shippingInfo.address}
          onChange={(e) =>
            setShippingInfo({ ...shippingInfo, address: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="city"
          value={shippingInfo.city}
          onChange={(e) =>
            setShippingInfo({ ...shippingInfo, city: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="state"
          value={shippingInfo.state}
          onChange={(e) =>
            setShippingInfo({ ...shippingInfo, state: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="postalCode"
          value={shippingInfo.postalCode}
          onChange={(e) =>
            setShippingInfo({ ...shippingInfo, postalCode: e.target.value })
          }
        />
      </div>

      <div className="shipping-method">
        <h3>Shipping Method</h3>
        {shippingRates.map((rate) => (
          <label key={rate._id}>
            <input
              type="radio"
              name="shipping"
              checked={selectedShipping?._id === rate._id}
              onChange={() => setSelectedShipping(rate)}
            />
            {rate.name} - ₹{rate.rate}
          </label>
        ))}
      </div>

      <div className="payment-method">
        <h3>Payment Method</h3>

        {paymentOptions?.partialPayment?.enabled && (
          <label>
            <input
              type="radio"
              name="payment"
              checked={selectedPayment === "partialPayment"}
              onChange={() => setSelectedPayment("partialPayment")}
            />
            <div className="payment-option-content">
              <div className="payment-title-row">
                <div className="payment-title">
                  <strong>Partial payment (UPI / Card)</strong>
                </div>
              </div> 

              <div className="payment-icons">
                <img src="/payment-icons/gpay.png" alt="Google Pay" />
                <img src="/payment-icons/phonepe.png" alt="PhonePe" />
                <img src="/payment-icons/paytm.png" alt="Paytm" />
                <img src="/payment-icons/card.png" alt="Card" />
                <img src="/payment-icons/upi.png" alt="UPI" />
              </div>

              <div className="payment-details">
                <span className="price">
                  Pay now: ₹{previewPartialNow} | Pay after delivery: ₹{previewPartialLater}
                </span>
                <small className="secure-text">🔒 Secure Razorpay checkout</small>
              </div>
            </div>
          </label>
        )}

        {paymentOptions?.fullPrepaid?.enabled && (
          <label
            className={`payment-option prepaid-option ${
              selectedPayment === "fullPrepaid" ? "selected" : ""
            }`}
          >
            <input
              type="radio"
              name="payment"
              checked={selectedPayment === "fullPrepaid"}
              onChange={() => setSelectedPayment("fullPrepaid")}
            />

            <div className="payment-option-content">
              <div className="payment-title-row">
                <div className="payment-title">
                  <strong>Full payment (UPI / Card)</strong>
                </div>

                {previewFullPrepaidSave > 0 && (
                  <div className="discount-badge">
                    ₹{previewFullPrepaidSave} OFF
                  </div>
                )}
              </div>

              <div className="payment-icons">
                <img src="/payment-icons/gpay.png" alt="Google Pay" />
                <img src="/payment-icons/phonepe.png" alt="PhonePe" />
                <img src="/payment-icons/paytm.png" alt="Paytm" />
                <img src="/payment-icons/card.png" alt="Card" />
                <img src="/payment-icons/upi.png" alt="UPI" />
              </div>

              <div className="payment-details">
                <span className="price">
                  Pay Full: ₹{previewFullPrepaidTotal}
                  {previewFullPrepaidSave > 0 && (
                    <span className="discount-info">
                      {" "}(You save ₹{previewFullPrepaidSave})
                    </span>
                  )}
                </span>
                <small className="secure-text">Secure payment via Razorpay</small>
              </div>
            </div>
          </label>
        )}

        {paymentOptions?.cod?.enabled && (
          <label>
            <input
              type="radio"
              name="payment"
              checked={selectedPayment === "COD"}
              onChange={() => setSelectedPayment("COD")}
            />
            COD: ₹{previewCOD}{" "}
            <span className="payment-note">(Pay full at delivery)</span>
          </label>
        )}
      </div>

      <div className="summary-card shadow-sm">
        <div className="summary-header">
          <div className="header-title">
            <h4>Order Summary</h4>
            <span className="item-count">{checkoutItems.length} Items</span>
          </div>
          <div className="secure-badge">
            <span>100% Secure</span>
          </div>
        </div>

        <div className="summary-body">
          <div className="price-lines">
            <div className="price-row">
              <span>Cart Subtotal</span>
              <span>₹{Math.round(itemsPrice)}</span>
            </div>

            <div className="price-row">
              <span>Shipping Charges</span>
              <span className={shippingPrice === 0 ? "text-success" : ""}>
                {shippingPrice === 0 ? "FREE" : `+ ₹${Math.round(shippingPrice)}`}
              </span>
            </div>

            {discount > 0 && (
              <div className="price-row discount-applied">
                <span className="d-flex align-items-center">
                  <i className="tag-icon">🏷️</i> Prepaid Discount
                </span>
                <span>- ₹{Math.round(discount)}</span>
              </div>
            )}

            <hr className="summary-divider" />

            <div className="price-row total-order-row">
              <strong>Grand Total</strong>
              <strong>₹{Math.round(total)}</strong>
            </div>
          </div>

          <div className={`action-payment-box ${selectedPayment}`}>
            <div className="hero-content">
              <p className="hero-label">
                {selectedPayment === "COD" 
                  ? "Amount to pay at delivery" 
                  : selectedPayment === "partialPayment" 
                  ? "Payable today" 
                  : "Total amount to pay"}
              </p>
              <h2 className="hero-amount">
                ₹{Math.round(payableNow || (selectedPayment === "COD" ? total : 0))}
              </h2>
            </div>

            {selectedPayment === "partialPayment" && (
              <div className="balance-notice">
                <p>Remaining <strong>₹{Math.round(total - payableNow)}</strong> will be collected via Cash/QR, After delivery.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPayment === "COD" ? (
        <button
          className="place-order-btn"
          onClick={handleCOD}
          disabled={processing}
        >
          {processing ? "Placing Order..." : "Place Order"}
        </button>
      ) : (
        <button
          className="pay-order-btn"
          onClick={handlePrepaid}
          disabled={processing}
        >
          {processing ? "Processing Payment..." : "Pay & Place Order"}
        </button>
      )}
      <Footer />
    </div>
  );
};

export default CheckoutStep1;
