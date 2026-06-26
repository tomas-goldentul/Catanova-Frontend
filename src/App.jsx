import { useState, useEffect } from 'react';
import './App.css';
import MiTienda from './components/MiTienda/MiTienda';
import GaleriaProductos from './components/GaleriaProductos/GaleriaProductos';
import Catalogo from './components/Catalogo/Catalogo';
import Productos from './components/Productos/productos';
import Producto from './components/Producto/Producto';
<<<<<<< HEAD
import Login from './components/Login/Login';
=======
import Pedidos from './components/Pedidos/Pedidos';
>>>>>>> ed92a44acb03498f9e2035b1da37d6be2560df0d

function App() {
  const [tab, setTab] = useState('login');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Always start unauthenticated: clear any stored token/user and force login
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {}
    setAuthenticated(false);
    setTab('login');
  }, []);

  return (
    <div className="app-container">
      <div className="app-tabs">
        <button
          type="button"
          className={tab === 'tienda' ? 'tab active' : 'tab'}
          onClick={() => setTab('tienda')}
          disabled={!authenticated}
        >
          Mi Tienda
        </button>
        <button
          type="button"
          className={tab === 'galeria' ? 'tab active' : 'tab'}
          onClick={() => setTab('galeria')}
          disabled={!authenticated}
        >
          Galería de Productos
        </button>
        <button
          type="button"
          className={tab === 'catalogo' ? 'tab active' : 'tab'}
          onClick={() => setTab('catalogo')}
          disabled={!authenticated}
        >
          Catálogo
        </button>
        <button
          type="button"
          className={tab === 'productos' ? 'tab active' : 'tab'}
          onClick={() => setTab('productos')}
          disabled={!authenticated}
        >
          Productos API
        </button>
        <button
          type="button"
          className={tab === 'producto' ? 'tab active' : 'tab'}
          onClick={() => setTab('producto')}
          disabled={!authenticated}
        >
          Producto Individual
        </button>
        <button
          type="button"
<<<<<<< HEAD
          className={tab === 'login' ? 'tab active' : 'tab'}
          onClick={() => setTab('login')}
        >
          Login
        </button>
=======
          className={tab === 'pedidos' ? 'tab active' : 'tab'}
          onClick={() => setTab('pedidos')}
        >
          Ver pedidos
        </button>
      
>>>>>>> ed92a44acb03498f9e2035b1da37d6be2560df0d
      </div>

      {tab === 'tienda' && <MiTienda />}
      {tab === 'galeria' && <GaleriaProductos />}
      {tab === 'catalogo' && <Catalogo />}
      {tab === 'productos' && <Productos />}
      {tab === 'producto' && <Producto />}
<<<<<<< HEAD
      {tab === 'login' && <Login onLogin={() => setAuthenticated(true)} />}
=======
      {tab === 'pedidos' && <Pedidos />}
>>>>>>> ed92a44acb03498f9e2035b1da37d6be2560df0d
    </div>
  );
}

export default App;
