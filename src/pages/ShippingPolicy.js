import React from "react";
import "./ShippingPolicy.css";

const ShippingPolicy = () => {
  return (
    <div className="shipping-policy">
      <div className="container">
        <h1>Shipping Policy</h1>
        <p>
          At <strong>YourStoreName</strong>, we strive to deliver your orders quickly
          and efficiently. Please read our shipping policy carefully to
          understand how we process and ship your purchases.
        </p>

        <h2>Processing Time</h2>
        <p>
          Orders are processed within <strong>1-3 business days</strong> after
          receiving payment. Custom or personalized products may require
          additional processing time.
        </p>

        <h2>Shipping Methods & Delivery Time</h2>
        <ul>
          <li>
            <strong>Standard Shipping:</strong> 5-7 business days
          </li>
          <li>
            <strong>Express Shipping:</strong> 2-4 business days
          </li>
        </ul>

        <h2>Shipping Charges</h2>
        <p>
          Shipping charges are calculated at checkout based on your location and
          the weight of the products.
        </p>

        <h2>International Shipping</h2>
        <p>
          We currently offer international shipping to select countries. Please
          note that customs duties, taxes, or import fees are the responsibility
          of the buyer.
        </p>

        <h2>Tracking Your Order</h2>
        <p>
          Once your order is shipped, we will send you an email with the tracking
          number and carrier details.
        </p>

        <h2>Delays & Issues</h2>
        <p>
          While we make every effort to deliver your order on time, delays may
          occur due to unforeseen circumstances such as weather conditions or
          courier delays. In such cases, we will keep you informed.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about our shipping policy or your order,
          please contact us at{" "}
          <a href="mailto:support@yourstorename.com">
            support@yourstorename.com
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default ShippingPolicy;
