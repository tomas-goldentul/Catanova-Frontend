import { useState } from 'react';
import './App.css';
import MiTienda from './components/MiTienda/MiTienda';
import GaleriaProductos from './components/GaleriaProductos/GaleriaProductos';
import Catalogo from './components/Catalogo/Catalogo';
import Productos from './components/Productos/productos';
import Producto from './components/Producto/Producto';
import GestionCategorias from './components/GestionCategorias/GestionCategorias';

function App() {
  const [tab, setTab] = useState('tienda');

  return (
    <div className="app-container">
      <div className="app-tabs">
        <button
          type="button"
          className={tab === 'tienda' ? 'tab active' : 'tab'}
          onClick={() => setTab('tienda')}
        >
          Mi Tienda
        </button>
        <button
          type="button"
          className={tab === 'galeria' ? 'tab active' : 'tab'}
          onClick={() => setTab('galeria')}
        >
          Galería de Productos
        </button>
        <button
          type="button"
          className={tab === 'catalogo' ? 'tab active' : 'tab'}
          onClick={() => setTab('catalogo')}
        >
          Catálogo
        </button>
        <button
          type="button"
          className={tab === 'productos' ? 'tab active' : 'tab'}
          onClick={() => setTab('productos')}
        >
          Productos API
        </button>
        <button
          type="button"
          className={tab === 'producto' ? 'tab active' : 'tab'}
          onClick={() => setTab('producto')}
        >
          Producto Individual
        </button>
        <button
          type="button"
          className={tab === 'categorias' ? 'tab active' : 'tab'}
          onClick={() => setTab('categorias')}
        >
          Categorías
        </button>
      </div>

      {tab === 'tienda' && <MiTienda />}
      {tab === 'galeria' && <GaleriaProductos />}
      {tab === 'catalogo' && <Catalogo />}
      {tab === 'productos' && <Productos />}
      {tab === 'producto' && <Producto />}
      {tab === 'categorias' && <GestionCategorias />}
    </div>
  );
}

export default App;
