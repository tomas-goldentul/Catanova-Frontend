import { useState } from 'react';
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
  const [tab, setTab] = useState('tienda');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);

  const irAComprar = (id) => {
    setProductoSeleccionado(id);
    setTab('comprar');
  };

  return (
    <div className="app-container">
      <Navbar
        tabActiva={tab}
        onNavegar={(destino) => setTab(destino)}
        onLogoClick={() => setTab('tienda')}
      />

      {tab === 'tienda' && (
        <MiTienda
          onIrAGaleria={() => setTab('galeria')}
          onIrAEnvios={() => setTab('envios')}
          onVerTiendaPublica={() => setTab('catalogo')}
          onIrAVentas={() => setTab('ventas')}
        />
      )}
      {tab === 'envios' && (
        <Envios
          onVolver={() => setTab('tienda')}
          onIrALogin={() => setTab('login')}
        />
      )}
      {tab === 'galeria' && (
        <GaleriaProductos
          onVerEnTienda={() => setTab('catalogo')}
        />
      )}
      {tab === 'catalogo' && (
        <Catalogo
          tiendaSeleccionada={tiendaSeleccionada}
          onVerProducto={(id) => {
            setProductoSeleccionado(id);
            setTab('producto');
          }}
          onComprar={irAComprar}
        />
      )}
      {tab === 'productos' && <Productos />}
      {tab === 'producto' && (
        <Producto
          productoId={productoSeleccionado}
          onVolver={() => setTab('catalogo')}
        />
      )}
      {tab === 'login' && <Login />}
      {tab === 'pedidos' && <Pedidos />}
      {tab === 'comprar' && (
        <Producto
          productoId={productoSeleccionado}
          onVolver={() => setTab('catalogo')}
        />
      )}
      {tab === 'categorias' && <GestionCategorias />}

      <Chatbot />

      {tab === 'catalogoTiendas' && (
        <CatalogoTiendas
          onEntrar={(tienda) => {
            setTiendaSeleccionada(tienda.id_tienda);
            setTab('catalogo');
          }}
        />
      )}

      {tab === 'ventas' && (
        <Ventas onVolver={() => setTab('tienda')} />
      )}

    </div>
  );
}

export default App;
