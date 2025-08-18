import React from "react";
import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* Links */}
        <div className="footer-links">
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/return-policy">Return Policy</a>
          <a href="/terms">Terms & Conditions</a>
          <a href="/shipping-policy">Shipping Policy</a>
        </div>

        {/* Contact */}
        <div className="footer-contact">
          <p>
            📧 <a href="mailto:dignifydeals@gmail.com">support@dignifydeals.com</a> | 
            📞 <a href="tel:+918050084991">+91-8050084991</a>
          </p>
        </div>

        {/* Social Icons */}
        <div className="footer-icons">
          <a href="https://www.instagram.com/dignifydeals?utm_source=ig_web_button_share_sheet&igsh=a2l5bjU4b3ltMTRl" target="_blank" rel="noopener noreferrer">
            <FaInstagram />
          </a>
          <a href="https://m.facebook.com/profile.php?id=61574254927966&name=xhp_nt__fb__action__open_user" target="_blank" rel="noopener noreferrer">
            <FaFacebook />
          </a>
          <a href="https://wa.me/918050084991" target="_blank" rel="noopener noreferrer">
            <FaWhatsapp />
          </a>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          © {new Date().getFullYear()} DignifyDeals
        </div>
      </div>
    </footer>
  );
};

export default Footer;
