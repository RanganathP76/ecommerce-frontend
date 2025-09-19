import React, { useState, useEffect, useContext, useRef } from "react";
import axiosInstance from "../axiosInstance";
import CartContext from "../context/CartContext";
import "./CheckoutStep1.css";

const CheckoutStep1 = () => {
  const { cartItems, clearCart } = useContext(CartContext);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
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
  const createOrder = async (
    method,
    status,
    paymentId = "",
    extraPaymentData = {}
  ) => {
    const orderItems = cartItems.map((item) => {
      console.log("🛒 Item being added to order:", {
        id: item._id,
        title: item.title,
        quantity: item.quantity,
        customization: item.customization,
        specifications: item.specifications,
      });

      return {
        product: item._id, // ✅ backend expects product ID
        name: item.title,
        image: item.image || "",
        price: parseFloat(item.price),
        quantity: item.quantity ? Number(item.quantity) : 1,
        customization: item.customization || [],
        specifications: item.specifications || [],
      };
    });

    const orderData = {
      shippingInfo,
      paymentInfo: { method, status, id: paymentId },
      razorpay_order_id: extraPaymentData.razorpay_order_id || "",
      razorpay_payment_id: paymentId || "",
      razorpay_signature: extraPaymentData.razorpay_signature || "",
      amountPaid: payableNow,
      amountDue: total - payableNow,
      orderItems,
      itemsPrice,
      discount,
      shippingPrice,
      totalPrice: total,
      orderStatus: "Processing",
    };

    console.log("🟢 Final orderData sending to backend:", JSON.stringify(orderData, null, 2));


    try {
      const res = await axiosInstance.post("/orders", orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ Order created successfully:", res.data);

      clearCart();
      window.location.href = `/order-confirmation/${res.data._id}`;
    } catch (err) {
      console.error("❌ Order creation failed:", err);
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
      !shippingInfo.phone ||
      !shippingInfo.address ||
      !shippingInfo.city ||
      !shippingInfo.postalCode ||
      !selectedShipping
    ) {
      alert("Please fill in all required shipping fields.");
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

    console.log("🟡 COD Checkout started");
    createOrder("COD", "Pending");
  };

  // --- Prepaid Checkout ---
  const handlePrepaid = async () => {
    if (!guardClick()) return;

    if (
      !shippingInfo.name ||
      !shippingInfo.phone ||
      !shippingInfo.address ||
      !shippingInfo.city ||
      !shippingInfo.postalCode ||
      !selectedShipping
    ) {
      alert("Please fill in all required shipping fields.");
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
    }

    console.log("🟡 Creating Razorpay order...");
    const res = await axiosInstance.post(
      "/payment/create-order",
      {
        amount: payableNow,
        shippingInfo,
        itemsPrice,
        discount,
        shippingPrice,
        totalPrice: total,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { razorpayOrder } = res.data;

    console.log("✅ Razorpay order created:", razorpayOrder);

    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY,
      amount: razorpayOrder.amount,
      currency: "INR",
      name: "Dignify Deals",
      description: "Order Payment",
      order_id: razorpayOrder.id,
      handler: (response) => {
        console.log("💳 Razorpay payment success:", response);
        createOrder("RAZORPAY", "Paid", response.razorpay_payment_id, {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      prefill: { name: shippingInfo.name, contact: shippingInfo.phone },
      theme: { color: "#556B2F" },
    });
    rzp.open();
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>

      {/* Cart Items */}
      {/* Cart Items */}
<div className="checkout-cart-wrapper">
  <h3 className="checkout-cart-title">Your Cart</h3>
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
          <span>₹{item.price} x {item.quantity}</span>

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
                {c.type === "file"
                  ? c.value?.split("/").pop()
                  : c.value}
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
        {["name", "phone", "address", "city", "postalCode"].map((field) => (
          <input
            key={field}
            type="text"
            placeholder={field}
            value={shippingInfo[field]}
            onChange={(e) =>
              setShippingInfo({ ...shippingInfo, [field]: e.target.value })
            }
          />
        ))}
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
        {paymentOptions?.fullPrepaid?.enabled && (
          <label>
            <input
              type="radio"
              name="payment"
              checked={selectedPayment === "fullPrepaid"}
              onChange={() => setSelectedPayment("fullPrepaid")}
            />
            Full Prepaid (Save ₹{getDiscount()})
          </label>
        )}
        {paymentOptions?.partialPayment?.enabled && (
          <label>
            <input
              type="radio"
              name="payment"
              checked={selectedPayment === "partialPayment"}
              onChange={() => setSelectedPayment("partialPayment")}
            />
            Advance Payment (Pay ₹{getAdvance()} now)
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
            Cash on Delivery
          </label>
        )}
      </div>

      {/* Summary */}
      <div className="summary-box">
        <h3>Summary</h3>
        <p>Items: ₹{itemsPrice}</p>
        <p>Shipping: ₹{shippingPrice}</p>
        {discount > 0 && <p>Discount: -₹{discount}</p>}
        <h4>Total: ₹{total}</h4>
        {selectedPayment === "partialPayment" && (
          <p>Pay Now: ₹{payableNow}</p>
        )}
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
