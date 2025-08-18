import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import axiosInstance from '../axiosInstance';
import CartContext from '../context/CartContext';
import './CheckoutStep1.css';

const CheckoutStep1 = () => {
  const { cartItems, clearCart } = useContext(CartContext);
  const [shippingInfo, setShippingInfo] = useState({
    name: '', phone: '', address: '', city: '', postalCode: '', country: 'India'
  });
  const [shippingRates, setShippingRates] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState(null);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [processing, setProcessing] = useState(false); // prevent multiple clicks
  const clickedOnceRef = useRef(false); // prevent double click

  const RAZORPAY_KEY = 'rzp_live_HirbfaYGKt499v';
  const token = localStorage.getItem('token');

  const itemsPrice = cartItems.reduce((acc, item) => {
    const price = parseFloat(item.price || 0);
    return acc + (isNaN(price) ? 0 : price * (item.quantity || 1));
  }, 0);

  const shippingPrice = selectedShipping ? selectedShipping.rate : 0;

  const getDiscount = () => {
    if (paymentOptions?.fullPrepaid?.enabled) {
      const { discountType, discountValue } = paymentOptions.fullPrepaid;
      return discountType === 'percent' ? (itemsPrice * discountValue) / 100 : discountValue;
    }
    return 0;
  };

  const getAdvance = () => {
    if (paymentOptions?.partialPayment?.enabled) {
      const { partialType, partialValue } = paymentOptions.partialPayment;
      return partialType === 'percent' ? (itemsPrice * partialValue) / 100 : partialValue;
    }
    return 0;
  };

  const discount = selectedPayment === 'fullPrepaid' ? getDiscount() : 0;
  const advance = selectedPayment === 'partialPayment' ? getAdvance() : 0;
  const total = itemsPrice + shippingPrice - discount;
  const payableNow =
    selectedPayment === 'partialPayment' ? advance :
    selectedPayment === 'fullPrepaid' ? total :
    0;

  useEffect(() => {
    axiosInstance.get('/shipping-rates')
      .then(res => {
        const enabledRates = res.data.filter(rate => rate.enabled);
        setShippingRates(enabledRates);
        if (enabledRates.length > 0) setSelectedShipping(enabledRates[0]);
      })
      .catch(console.error);

    axiosInstance.get('/payment-config/get')
      .then(res => {
        setPaymentOptions(res.data);
        if (res.data?.fullPrepaid?.enabled) setSelectedPayment('fullPrepaid');
        else if (res.data?.partialPayment?.enabled) setSelectedPayment('partialPayment');
        else if (res.data?.cod?.enabled) setSelectedPayment('COD');
      })
      .catch(console.error);
  }, []);

  const loadRazorpayScript = () => {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        setRazorpayLoaded(true);
        resolve(true);
      };
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const guardClick = () => {
    if (processing || clickedOnceRef.current) return false;
    clickedOnceRef.current = true;
    setProcessing(true);
    return true;
  };

  const createOrder = async (
  method,
  status,
  paymentId = '',
  extraPaymentData = {}
) => {
  const orderData = {
    shippingInfo,
    paymentInfo: { method, status, id: paymentId },
    // ✅ Send Razorpay fields at top level for backend verification
    razorpay_order_id: extraPaymentData.razorpay_order_id || '',
    razorpay_payment_id: paymentId || '',
    razorpay_signature: extraPaymentData.razorpay_signature || '',
    amountPaid: payableNow,
    amountDue: total - payableNow,
    orderItems: cartItems.map((item) => ({
      product: item._id,
      name: item.title,
      image:
        Array.isArray(item.images) && item.images.length > 0
          ? item.images[0]
          : item.image || '',
      price: parseFloat(item.price),
      quantity: item.quantity ? Number(item.quantity) : 1,
      customization: item.customization || []
    })),
    itemsPrice,
    discount,
    shippingPrice,
    totalPrice: total,
    orderStatus: 'Processing'
  };

  try {
     const res = await axiosInstance.post('/orders', orderData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    clearCart();
    window.location.href = `/order-confirmation/${res.data._id}`;
  } catch (err) {
    console.error('Order creation failed:', err);
    alert(err.response?.data?.message || 'Order creation failed.');
    setProcessing(false);
    clickedOnceRef.current = false;
  }
};


  const handleCOD = () => {
    if (!guardClick()) return;
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode || !selectedShipping) {
      alert('Please fill in all required shipping fields and select shipping method.');
      setProcessing(false);
      clickedOnceRef.current = false;
      return;
    }
    createOrder('COD', 'Pending');
  };

  const handlePrepaid = async () => {
    if (!guardClick()) return;
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode || !selectedShipping) {
      alert('Please fill in all required shipping fields and select shipping method.');
      setProcessing(false);
      clickedOnceRef.current = false;
      return;
    }
    if (!razorpayLoaded) await loadRazorpayScript();

     const res = await axiosInstance.post('/payment/create-order',
      {
        amount: payableNow,
        orderItems: cartItems.map(item => ({
          product: item._id,
          name: item.title,
          image: Array.isArray(item.images) && item.images.length > 0
            ? item.images[0]
            : item.image || '',
          price: parseFloat(item.price),
          quantity: item.quantity ? Number(item.quantity) : 1,
          customization: item.customization || []
        })),
        shippingInfo,
        itemsPrice,
        discount,
        shippingPrice,
        totalPrice: total
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { razorpayOrder } = res.data;

    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY,
      amount: razorpayOrder.amount,
      currency: 'INR',
      name: 'Dignify Deals',
      description: 'Order Payment',
      order_id: razorpayOrder.id,
      // ✅ Updated handlePrepaid handler section
handler: async function (response) {
  try {
    const verifyRes = await axiosInstance.post('/payment/verify',
      {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (verifyRes.data.success) {
      // create order only after successful verification
      createOrder(
        'RAZORPAY',
        'Paid',
        response.razorpay_payment_id,
        {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        }
      );
    } else {
      alert('Payment verification failed');
      setProcessing(false);
      clickedOnceRef.current = false;
    }
  } catch (error) {
    console.error(error);
    alert('Verification error');
    setProcessing(false);
    clickedOnceRef.current = false;
  }
},
      prefill: {
        name: shippingInfo.name,
        contact: shippingInfo.phone
      },
      theme: { color: '#556B2F' },
      modal: {
        ondismiss: () => {
          setProcessing(false);
          clickedOnceRef.current = false;
        }
      }
    });
    rzp.open();
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>

      {/* Cart Items */}
      <div className="checkout-cart-box">
        <h3>Your Cart</h3>
        <div className="checkout-cart-row">
          {cartItems.map((item, idx) => (
            <React.Fragment key={idx}>
              <div className="checkout-cart-item">
                <img
                  src={
                    Array.isArray(item.images) && item.images.length > 0
                      ? item.images[0]
                      : item.image || "/placeholder.png"
                  }
                  alt={item.title}
                  className="checkout-cart-image"
                />
                <div>
                  <strong>{item.title}</strong><br />
                  <span>₹{item.price} x {item.quantity}</span>
                  {item.customization?.length > 0 && item.customization.map((c, i) => (
                    <div key={i}>
                      <strong>{c.label}:</strong> {c.type === 'file' ? c.value?.split('/').pop() : c.value}
                    </div>
                  ))}
                </div>
              </div>
              {idx < cartItems.length - 1 && <span className="plus-sign">+</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Shipping Form */}
      <div className="shipping-form">
        <h3>Shipping Info</h3>
        {['name', 'phone', 'address', 'city', 'postalCode'].map(field => (
          <div key={field}>
            <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
            {field === 'address' ? (
              <textarea
                value={shippingInfo[field]}
                required
                onChange={e => setShippingInfo({ ...shippingInfo, [field]: e.target.value })}
              />
            ) : (
              <input
                value={shippingInfo[field]}
                required
                onChange={e => setShippingInfo({ ...shippingInfo, [field]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>

      {/* Shipping Method */}
      <div className="checkout-shipping">
        <h3>Shipping Method</h3>
        {shippingRates.map(rate => (
          <div key={rate._id}>
            <input type="radio" name="shipping" checked={selectedShipping?._id === rate._id} onChange={() => setSelectedShipping(rate)} /> {rate.name} - ₹{rate.rate}
          </div>
        ))}
      </div>

      {/* Payment Method */}
      <div className="checkout-payment">
        <h3>Payment Method</h3>
        {paymentOptions?.fullPrepaid?.enabled && (
          <div>
            <input type="radio" name="payment" value="fullPrepaid" checked={selectedPayment === 'fullPrepaid'} onChange={() => setSelectedPayment('fullPrepaid')} />
            Full Prepaid - (Get ₹{getDiscount()} off)
          </div>
        )}
        {paymentOptions?.partialPayment?.enabled && (
          <div>
            <input type="radio" name="payment" value="partialPayment" checked={selectedPayment === 'partialPayment'} onChange={() => setSelectedPayment('partialPayment')} />
            Partial Payment - Pay ₹{getAdvance()} now, Balance ₹{itemsPrice - getAdvance()} on Delivery
          </div>
        )}
        {paymentOptions?.cod?.enabled && (
          <div>
            <input type="radio" name="payment" value="COD" checked={selectedPayment === 'COD'} onChange={() => setSelectedPayment('COD')} />
            Cash on Delivery - ₹{itemsPrice + shippingPrice} (No discount)
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="checkout-summary">
        <h3>Order Summary</h3>
        <p><strong>Items:</strong> ₹{itemsPrice}</p>
        <p><strong>Shipping:</strong> ₹{shippingPrice}</p>
        {discount > 0 && <p><strong>Discount:</strong> -₹{discount}</p>}
        <p><strong>Total:</strong> ₹{total}</p>
        {selectedPayment === 'partialPayment' && <p><strong>Pay Now:</strong> ₹{advance} <br /><strong>Balance on Delivery:</strong> ₹{total - advance}</p>}
        {selectedPayment === 'fullPrepaid' && <p><strong>Pay Now:</strong> ₹{total}</p>}
        {selectedPayment === 'COD' && <p><strong>Pay on Delivery:</strong> ₹{total}</p>}
      </div>

      {selectedPayment === 'COD' ? (
        <button className="place-order-btn" onClick={handleCOD} disabled={processing}>
          {processing ? 'Placing Order...' : 'Place Order'}
        </button>
      ) : (
        <button className="pay-order-btn" onClick={handlePrepaid} disabled={processing}>
          {processing ? 'Processing Payment...' : 'Pay & Place Order'}
        </button>
      )}
    </div>
  );
};

export default CheckoutStep1;
