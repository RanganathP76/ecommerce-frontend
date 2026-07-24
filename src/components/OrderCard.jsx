import React from "react";

const statusColors = {
  Delivered: "#22c55e",
  Processing: "#f59e0b",
  Shipped: "#3b82f6",
  Cancelled: "#ef4444",
  Pending: "#8b5cf6",
};

const OrderCard = ({
  order,
  expanded,
  onToggle,
}) => {

  const firstItem = order.orderItems?.[0];

  return (
    <div className="cuz-order-card">

      <div
        className="cuz-order-header"
        onClick={onToggle}
      >

        <img
          className="cuz-order-thumb"
          src={firstItem?.image || "/placeholder.png"}
          alt={firstItem?.name}
        />

        <div className="cuz-order-main">

          <div className="cuz-order-top">

            <div>

              <h3>
                Order #{order._id.slice(-6).toUpperCase()}
              </h3>

              <p>
                {new Date(order.createdAt).toLocaleDateString()}
              </p>

            </div>

            <span
              className="cuz-order-status"
              style={{
                background:
                  statusColors[order.orderStatus] || "#64748b",
              }}
            >
              {order.orderStatus}
            </span>

          </div>

          <h4>

            {firstItem?.name}

            {order.orderItems.length > 1 &&
              ` +${order.orderItems.length - 1} more`}

          </h4>

          <div className="cuz-order-bottom">

            <span>
              ₹{order.totalPrice.toFixed(2)}
            </span>

            <button>

              {expanded
                ? "Hide Details ▲"
                : "View Details ▼"}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default OrderCard;