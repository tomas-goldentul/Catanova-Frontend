import './Navbar.css';
import { RiMenu3Line } from "react-icons/ri";
import logo from '../../assets/logo.png';

function Navbar() {
  return (
    <nav className="navbar">
    <div className="nav-hamburger">
  <span className="hamburger-line"></span>
  <span className="hamburger-line"></span>
  <span className="hamburger-line"></span>
</div>
      <ul className="nav-links">
        <li><a href="/"> Funcionalidades</a></li>
        <li><a href="/">Precios</a></li>
        <li><a href="/">Sobre nosotros</a></li>
      </ul>
      <div className="nav-logo">
        <img src={logo} alt="Catanova" className="logo-img" />
      </div>
      <div className="nav-right">
        <button className="btn-login">LogIn</button>
        <button className="btn-crear">Crear tienda</button>
      </div>
    </nav>
  );
}

export default Navbar;