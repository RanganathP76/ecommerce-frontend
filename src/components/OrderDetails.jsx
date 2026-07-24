import React from "react";

const OrderDetails = ({ order }) => {
  return (
    <div className="cuz-order-details">

      {/* Shipping */}
      <div className="cuz-detail-card">
        <h3>📍 Shipping Information</h3>

        <div className="cuz-detail-grid">

          <div>
            <span>Name</span>
            <strong>{order.shippingInfo.name}</strong>
          </div>

          <div>
            <span>Phone</span>
            <strong>{order.shippingInfo.phone}</strong>
          </div>

          <div className="full">
            <span>Address</span>
            <strong>
              {order.shippingInfo.address},{" "}
              {order.shippingInfo.city},{" "}
              {order.shippingInfo.postalCode},{" "}
              {order.shippingInfo.country}
            </strong>
          </div>

        </div>
      </div>

      {/* Payment */}
      <div className="cuz-detail-card">
        <h3>💳 Payment</h3>

        <div className="cuz-detail-grid">

          <div>
            <span>Method</span>
            <strong>{order.paymentInfo.method}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{order.paymentInfo.status}</strong>
          </div>

        </div>
      </div>

      {/* Price */}
      <div className="cuz-detail-card">
        <h3>🧾 Price Summary</h3>

        <div className="cuz-price-list">

          <div>
            <span>Items</span>
            <strong>₹{order.itemsPrice.toFixed(2)}</strong>
          </div>

          <div>
            <span>Shipping</span>
            <strong>₹{order.shippingPrice.toFixed(2)}</strong>
          </div>

          <div>
            <span>Discount</span>
            <strong>- ₹{order.discount.toFixed(2)}</strong>
          </div>

          <div>
            <span>Paid</span>
            <strong>₹{order.amountPaid.toFixed(2)}</strong>
          </div>

          {order.amountDue > 0 && (
            <div>
              <span>Due</span>
              <strong>₹{order.amountDue.toFixed(2)}</strong>
            </div>
          )}

          <div className="total">
            <span>Total</span>
            <strong>₹{order.totalPrice.toFixed(2)}</strong>
          </div>

        </div>
      </div>

      {/* Products */}
      <div className="cuz-detail-card">

        <h3>🛍 Ordered Products</h3>

        {order.orderItems.map((item, index) => (
          <div
            className="cuz-product-row"
            key={index}
          >

            <img
              src={item.image || "/placeholder.png"}
              alt={item.name}
            />

            <div className="cuz-product-info">

              <h4>{item.name}</h4>

              <p>
                ₹{item.price.toFixed(2)} × {item.quantity}
              </p>

              {item.specifications?.length > 0 && (

                <div className="cuz-tag-group">

                  {item.specifications.map((spec, i) => (
                    <span
                      className="cuz-tag"
                      key={i}
                    >
                      {spec.key}: {spec.value}
                    </span>
                  ))}

                </div>

              )}

              {item.customization?.length > 0 && (

                <div className="cuz-custom-box">

                  <h5>Customization</h5>

                  {item.customization.map((custom, i) => (

                    <div
                      className="cuz-custom-row"
                      key={i}
                    >

                      <span>{custom.label}</span>

                      <strong>

                        {custom.type === "file" ? (

                          <a
                            href={custom.value}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View File
                          </a>

                        ) : (

                          custom.value

                        )}

                      </strong>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </div>
        ))}

      </div>

    </div>
  );
};

export default OrderDetails;