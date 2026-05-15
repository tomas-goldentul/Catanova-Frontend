import './App.css';
import logo from './assets/logo.png';

function Navbar() {
  return (
    <nav className="navbar">

      <div className="nav-left">

        <div className="nav-hamburger">
          ☰
        </div>

        <img
          src={logo}
          alt="Catanova"
          className="logo-img"
        />

      </div>

      <ul className="nav-links">
        <li><a href="#">Funcionalidades</a></li>
        <li><a href="#">Precios</a></li>
        <li><a href="#">Sobre nosotros</a></li>
      </ul>

      <div className="nav-right">

        <button className="btn-login">
          Iniciar sesión
        </button>

        <button className="btn-crear">
          Crear tienda
        </button>

      </div>

    </nav>
  );
}

export default Navbar;