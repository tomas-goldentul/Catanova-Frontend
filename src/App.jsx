import { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar/Navbar';
import MiTienda from './components/MiTienda/MiTienda';
import GaleriaProductos from './components/GaleriaProductos/GaleriaProductos';
import Catalogo from './components/Catalogo/Catalogo';
import Productos from './components/Productos/productos';
import Producto from './components/Producto/Producto';
import Login from './components/Login/Login';
import Pedidos from './components/Pedidos/Pedidos';

function App() {
  const [tab, setTab] = useState('tienda');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  return (
    <div className="app-container">
      <Navbar
        onLogoClick={() => setTab('tienda')}
        tabActiva={tab}
        onNavegar={setTab}
      />

      {tab === 'tienda' && (
        <MiTienda
          onIrAGaleria={() => setTab('galeria')}
          onVerTiendaPublica={() => setTab('catalogo')}
        />
      )}
      {tab === 'galeria' && (
        <GaleriaProductos
          onVerEnTienda={() => setTab('catalogo')}
        />
      )}
      {tab === 'catalogo' && (
        <Catalogo
          onVerProducto={(id) => {
            setProductoSeleccionado(id);
            setTab('producto');
          }}
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
      {tab === 'categorias' && <GestionCategorias />}
    </div>
  );
}

export default App;
