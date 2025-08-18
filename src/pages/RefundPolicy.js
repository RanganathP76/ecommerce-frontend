import React from "react";
import "./PolicyPages.css";

const RefundPolicy = () => {
  return (
    <div className="policy-container">
      <h1>Refund & Return Policy</h1>
      <p>
        We aim for 100% customer satisfaction. If you are unhappy with your order, 
        our Refund & Return Policy applies as follows.
      </p>

      <h2>Returns</h2>
      <p>
        You can request a return within 7 days of receiving your order. 
        Items must be unused, in their original packaging, and with proof of purchase.
      </p>

      <h2>Refunds</h2>
      <p>
        Once we receive and inspect your returned item, we will notify you of 
        the approval or rejection of your refund. Approved refunds will be processed 
        within 5-7 business days.
      </p>

      <h2>Exchanges</h2>
      <p>
        We replace defective or damaged items free of charge. Contact our support 
        team for assistance.
      </p>

      <h2>Contact Us</h2>
      <p>
        Email: <a href="mailto:support@yourstore.com">support@yourstore.com</a>
      </p>
    </div>
  );
};

export default RefundPolicy;
