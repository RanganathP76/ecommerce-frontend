import React, { useState, useEffect, useContext, useRef } from "react";
import axiosInstance from "../axiosInstance";
import CartContext from "../context/CartContext";
import "./CheckoutStep1.css";

const CheckoutStep1 = () => {
  const { cartItems, clearCart } = useContext(CartContext);

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
  const [shippingRates, setShippingRates] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState(null);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const clickedOnceRef = useRef(false);

  const RAZORPAY_KEY = "rzp_live_HirbfaYGKt499v";
  const token = localStorage.getItem("token");

  // --- Price Calculations ---
  const itemsPrice = cartItems.reduce((acc, item) => {
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

  // --- Preview values (always visible regardless of selection) ---
  const previewFullPrepaidTotal = Math.round(
    itemsPrice + shippingPrice - getDiscount()
  );
  const previewFullPrepaidSave = Math.round(getDiscount());
  const previewPartialNow = Math.round(getAdvance());
  const previewPartialLater = Math.round(itemsPrice + shippingPrice - getAdvance());
  const previewCOD = Math.round(itemsPrice + shippingPrice);

  // --- Fetch Shipping & Payment Config ---
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

  // --- Helpers ---
  const guardClick = () => {
    if (processing || clickedOnceRef.current) return false;
    clickedOnceRef.current = true;
    setProcessing(true);
    return true;
  };

  const validateStock = () => {
    for (const item of cartItems) {
      if (item.specifications?.length > 0) {
        for (const spec of item.specifications) {
          if (spec.stock !== undefined && spec.stock < (item.quantity || 1)) {
            return false;
          }
        }
      } else {
        if (item.stock !== undefined && item.stock < (item.quantity || 1)) {
          return false;
        }
      }
    }
    return true;
  };

  // --- Create Order ---
  // --- Updated Create Order Logic ---
const createOrder = async (
  method,
  status,
  paymentId = "",
  extraPaymentData = {}
) => {
  const orderItems = cartItems.map((item) => ({
    product: item._id,
    name: item.title,
    image: item.image || "",
    price: Math.round(parseFloat(item.price)), // Round individual item price
    quantity: item.quantity ? Number(item.quantity) : 1,
    customization: item.customization || [],
    specifications: item.specifications || [],
  }));

  // Ensure all values sent to DB are rounded integers
  const roundedItemsPrice = Math.round(itemsPrice);
  const roundedDiscount = Math.round(discount);
  const roundedShipping = Math.round(shippingPrice);
  const roundedTotal = Math.round(total);
  const roundedPayableNow = Math.round(payableNow);

  const orderData = {
    shippingInfo,
    paymentInfo: { method, status, id: paymentId },
    razorpay_order_id: extraPaymentData.razorpay_order_id || "",
    razorpay_payment_id: paymentId || "",
    razorpay_signature: extraPaymentData.razorpay_signature || "",
    amountPaid: roundedPayableNow, // Matches actual payment
    amountDue: roundedTotal - roundedPayableNow, // Clean subtraction
    orderItems,
    itemsPrice: roundedItemsPrice,
    discount: roundedDiscount,
    shippingPrice: roundedShipping,
    totalPrice: roundedTotal,
    orderStatus: "Processing",
  };

  try {
    const res = await axiosInstance.post("/orders", orderData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    clearCart();
    window.location.href = `/order-confirmation/${res.data._id}`;
  } catch (err) {
    console.error("Order creation failed:", err);
    alert(err.response?.data?.message || "Order creation failed.");
    setProcessing(false);
    clickedOnceRef.current = false;
  }
};

  // --- COD Checkout ---
  const handleCOD = () => {
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

    if (!validateStock()) {
      alert("Some items are out of stock.");
      setProcessing(false);
      clickedOnceRef.current = false;
      return;
    }

    createOrder("COD", "Pending");
  };

  // --- Prepaid Checkout ---
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

  if (!validateStock()) {
    alert("Some items are out of stock.");
    setProcessing(false);
    clickedOnceRef.current = false;
    return;
  }

  if (!razorpayLoaded) {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    // Wait a bit for script to load
    await new Promise((resolve) => (script.onload = resolve));
  }

  // --- Inside handlePrepaid function ---

try {
  const res = await axiosInstance.post(
    "/payment/create-order",
    {
      // Wrap payableNow in Math.round to ensure it's a clean integer
      amount: Math.round(payableNow), 
      shippingInfo,
      itemsPrice: Math.round(itemsPrice),
      discount: Math.round(discount),
      shippingPrice: Math.round(shippingPrice),
      totalPrice: Math.round(total),
    },
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );

  // ... rest of your code

    const { razorpayOrder } = res.data;

    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY,
      amount: razorpayOrder.amount,
      currency: "INR",
      name: "Cuztory",
      description: "Order Payment",
      order_id: razorpayOrder.id,
      handler: (response) => {
        createOrder("RAZORPAY", "Paid", response.razorpay_payment_id, {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      prefill: { name: shippingInfo.name, contact: shippingInfo.phone },
      theme: { color: "#556B2F" },
      modal: {
        ondismiss: function () {
          // Reset processing state if user cancels the payment
          setProcessing(false);
          clickedOnceRef.current = false;
          alert("Payment was cancelled.");
        },
      },
    });

    rzp.open();
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    alert("Payment initiation failed.");
    setProcessing(false);
    clickedOnceRef.current = false;
  }
};


  return (
    <div className="checkout-container">
      {/* Simple Checkout Header */}
<div className="checkout-header">
  <div className="checkout-header-inner">
    <span className="brand-name">Cuztory</span>
  </div>
</div>

      <h2>Checkout</h2>

      {/* Cart Items */}
      <div className="checkout-cart-wrapper">
        <h3>Your Cart</h3>
        <div className="checkout-cart-box">
          {cartItems.map((item, idx) => (
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

                {/* Specifications */}
                {item.specifications?.length > 0 && (
                  <div className="cart-specs">
                    {item.specifications.map((s, i) => (
                      <div key={i}>
                        <strong>{s.key}:</strong> {s.value}
                      </div>
                    ))}
                  </div>
                )}

                {/* Customization */}
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

      {/* Shipping Info */}
      <div className="shipping-info">
        <h3>Shipping Info</h3>
        {/* Name */}
<input
  type="text"
  placeholder="name"
  value={shippingInfo.name}
  onChange={(e) =>
    setShippingInfo({ ...shippingInfo, name: e.target.value })
  }
/>

{/* Email */}
<input
  type="text"
  placeholder="email"
  value={shippingInfo.email}
  onChange={(e) =>
    setShippingInfo({ ...shippingInfo, email: e.target.value })
  }
/>

{/* Phone */}
<input
  type="text"
  placeholder="phone"
  value={shippingInfo.phone}
  onChange={(e) =>
    setShippingInfo({ ...shippingInfo, phone: e.target.value })
  }
/>

{/* DOUBLE-SIZE ADDRESS FIELD */}
<textarea
  placeholder="address"
  className="big-address"
  value={shippingInfo.address}
  onChange={(e) =>
    setShippingInfo({ ...shippingInfo, address: e.target.value })
  }
/>

{/* City */}
<input
  type="text"
  placeholder="city"
  value={shippingInfo.city}
  onChange={(e) =>
    setShippingInfo({ ...shippingInfo, city: e.target.value })
  }
/>

{/* State */}
<input
  type="text"
  placeholder="state"
  value={shippingInfo.state}
  onChange={(e) =>
    setShippingInfo({ ...shippingInfo, state: e.target.value })
  }
/>

{/* Pincode */}
<input
  type="text"
  placeholder="postalCode"
  value={shippingInfo.postalCode}
  onChange={(e) =>
    setShippingInfo({ ...shippingInfo, postalCode: e.target.value })
  }
/>
      </div>

      {/* Shipping Rates */}
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

      {/* Payment Methods */}
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
      {/* Header */}
      <div className="payment-title-row">
        <div className="payment-title">
          <strong>Advance payment (UPI / Card)</strong>
        </div>
        </div> 

      {/* Payment Icons */}
      <div className="payment-icons">
        <img src="/payment-icons/gpay.png" alt="Google Pay" />
        <img src="/payment-icons/phonepe.png" alt="PhonePe" />
        <img src="/payment-icons/paytm.png" alt="Paytm" />
        <img src="/payment-icons/card.png" alt="Card" />
        <img src="/payment-icons/upi.png" alt="UPI" />
      </div>

     <div className="payment-details">
  <span className="price">
    Advance now: ₹{previewPartialNow} 
    <br />
    Pay on delivery: ₹{previewPartialLater}
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
      {/* Header */}
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

      {/* Payment Icons */}
      <div className="payment-icons">
        <img src="/payment-icons/gpay.png" alt="Google Pay" />
        <img src="/payment-icons/phonepe.png" alt="PhonePe" />
        <img src="/payment-icons/paytm.png" alt="Paytm" />
        <img src="/payment-icons/card.png" alt="Card" />
        <img src="/payment-icons/upi.png" alt="UPI" />
      </div>

      {/* Details */}
      <div className="payment-details">
        <span className="price">
          Pay Full: ₹{previewFullPrepaidTotal}
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
      <span className="item-count">{cartItems.length} Items</span>
    </div>
    <div className="secure-badge">
      
      <span>100% Secure</span>
    </div>
  </div>

  <div className="summary-body">
    {/* Financial Breakdown */}
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

    {/* Dynamic "Payable Now" Action Box */}
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
          <p>Remaining <strong>₹{Math.round(total - payableNow)}</strong> will be collected via Cash/QR at delivery.</p>
        </div>
      )}

      {selectedPayment === "fullPrepaid" && (
        <div className="savings-celebration">
          🎉 You saved <strong>₹{Math.round(discount)}</strong> by paying online!
        </div>
      )}
    </div>
  </div>
</div>

      {/* Action Button */}
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
    </div>
  );
};

export default CheckoutStep1;
