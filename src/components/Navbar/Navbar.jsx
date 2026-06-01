import './Navbar.css';
import logo from '../../assets/logo.png';

const IconoHamburger = () => (
  <svg width="20" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 20 16">
    <line x1="0" y1="2"  x2="20" y2="2"  />
    <line x1="0" y1="8"  x2="20" y2="8"  />
    <line x1="0" y1="14" x2="20" y2="14" />
  </svg>
);

function Navbar() {
  return (
    <nav className="navbar">

      <div className="nav-left">
        <button className="nav-hamburger" aria-label="Menú">
          <IconoHamburger />
        </button>
        <ul className="nav-links">
          <li><a href="#">Funcionalidades</a></li>
          <li><a href="#">Precios</a></li>
          <li><a href="#">Sobre nosotros</a></li>
        </ul>
      </div>

      <div className="nav-center">
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
