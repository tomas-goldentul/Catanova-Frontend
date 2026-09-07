import { useEffect, useRef, useState } from 'react';
import './Navbar.css';
import logo from '../../assets/logo.png';
import Perfil from '../Perfil/Perfil';
import { IconoEngranaje, IconoPerfil, IconoConfig, IconoSalir, IconoChevronAbajo } from '../Icons/Icons';

const IconoAvatar = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ENLACES = [
  { clave: 'tienda', etiqueta: 'Mi Tienda' },
  { clave: 'galeria', etiqueta: 'Galería de Productos' },
  { clave: 'catalogo', etiqueta: 'Catálogo' },
  { clave: 'productos', etiqueta: 'Productos API' },
  { clave: 'pedidos', etiqueta: 'Ver pedidos' },
];

const DESTINOS = {
  tienda: 'tienda',
  galeria: 'galeria',
  catalogo: 'catalogo',
  productos: 'productos',
  pedidos: 'pedidos',
};

const leerSesion = () => {
  let usuario = null;
  try {
    const crudo = localStorage.getItem('user');
    usuario = crudo ? JSON.parse(crudo) : null;
  } catch (e) {
    usuario = null;
  }
  return { logueado: Boolean(localStorage.getItem('token')), usuario };
};

const nombreParaMostrar = (usuario) => {
  const nombre = usuario?.nombre?.trim() || usuario?.name?.trim() || '';
  const apellido = usuario?.apellido?.trim() || usuario?.last_name?.trim() || '';
  const texto = [nombre, apellido].filter(Boolean).join(' ').trim();
  return texto || usuario?.email?.trim() || 'Mi cuenta';
};

function Navbar({ onLogoClick, tabActiva, onNavegar }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [sesion, setSesion] = useState(leerSesion);
  const contenedorRef = useRef(null);

  useEffect(() => {
    const sincronizar = () => setSesion(leerSesion());
    window.addEventListener('catanova:auth', sincronizar);
    window.addEventListener('storage', sincronizar);
    return () => {
      window.removeEventListener('catanova:auth', sincronizar);
      window.removeEventListener('storage', sincronizar);
    };
  }, []);

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
    if (clave === 'catalogo') return tabActiva === 'catalogo' || tabActiva === 'producto';
    return tabActiva === DESTINOS[clave];
  };

  const navegar = (destino) => {
    if (onNavegar) onNavegar(destino);
  };

  const irA = (clave) => {
    setMenuAbierto(false);
    navegar(DESTINOS[clave]);
  };

  const abrirCuenta = () => {
    if (!sesion.logueado) {
      navegar('login');
      return;
    }
    setMenuAbierto((valor) => !valor);
  };

  const abrirPerfil = () => {
    setMenuAbierto(false);
    setPerfilAbierto(true);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tipo');
    localStorage.removeItem('id_tienda');
    localStorage.removeItem('user');
    setSesion({ logueado: false, usuario: null });
    setMenuAbierto(false);
    window.dispatchEvent(new Event('catanova:auth'));
    navegar('login');
  };

  const fotoPerfil = sesion.usuario?.foto_perfil || sesion.usuario?.avatar || '';

  return (
    <>
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
          onClick={abrirCuenta}
        >
          <span className="nav-avatar">
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="" className="nav-avatarFoto" />
            ) : (
              <IconoAvatar />
            )}
          </span>
          <span className="nav-usuarioInfo">
            <span className="nav-usuarioNombre">
              {sesion.logueado ? nombreParaMostrar(sesion.usuario) : 'Inicia sesión'}
            </span>
            <IconoChevronAbajo />
          </span>
          <span className="nav-engranaje">
            <IconoEngranaje />
          </span>
        </button>

        {sesion.logueado && menuAbierto && (
          <div className="nav-menu" role="menu" aria-label="Menú de usuario">
            <button type="button" role="menuitem" onClick={abrirPerfil}>
              <IconoPerfil /> Perfil
            </button>
            <button type="button" role="menuitem" onClick={() => setMenuAbierto(false)}>
              <IconoConfig /> Configuración
            </button>
            <div className="nav-menuDivisor" />
            <button type="button" role="menuitem" className="nav-menuSalir" onClick={cerrarSesion}>
              <IconoSalir /> Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>

    <Perfil abierto={perfilAbierto} onCerrar={() => setPerfilAbierto(false)} />
    </>
  );
}

export default Navbar;