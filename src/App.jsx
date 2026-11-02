import { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar/Navbar';
import Chatbot from './components/Chatbot/Chatbot';
import MiTienda from './components/MiTienda/MiTienda';
import GaleriaProductos from './components/GaleriaProductos/GaleriaProductos';
import Catalogo from './components/Catalogo/Catalogo';
import Productos from './components/Productos/productos';
import Producto from './components/Producto/Producto';
import Login from './components/Login/Login';
import Pedidos from './components/Pedidos/Pedidos';
import Envios from './components/Envios/Envios';
import CatalogoTiendas from './components/CatalogoTiendas/CatalogoTiendas';
import Ventas from './components/RegistrarVenta/Ventas';

function App() {
  const [tab, setTab] = useState(localStorage.getItem('token') ? 'tienda' : 'login');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);
  // Pedido cuyo seguimiento se abre directo al entrar a Envíos (desde "Ver seguimiento" en Pedidos).
  const [pedidoEnSeguimiento, setPedidoEnSeguimiento] = useState(null);

  // Reactivo al login/logout para mostrar u ocultar el Navbar y bloquear rutas.
  const [logueado, setLogueado] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const sincronizar = () => {
      const hayToken = Boolean(localStorage.getItem('token'));
      setLogueado(hayToken);
      if (!hayToken) setTab('login');
    };
    window.addEventListener('catanova:auth', sincronizar);
    return () => window.removeEventListener('catanova:auth', sincronizar);
  }, []);

  // Toda navegación pasa por aquí; si no hay sesión activa, se bloquea en login.
  const navegar = (destino) => {
    if (!localStorage.getItem('token')) {
      setTab('login');
      return;
    }
    setTab(destino);
  };

  const irAComprar = (id) => {
    setProductoSeleccionado(id);
    navegar('comprar');
  };

  const irAEnvios = (idPedido = null) => {
    setPedidoEnSeguimiento(idPedido);
    navegar('envios');
  };

  return (
    <div className="app-container">
      {logueado ? (
        <Navbar
          tabActiva={tab}
          onNavegar={(destino) => (destino === 'envios' ? irAEnvios() : navegar(destino))}
          onLogoClick={() => navegar('tienda')}
        />
      ) : (
        <Navbar
          tabActiva={tab}
          bloqueado
          onNavegar={() => {}}
          onLogoClick={() => {}}
        />
      )}

      {tab === 'tienda' && (
        <MiTienda
          onIrAGaleria={() => navegar('galeria')}
          onIrAEnvios={() => irAEnvios()}
          onVerTiendaPublica={() => navegar('catalogo')}
          onIrAVentas={() => navegar('ventas')}
        />
      )}
      {tab === 'envios' && (
        <Envios
          pedidoInicial={pedidoEnSeguimiento}
          onVolver={() => navegar('tienda')}
          onIrALogin={() => navegar('login')}
        />
      )}
      {tab === 'galeria' && (
        <GaleriaProductos
          onVerEnTienda={() => navegar('catalogo')}
        />
      )}
      {tab === 'catalogo' && (
        <Catalogo
          tiendaSeleccionada={tiendaSeleccionada}
          onVerProducto={(id) => {
            setProductoSeleccionado(id);
            navegar('producto');
          }}
          onComprar={irAComprar}
        />
      )}
      {tab === 'productos' && <Productos />}
      {tab === 'producto' && (
        <Producto
          productoId={productoSeleccionado}
          onVolver={() => navegar('catalogo')}
        />
      )}
      {tab === 'login' && <Login onLogin={() => { navegar('tienda'); }} />}
      {tab === 'pedidos' && <Pedidos onVerSeguimiento={irAEnvios} />}
      {tab === 'comprar' && (
        <Producto
          productoId={productoSeleccionado}
          onVolver={() => navegar('catalogo')}
        />
      )}
      {tab === 'categorias' && <GestionCategorias />}

      <Chatbot />

      {tab === 'catalogoTiendas' && (
        <CatalogoTiendas
          onEntrar={(tienda) => {
            setTiendaSeleccionada(tienda.id_tienda);
            navegar('catalogo');
          }}
        />
      )}

      {tab === 'ventas' && (
        <Ventas onVolver={() => navegar('tienda')} />
      )}

    </div>
  );
}

export default App;
