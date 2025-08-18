import React from "react";
import "./PolicyPages.css";

const TermsAndConditions = () => {
  return (
    <div className="policy-container">
      <h1>Terms & Conditions</h1>
      <p>
        By accessing and using our website, you agree to comply with and be bound 
        by these terms and conditions.
      </p>

      <h2>Use of Website</h2>
      <p>
        You agree to use this site for lawful purposes only. Any misuse or fraudulent 
        activity is strictly prohibited.
      </p>

      <h2>Orders & Payments</h2>
      <p>
        All orders are subject to availability and confirmation of payment. 
        Prices are subject to change without prior notice.
      </p>

      <h2>Shipping & Delivery</h2>
      <p>
        We aim to deliver orders within the estimated time but are not liable 
        for delays beyond our control.
      </p>

      <h2>Liability</h2>
      <p>
        We are not responsible for any indirect or consequential losses caused 
        by the use of our products.
      </p>

      <h2>Contact Us</h2>
      <p>
        For queries, email us at 
        <a href="mailto:support@yourstore.com"> support@yourstore.com</a>.
      </p>
    </div>
  );
};

export default TermsAndConditions;
