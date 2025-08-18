import React, { useState } from 'react';
import axios from 'axios';
import './TrackOrderPublic.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosInstance from '../axiosInstance';

const TrackOrderPublic = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async () => {
    if (!orderId.trim()) {
      setError("Please enter a valid Order ID");
      return;
    }

    try {
      const res = await axiosInstance.get(`/orders/track/${orderId}`);
      setOrder(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setOrder(null);
      setError("Order not found or server error.");
    }
  };

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
          <button onClick={handleTrack}>Track</button>
        </div>

        {error && <p className="track-error">{error}</p>}

        {order && (
          <div className="order-card">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> {order._id}</p>
            <p><strong>Status:</strong> {order.orderStatus}</p>
            <p><strong>Placed On:</strong> {new Date(order.createdAt).toLocaleString()}</p>

            <h4>Shipping Info</h4>
            <p>{order.shippingInfo?.name} — {order.shippingInfo?.phone}</p>
            <p>{order.shippingInfo?.address}, {order.shippingInfo?.city}, {order.shippingInfo?.postalCode}, {order.shippingInfo?.country}</p>

            <h4>Payment</h4>
            <p><strong>Method:</strong> {order.paymentInfo?.method || 'N/A'}</p>
            <p><strong>Status:</strong> {order.paymentInfo?.status || 'N/A'}</p>
            <p><strong>Paid:</strong> ₹{order.amountPaid}</p>
            <p><strong>Due:</strong> ₹{order.amountDue}</p>

            <h4>Items</h4>
            {order.orderItems.map((item, idx) => (
              <div key={idx} className="item-box">
                <p><strong>{item.name}</strong></p>
                <p>₹{item.price} × {item.quantity}</p>
                {item.customization?.map((c, i) => (
                  <div key={i} className="custom-line">
                    {c.label}: {c.type === 'file' ? c.value?.split('/').pop() : c.value}
                  </div>
                ))}
              </div>
            ))}

            <h4>Total</h4>
            <p><strong>Total Price:</strong> ₹{order.totalPrice}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TrackOrderPublic;
