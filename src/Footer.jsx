import './App.css';

import {
  FaTiktok,
  FaFacebookF,
  FaInstagram,
  FaYoutube
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-buttons">
        <button className="footer-btn">
          Soporte
        </button>

        <button className="footer-btn">
          Ayuda
        </button>
      </div>

      <div className="social-icons">

        <div className="social-icon">
          <FaTiktok />
        </div>

        <div className="social-icon">
          <FaXTwitter />
        </div>

        <div className="social-icon">
          <FaFacebookF />
        </div>

        <div className="social-icon">
          <FaInstagram />
        </div>

        <div className="social-icon">
          <FaYoutube />
        </div>

      </div>

    </footer>
  );
}

export default Footer;