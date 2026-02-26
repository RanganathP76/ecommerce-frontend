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

    const orderItems = cartItems.map((item) => ({
  product: item._id,
  name: item.title,
  image: item.image || "",
  price: Math.round(parseFloat(item.price)),
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
      itemsPrice: Math.round(itemsPrice),
      discount: Math.round(discount),
      shippingPrice: Math.round(shippingPrice),
      totalPrice: Math.round(total),
      amountPaid: 0,
      amountDue: Math.round(total),
      paymentMethod: "COD",
    },
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  )
  .then((res) => {
    clearCart();   // ✅ CLEAR HERE
    window.location.href = `/order-confirmation/${res.data.order._id}`;
  })
  .catch((err) => {
    console.error(err);
    alert("Order creation failed.");
    setProcessing(false);
    clickedOnceRef.current = false;
  });
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
  const orderItems = cartItems.map((item) => ({
    product: item._id,
    name: item.title,
    image: item.image || "",
    price: Math.round(parseFloat(item.price)),
    quantity: item.quantity ? Number(item.quantity) : 1,
    customization: item.customization || [],
    specifications: item.specifications || [],
  }));

  // 🔥 CREATE ORDER FIRST (ABANDONED)
  const res = await axiosInstance.post(
    "/orders/create",
    {
      orderItems,
      shippingInfo,
      itemsPrice: Math.round(itemsPrice),
      discount: Math.round(discount),
      shippingPrice: Math.round(shippingPrice),
      totalPrice: Math.round(total),
      amountPaid: Math.round(payableNow),
      amountDue: Math.round(total - payableNow),
      paymentMethod: "RAZORPAY",
    },
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );

  const { razorpayOrder, orderId } = res.data;

  const rzp = new window.Razorpay({
    key: RAZORPAY_KEY,
    amount: razorpayOrder.amount,
    currency: "INR",
    name: "Cuztory",
    description: "Order Payment",
    order_id: razorpayOrder.id,

    handler: function () {
       clearCart();   // ✅ CLEAR HERE
      // 🚨 DO NOTHING HERE
      // Webhook will update order
      window.location.href = `/order-confirmation/${orderId}`;
    },

    modal: {
      ondismiss: function () {
        setProcessing(false);
        clickedOnceRef.current = false;
        alert("Payment cancelled. Order saved as abandoned.");
      },
    },
  });

  rzp.open();
} catch (err) {
  console.error(err);
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
          <strong>Online payment (UPI / Card)</strong>
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
    pay now: ₹{previewPartialNow} 
    
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

    <div className="simple-payable-box">
  <h3>Payable Now</h3>
  <h1>
    ₹{Math.round(
      selectedPayment === "COD"
        ? total
        : selectedPayment === "partialPayment"
        ? payableNow
        : selectedPayment === "fullPrepaid"
        ? total
        : 0
    )}
  </h1>
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
