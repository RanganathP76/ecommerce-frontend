// MyOrdersPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './MyOrdersPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosInstance from '../axiosInstance';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return; // 🔒 Don't fetch if not logged in

    const fetchOrders = async () => {
      try {
        const res = await axiosInstance.get('/orders/my');
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      }
    };

    fetchOrders();
  }, [token]);

  const toggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <div className="my-orders-container">
      <Header />
      <h2>My Orders</h2>

      {!token ? (
        <div className="login-prompt">
          <p>You must <Link to="/login">login</Link> to view your orders.</p>
        </div>
      ) : (
        <>
          {orders.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            orders.map(order => (
              <div key={order._id} className="order-summary-box">
                <div className="order-summary" onClick={() => toggleExpand(order._id)}>
                  <div><strong>Order ID:</strong> {order._id}</div>
                  <div><strong>Status:</strong> {order.orderStatus}</div>
                  <div><strong>Total:</strong> ₹{order.totalPrice}</div>
                  <div><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</div>
                </div>

                {expandedOrderId === order._id && (
                  <div className="order-details">
                    <h4>Shipping Info</h4>
                    <p><strong>Name:</strong> {order.shippingInfo.name}</p>
                    <p><strong>Phone:</strong> {order.shippingInfo.phone}</p>
                    <p><strong>Address:</strong> {order.shippingInfo.address}, {order.shippingInfo.city}, {order.shippingInfo.postalCode}, {order.shippingInfo.country}</p>

                    <h4>Payment Info</h4>
                    <p><strong>Method:</strong> {order.paymentInfo.method}</p>
                    <p><strong>Status:</strong> {order.paymentInfo.status}</p>

                    <h4>Price Breakdown</h4>
                    <p><strong>Items:</strong> ₹{order.itemsPrice}</p>
                    <p><strong>Shipping:</strong> ₹{order.shippingPrice}</p>
                    <p><strong>Discount:</strong> ₹{order.discount}</p>
                    <p><strong>Total:</strong> ₹{order.totalPrice}</p>
                    <p><strong>Amount Paid:</strong> ₹{order.amountPaid}</p>
                    <p><strong>Due:</strong> ₹{order.amountDue}</p>

                    <h4>Items</h4>
                    {order.orderItems.map((item, i) => (
                      <div key={i} className="order-item">
                        <img src={item.image || "/placeholder.png"} alt={item.name} />
                        <div>
                          <p><strong>{item.name}</strong></p>
                          <p>₹{item.price} x {item.quantity}</p>
                          {item.customization?.length > 0 && (
                            <div className="customization">
                              {item.customization.map((c, j) => (
                                <p key={j}><strong>{c.label}:</strong> {c.value}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}

      <Footer />
    </div>
  );
};

export default MyOrdersPage;
