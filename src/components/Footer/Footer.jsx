import './Footer.css';
import { FaTiktok, FaFacebookF, FaYoutube, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const socials = [
  { icon: <FaTiktok />, label: "TikTok" },
  { icon: <FaXTwitter />, label: "X" },
  { icon: <FaFacebookF />, label: "Facebook" },
  { icon: <FaYoutube />, label: "YouTube" },
  { icon: <FaInstagram />, label: "Instagram" },
];

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-buttons">
        <button className="footer-btn">Soporte</button>
        <button className="footer-btn">Ayuda</button>
      </div>
      <div className="social-icons">
        {socials.map((s) => (
          <div className="social-icon" key={s.label} title={s.label}>
            {s.icon}
          </div>
        ))}
      </div>
    </footer>
  );
}

export default Footer;