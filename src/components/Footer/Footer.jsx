import './Footer.css';
import { FaTiktok, FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-left">
        <button className="footer-btn">Soporte</button>
        <button className="footer-btn">Ayuda</button>
      </div>

      <div className="footer-center">
        <span className="footer-brand">Catanova</span>
        <span className="footer-copy">© 2025 · Todos los derechos reservados</span>
      </div>

      <div className="footer-right">
        <a href="#" className="social-icon" aria-label="TikTok"><FaTiktok /></a>
        <a href="#" className="social-icon" aria-label="X"><FaXTwitter /></a>
        <a href="#" className="social-icon" aria-label="Facebook"><FaFacebookF /></a>
        <a href="#" className="social-icon" aria-label="YouTube"><FaYoutube /></a>
        <a href="#" className="social-icon" aria-label="Instagram"><FaInstagram /></a>
      </div>

    </footer>
  );
}

export default Footer;
