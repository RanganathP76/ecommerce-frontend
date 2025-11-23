import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import './TrackOrderPublic.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const orderFlow = [
  "Pending",
  "Processing",
  "Confirmed",
  "Packed",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Failed Delivery",
  "Cancelled",
  "Returned",
];

const OrderStepper = ({ status }) => {
  const currentIndex = orderFlow.indexOf(status);

  if (status === "Cancelled" || status === "Failed Delivery" || status === "Returned") {
    return (
      <div className="order-cancelled">
        <h2>❌ {status}</h2>
        <p>This order cannot be delivered.</p>
      </div>
    );
  }

  return (
    <div className="order-stepper">
      {orderFlow.slice(0, currentIndex + 1).map((step, idx) => {
        const isCurrent = idx === currentIndex;
        const isCompleted = idx < currentIndex;

        return (
          <div key={step} className="step-item">
            <div
              className={`step-circle ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
            >
              {isCompleted ? "✔" : idx + 1}
            </div>
            <div className="step-label">{step}</div>
            {idx < currentIndex && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
};

const TrackOrderPublic = () => {
  const location = useLocation();
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async (id = orderId) => {
    if (!id.trim()) {
      setError("Please enter a valid Order ID");
      return;
    }

    try {
      const res = await axiosInstance.get(`/orders/track/${id}`);
      setOrder(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setOrder(null);
      setError("Order not found or server error.");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idFromURL = params.get('order_id');

    if (idFromURL) {
      setOrderId(idFromURL);
      handleTrack(idFromURL);
    }
  }, [location.search]);

  return (
    <div className="track-page">
      <Header />

      <main className="track-main">
        <h2>Track Your Order</h2>

        <div className="track-form">
          <input
            type="text"
            placeholder="Enter your Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button onClick={() => handleTrack()}>Track</button>
        </div>

        {error && <p className="track-error">{error}</p>}

        {order && (
          <div className="order-card">
            <h3>Order ID: {order._id}</h3>
            <p>Status: <strong>{order.orderStatus}</strong></p>
            <p>Placed On: {new Date(order.createdAt).toLocaleString()}</p>

            {/* Tracking Flow */}
            <OrderStepper status={order.orderStatus} />

            {/* Shortened Order Summary */}
            <div className="order-summary">
              <h4>Shipping Info</h4>
              <p>{order.shippingInfo?.name} — {order.shippingInfo?.phone}</p>
              <p>{order.shippingInfo?.address}, {order.shippingInfo?.city}, {order.shippingInfo?.postalCode}, {order.shippingInfo?.country}</p>

              <h4>Items ({order.orderItems.length})</h4>
              <ul>
                {order.orderItems.map((item, idx) => (
                  <li key={idx}>
                    {item.name} x {item.quantity} — ₹{item.price * item.quantity}
                  </li>
                ))}
              </ul>

              <h4>Payment Summary</h4>
              <p><strong>Total Price:</strong> ₹{order.totalPrice}</p>
              <p><strong>Amount Paid:</strong> ₹{order.amountPaid}</p>
              <p><strong>Amount Due:</strong> ₹{order.amountDue}</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TrackOrderPublic;

