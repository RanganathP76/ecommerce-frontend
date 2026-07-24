import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosInstance from '../axiosInstance';
import './MyOrdersPage.css';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  
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
          setOrders([]);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token, guestEmail]);

  const handleCopyId = (id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getStatusBadgeClass = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('deliver')) return 'mop-badge--delivered';
    if (s.includes('process') || s.includes('pend')) return 'mop-badge--processing';
    if (s.includes('cancel')) return 'mop-badge--cancelled';
    return 'mop-badge--default';
  };

  return (
    <div className="mop-page-wrapper">
      <Header />

      <main className="mop-container">
        {selectedOrder ? (
          /* ===================================================================
             VIEW 1: FULL ORDER DETAILS SCREEN
             =================================================================== */
          <div className="mop-full-screen-details">
            {/* Top Navigation */}
            <div className="mop-details-topbar">
              <button
                className="mop-back-btn"
                onClick={() => setSelectedOrder(null)}
              >
                ← Back to All Orders
              </button>
              <span className={`mop-badge ${getStatusBadgeClass(selectedOrder.orderStatus)}`}>
                {selectedOrder.orderStatus}
              </span>
            </div>

            {/* 1st: Order ID & Date Header */}
            <div className="mop-details-header">
              <p className="mop-subtitle">Order Details</p>
              <h2 className="mop-full-id">
                <span>ID: {selectedOrder._id}</span>
                <button
                  className="mop-copy-btn"
                  onClick={(e) => handleCopyId(selectedOrder._id, e)}
                >
                  {copiedId ? '✓ Copied' : '📋 Copy ID'}
                </button>
              </h2>
              <p className="mop-date-stamp">
                Placed on {new Date(selectedOrder.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>

            {/* 2nd: Purchased Items (NOW PLACED BEFORE SHIPPING & PAYMENT) */}
            <div className="mop-items-container">
              <h3 className="mop-items-title">Items in Order ({selectedOrder.orderItems?.length})</h3>
              <div className="mop-items-list">
                {selectedOrder.orderItems?.map((item, i) => (
                  <div key={i} className="mop-item-card">
                    <img
                      src={item.image || '/placeholder.png'}
                      alt={item.name}
                      className="mop-item-img"
                    />
                    <div className="mop-item-info">
                      <div className="mop-item-header">
                        <h5 className="mop-item-name">{item.name}</h5>
                        <span className="mop-item-price">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="mop-item-qty">
                        ₹{item.price?.toFixed(2)} × {item.quantity}
                      </div>

                      {/* Item Specifications */}
                      {item.specifications?.length > 0 && (
                        <div className="mop-options-box">
                          <div className="mop-options-title">Specifications</div>
                          <div className="mop-chips-wrapper">
                            {item.specifications.map((spec, j) => (
                              <span key={j} className="mop-chip">
                                {spec.key}: {spec.value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Customizations */}
                      {item.customization?.length > 0 && (
                        <div className="mop-options-box">
                          <div className="mop-options-title">Customization</div>
                          <div className="mop-chips-wrapper">
                            {item.customization.map((c, j) => (
                              <span key={j} className="mop-chip">
                                {c.label}:{' '}
                                {c.type === 'file' ? (
                                  <a
                                    href={c.value}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mop-attachment-link"
                                  >
                                    View File
                                  </a>
                                ) : (
                                  c.value
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3rd: Shipping, Payment & Summary Breakdown */}
            <div className="mop-details-grid">
              {/* Shipping Address Card */}
              <div className="mop-info-card">
                <h4>📍 Shipping Address</h4>
                <div className="mop-row">
                  <span className="mop-row-label">Name:</span>
                  <span className="mop-row-val">{selectedOrder.shippingInfo?.name}</span>
                </div>
                <div className="mop-row">
                  <span className="mop-row-label">Phone:</span>
                  <span className="mop-row-val">{selectedOrder.shippingInfo?.phone}</span>
                </div>
                <div className="mop-row">
                  <span className="mop-row-label">Address:</span>
                  <span className="mop-row-val">
                    {selectedOrder.shippingInfo?.address}, {selectedOrder.shippingInfo?.city},{' '}
                    {selectedOrder.shippingInfo?.postalCode},{' '}
                    {selectedOrder.shippingInfo?.country}
                  </span>
                </div>
              </div>

              {/* Payment Details Card */}
              <div className="mop-info-card">
                <h4>💳 Payment Info</h4>
                <div className="mop-row">
                  <span className="mop-row-label">Method:</span>
                  <span className="mop-row-val">{selectedOrder.paymentInfo?.method}</span>
                </div>
                <div className="mop-row">
                  <span className="mop-row-label">Status:</span>
                  <span className="mop-row-val">{selectedOrder.paymentInfo?.status}</span>
                </div>
                <div className="mop-row">
                  <span className="mop-row-label">Paid:</span>
                  <span className="mop-row-val">₹{selectedOrder.amountPaid?.toFixed(2)}</span>
                </div>
                {selectedOrder.amountDue > 0 && (
                  <div className="mop-row mop-due-alert">
                    <span className="mop-row-label">Due:</span>
                    <span className="mop-row-val">₹{selectedOrder.amountDue?.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Price Breakdown Card */}
              <div className="mop-info-card">
                <h4>📄 Payment Summary</h4>
                <div className="mop-row">
                  <span className="mop-row-label">Items Subtotal:</span>
                  <span className="mop-row-val">₹{selectedOrder.itemsPrice?.toFixed(2)}</span>
                </div>
                <div className="mop-row">
                  <span className="mop-row-label">Shipping Charges:</span>
                  <span className="mop-row-val">₹{selectedOrder.shippingPrice?.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="mop-row">
                    <span className="mop-row-label">Discount:</span>
                    <span className="mop-row-val">-₹{selectedOrder.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="mop-row mop-row--total">
                  <span className="mop-row-label">Grand Total:</span>
                  <span className="mop-row-val">₹{selectedOrder.totalPrice?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================================================================
             VIEW 2: MAIN ORDERS LIST
             =================================================================== */
          <>
            <div className="mop-header">
              <h2 className="mop-title">My Orders</h2>
              {!loading && (token || guestEmail) && (
                <span className="mop-count-badge">
                  {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                </span>
              )}
            </div>

            {loading ? (
              <div className="mop-skeleton-wrapper">
                <div className="mop-skeleton-card"></div>
                <div className="mop-skeleton-card"></div>
              </div>
            ) : token || guestEmail ? (
              orders.length === 0 ? (
                <div className="mop-empty-card">
                  <div className="mop-state-icon">📦</div>
                  <p>You haven't placed any orders yet.</p>
                  <Link to="/products" className="mop-btn-primary">
                    Explore Products
                  </Link>
                </div>
              ) : (
                <div className="mop-orders-list">
                  {orders.map((order) => {
                    const firstItem = order.orderItems?.[0];
                    const extraCount = (order.orderItems?.length || 0) - 1;

                    return (
                      <div
                        key={order._id}
                        className="mop-card"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="mop-card-body">
                          <div className="mop-hero-thumb">
                            <img
                              src={firstItem?.image || '/placeholder.png'}
                              alt={firstItem?.name || 'Order product'}
                              className="mop-thumb-img"
                            />
                            {extraCount > 0 && (
                              <span className="mop-extra-badge">+{extraCount}</span>
                            )}
                          </div>

                          <div className="mop-summary-meta">
                            <div className="mop-meta-top">
                              <span className="mop-order-id-full">
                                ID: {order._id}
                              </span>
                            </div>
                            <div>
                              <span className={`mop-badge ${getStatusBadgeClass(order.orderStatus)}`}>
                                {order.orderStatus}
                              </span>
                            </div>
                            <div className="mop-order-date">
                              📅 {new Date(order.createdAt).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="mop-order-price">
                              ₹{order.totalPrice?.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* CENTER ALIGNED FULL-WIDTH BUTTON BAR */}
                        <div className="mop-card-footer">
                          <span>View Details →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="mop-auth-card">
                <div className="mop-state-icon">🔒</div>
                <p>Please log in to view your order history.</p>
                <Link to="/login" className="mop-btn-primary">
                  Log In
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyOrdersPage;