import React from "react";
import "./PolicyPages.css";

const PrivacyPolicy = () => {
  return (
    <div className="policy-container">
      <h1>Privacy Policy</h1>
      <p>
        We value your privacy and are committed to protecting your personal information. 
        This Privacy Policy outlines how we collect, use, and safeguard your data.
      </p>

      <h2>Information We Collect</h2>
      <p>
        We may collect personal details such as your name, email, phone number, 
        shipping address, and payment information when you place an order.
      </p>

      <h2>How We Use Your Information</h2>
      <p>
        Your information is used solely to process your orders, improve our services, 
        and communicate updates and offers.
      </p>

      <h2>Data Protection</h2>
      <p>
        We use secure encryption and trusted payment gateways to protect your data.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have any privacy-related concerns, please contact us at 
        <a href="mailto:dignifydeals@gmail.com"> support@cuztory.in</a>.
      </p>
    </div>
  );
};

export default PrivacyPolicy;
