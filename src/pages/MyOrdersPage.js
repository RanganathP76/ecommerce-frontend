import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './MyOrdersPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosInstance from '../axiosInstance';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const guestEmail = localStorage.getItem('guestEmail');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (token) {
          const res = await axiosInstance.get('/orders/my', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setOrders(res.data);
        } else if (guestEmail) {
          const res = await axiosInstance.get('/orders/guest?email=' + guestEmail);
          setOrders(res.data);
        } else {
          setOrders([]); // no user & no guest orders
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token, guestEmail]);

  const toggleExpand = (orderId) =>
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);

  return (
    <div className="my-orders-container">
      <Header />
      <h2>My Orders</h2>

      {loading ? (
        <p>Loading...</p>
      ) : token || guestEmail ? (
        orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="order-summary-box">
              <div
  className="order-summary"
  onClick={() => toggleExpand(order._id)}
>
  <div className="order-summary-left">
    <img
      src={order.orderItems?.[0]?.image || "/placeholder.png"}
      alt={order.orderItems?.[0]?.name}
      className="order-summary-image"
    />

    <div className="order-summary-info">
      <div><strong>Order ID:</strong> {order._id}</div>
      <div><strong>Status:</strong> {order.orderStatus}</div>
      <div><strong>Total:</strong> ₹{order.totalPrice.toFixed(1)}</div>
      <div><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</div>

      {order.orderItems.length > 1 && (
        <div className="more-items">
          +{order.orderItems.length - 1} more item(s)
        </div>
      )}
    </div>
  </div>

  <div className="expand-icon">
    {expandedOrderId === order._id ? "▲" : "▼"}
  </div>
</div>

              {expandedOrderId === order._id && (
                <div className="order-details">
                  <h4>Shipping Info</h4>
                  <p><strong>Name:</strong> {order.shippingInfo.name}</p>
                  <p><strong>Phone:</strong> {order.shippingInfo.phone}</p>
                  <p>
                    <strong>Address:</strong> {order.shippingInfo.address},{" "}
                    {order.shippingInfo.city}, {order.shippingInfo.postalCode},{" "}
                    {order.shippingInfo.country}
                  </p>

                  <h4>Payment Info</h4>
                  <p><strong>Method:</strong> {order.paymentInfo.method}</p>
                  <p><strong>Status:</strong> {order.paymentInfo.status}</p>

                  <h4>Price Breakdown</h4>
                  <p><strong>Items:</strong> ₹{order.itemsPrice.toFixed(1)}</p>
                  <p><strong>Shipping:</strong> ₹{order.shippingPrice.toFixed(1)}</p>
                  <p><strong>Discount:</strong> ₹{order.discount.toFixed(1)}</p>
                  <p><strong>Total:</strong> ₹{order.totalPrice.toFixed(1)}</p>
                  <p><strong>Paid:</strong> ₹{order.amountPaid.toFixed(1)}</p>
                  <p><strong>Due:</strong> ₹{order.amountDue.toFixed(1)}</p>

                  <h4>Items</h4>
                  {order.orderItems.map((item, i) => (
                    <div key={i} className="order-item">
                      <img
                        src={item.image || '/placeholder.png'}
                        alt={item.name}
                      />
                      <div>
                        <p><strong>{item.name}</strong></p>
                        <p>₹{item.price.toFixed(1)} × {item.quantity}</p>

                        {item.specifications?.length > 0 && (
                          <div className="specifications">
                            <strong>Specifications:</strong>
                            <ul>
                              {item.specifications.map((spec, j) => (
                                <li key={j}>{spec.key}: {spec.value}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.customization?.length > 0 && (
                          <div className="customization">
                            <strong>Customization:</strong>
                            <ul>
                              {item.customization.map((c, j) => (
                                <li key={j}>
                                  {c.label}:{" "}
                                  {c.type === "file" ? (
                                    <a
                                      href={c.value}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      File
                                    </a>
                                  ) : (
                                    c.value
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )
      ) : (
        <div className="login-prompt">
          <p>You are not logged in.</p>
          <Link to="/login" className="login-link">👉 Login to continue</Link>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyOrdersPage;
