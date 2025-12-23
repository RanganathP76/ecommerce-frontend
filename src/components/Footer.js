import React from "react";
import {
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">

      

      {/* Contact Section */}
      <div className="contact-section">
        <h3>Contact Us</h3>
        <div className="contact-item">
          <FaMapMarkerAlt className="contact-icon" />
          <p> #24, Muddinapalya, Bengaluru, Karnataka, India</p>
        </div>
        <div className="contact-item">
          <FaEnvelope className="contact-icon" />
          <p>support@cuztory.in</p>
        </div>
        <div className="contact-item">
          <FaPhoneAlt className="contact-icon" />
          <p>+91 80-500 84991</p>
        </div>

        <div className="social-icons">
          <a href="https://www.instagram.com/cuztory.in?igsh=MXNyamx4NW5wc3dxcQ==" target="_blank" rel="noreferrer">
            <FaInstagram />
          </a>
          <a href="https://www.facebook.com/profile.php?id=61574254927966" target="_blank" rel="noreferrer">
            <FaFacebook />
          </a>
          <a href="https://wa.me/918050084991" target="_blank" rel="noreferrer">
            <FaWhatsapp />
          </a>
        </div>
      </div>

      {/* Purple Footer Links Section */}
      <div className="policy-footer">
        <div className="footer-links">
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/return-policy">Return Policy</a>
          <a href="/terms">Terms & Conditions</a>
          <a href="/shipping-policy">Shipping Policy</a>
        </div>
        <p className="footer-bottom">
          © {new Date().getFullYear()} Cuztory.in | All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

