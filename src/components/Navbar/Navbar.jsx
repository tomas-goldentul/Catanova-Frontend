import { useEffect, useRef, useState } from 'react';
import './Navbar.css';
import logo from '../../assets/logo.png';
import { IconoEngranaje, IconoPerfil, IconoConfig, IconoSalir, IconoChevronAbajo } from '../Icons/Icons';

const IconoAvatar = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ENLACES = [
  { clave: 'escritorio', etiqueta: 'Escritorio' },
  { clave: 'catalogo', etiqueta: 'Catálogo' },
  { clave: 'pedidos', etiqueta: 'Pedidos' },
  { clave: 'analisis', etiqueta: 'Análisis' },
];

const DESTINOS = {
  escritorio: 'tienda',
  catalogo: 'catalogo',
  pedidos: 'pedidos',
  analisis: 'tienda',
};

const TABS_ESC = ['tienda', 'galeria', 'productos', 'producto', 'login'];

function Navbar({ onLogoClick, tabActiva, onNavegar }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    const cerrarMenu = (evento) => {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', cerrarMenu);
    return () => document.removeEventListener('mousedown', cerrarMenu);
  }, []);

  const esActivo = (clave) => {
    if (clave === 'escritorio') return TABS_ESC.includes(tabActiva);
    return tabActiva === DESTINOS[clave];
  };

  const navegar = (destino) => {
    if (onNavegar) onNavegar(destino);
  };

  const irA = (clave) => {
    setMenuAbierto(false);
    navegar(DESTINOS[clave]);
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <ul className="nav-links">
          {ENLACES.map((enlace) => (
            <li key={enlace.clave}>
              <a
                href="#"
                className={esActivo(enlace.clave) ? 'activo' : ''}
                onClick={(evento) => {
                  evento.preventDefault();
                  irA(enlace.clave);
                }}
              >
                {enlace.etiqueta}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="nav-center">
        <img
          src={logo}
          alt="Catanova"
          className="logo-img"
          onClick={onLogoClick}
          style={onLogoClick ? { cursor: 'pointer' } : undefined}
        />
      </div>

      <div className="nav-right" ref={contenedorRef}>
        <button
          type="button"
          className="nav-usuario"
          aria-expanded={menuAbierto}
          aria-haspopup="true"
          onClick={() => setMenuAbierto((valor) => !valor)}
        >
          <span className="nav-avatar">
            <IconoAvatar />
          </span>
          <span className="nav-usuarioInfo">
            <span className="nav-usuarioNombre">Mi cuenta</span>
            <IconoChevronAbajo />
          </span>
          <span className="nav-engranaje">
            <IconoEngranaje />
          </span>
        </button>

        {menuAbierto && (
          <div className="nav-menu" role="menu" aria-label="Menú de usuario">
            <button type="button" role="menuitem" onClick={() => setMenuAbierto(false)}>
              <IconoPerfil /> Perfil
            </button>
            <button type="button" role="menuitem" onClick={() => setMenuAbierto(false)}>
              <IconoConfig /> Configuración
            </button>
            <div className="nav-menuDivisor" />
            <button type="button" role="menuitem" className="nav-menuSalir" onClick={() => navegar('login')}>
              <IconoSalir /> Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;