import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './OrderConfirmation.css';
import axiosInstance from '../axiosInstance';

// ✅ Import Pixel tracking function
import { trackEvent } from '../utils/facebookPixel';

const OrderConfirmation = () => {
  const { id } = useParams(); // order ID from URL
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        // ✅ Fetch order details
        const res = await axiosInstance.get(`/orders/confirmation/${id}`);
        const orderData = res.data;
        setOrder(orderData);

        // ✅ Fire Purchase event
        if (orderData?.orderItems?.length > 0) {
          orderData.orderItems.forEach((item) => {
            trackEvent("Purchase", {
              content_name: item.name,
              content_ids: [item._id],
              value: item.price * item.quantity,
              currency: "INR",
              quantity: item.quantity,
            });
          });
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError('Order not found or server error.');
      }
    };

    fetchOrder();
  }, [id]);

  if (error) return <div className="order-confirmation"><p>{error}</p></div>;
  if (!order) return <div className="order-confirmation"><p>Loading order details...</p></div>;

  return (
    <div className="order-confirmation">
      <h2>🎉 Order Confirmed!</h2>
      <p>Your order <strong>#{order._id}</strong> has been placed successfully.</p>

      <div className="order-section">
        <h3>Shipping Info</h3>
        <p><strong>Name:</strong> {order.shippingInfo.name}</p>
        <p><strong>Phone:</strong> {order.shippingInfo.phone}</p>
        <p><strong>Address:</strong> {order.shippingInfo.address}, {order.shippingInfo.city}, {order.shippingInfo.postalCode}, {order.shippingInfo.country}</p>
      </div>

      <div className="order-section">
        <h3>Ordered Items</h3>
        {order.orderItems.map((item, idx) => (
          <div key={idx} className="order-item">
            <img src={item.image || '/placeholder.png'} alt={item.name} />
            <div>
              <p><strong>{item.name}</strong></p>
              <p>₹{item.price} x {item.quantity}</p>
              {item.customization?.map((c, i) => (
                <p key={i}><strong>{c.label}:</strong> {c.type === 'file' ? c.value.split('/').pop() : c.value}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="order-section">
        <h3>Payment Info</h3>
        <p><strong>Method:</strong> {order.paymentInfo?.method || 'N/A'}</p>
        
        {/* Updated Status Logic */}
        <p><strong>Status:</strong> {
            (order.amountDue > 0 && order.amountPaid > 0) 
            ? 'Partially Paid' 
            : (order.paymentInfo?.status || 'N/A')
        }</p>
        
        <p><strong>Amount Paid:</strong> ₹{order.amountPaid}</p>
        <p><strong>Amount Due:</strong> ₹{order.amountDue}</p>
      </div>

      <div className="order-section total-summary">
        <p><strong>Items Total:</strong> ₹{order.itemsPrice}</p>
        <p><strong>Shipping:</strong> ₹{order.shippingPrice}</p>
        <p><strong>Discount:</strong> ₹{order.discount}</p>
        <p><strong>Total Amount:</strong> ₹{order.totalPrice}</p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <a href="/" className="continue-shopping-btn">Continue Shopping</a>
      </div>
    </div>
  );
};

export default OrderConfirmation;
