import { useState, useEffect } from 'react';
import './Catalogo.css';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import BurbujaChatanova from '../BurbujaChatanova/BurbujaChatanova';
import Categoria from '../Categoria/Categoria';
import { getCategorias } from '../../api/categorias';
import { getProductosPorCategoria } from '../../api/productos';
import { getNombre, getSlogan } from '../../api/tiendas';

import {
  IconoLapiz,
  IconoOjo,
  IconoChispas
} from '../Icons/Icons';

// Productos de ejemplo hasta conectar con el backend
const MOCK_PRODUCTOS = [
  { id: 1, nombre: 'Remera oversize', precio: 50000 },
  { id: 2, nombre: 'Pantalón cargo', precio: 45000 },
  { id: 3, nombre: 'Campera bomber', precio: 85000 },
  { id: 4, nombre: 'Buzo hoodie', precio: 65000 },
  { id: 5, nombre: 'Calza deportiva', precio: 35000 },
];

// ── Sub-componentes de los paneles ──

function SelectorProducto({ onAgregar }) {
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);

  const handleAgregar = () => {
    if (!productoId) return;
    const producto = MOCK_PRODUCTOS.find(p => p.id === Number(productoId));
    if (!producto) return;
    onAgregar(producto, Number(cantidad));
    setProductoId('');
    setCantidad(1);
  };

  return (
    <div className="cat-panel__selector-row">
      <div className="cat-panel__campo">
        <label className="cat-panel__label">Productos:</label>
        <select
          className="cat-panel__select"
          value={productoId}
          onChange={e => setProductoId(e.target.value)}
        >
          <option value="">Selecciona un producto</option>
          {MOCK_PRODUCTOS.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>
      <div className="cat-panel__campo cat-panel__campo--cantidad">
        <label className="cat-panel__label">Cantidad</label>
        <input
          className="cat-panel__input cat-panel__input--cantidad"
          type="number"
          min="1"
          value={cantidad}
          onChange={e => setCantidad(e.target.value)}
        />
      </div>
      <button className="cat-panel__btn-agregar-item" onClick={handleAgregar}>
        + Agregar
      </button>
    </div>
  );
}

function TablaProductos({ lista, onQuitar }) {
  if (lista.length === 0) return null;

  return (
    <div className="cat-panel__tabla-wrap">
      <span className="cat-panel__tabla-titulo">Lista de productos</span>
      <table className="cat-panel__tabla">
        <thead>
          <tr>
            <th className="cat-panel__th"></th>
            <th className="cat-panel__th cat-panel__th--centro">Cantidad</th>
            <th className="cat-panel__th cat-panel__th--centro">Precio unitario</th>
            <th className="cat-panel__th cat-panel__th--centro">Total</th>
            <th className="cat-panel__th"></th>
          </tr>
        </thead>
        <tbody>
          {lista.map(item => (
            <tr key={item.id} className="cat-panel__fila">
              <td className="cat-panel__td">{item.nombre}</td>
              <td className="cat-panel__td cat-panel__td--centro">{item.cantidad}</td>
              <td className="cat-panel__td cat-panel__td--centro">
                ${item.precioUnitario.toLocaleString('es-AR')}
              </td>
              <td className="cat-panel__td cat-panel__td--centro">
                ${(item.precioUnitario * item.cantidad).toLocaleString('es-AR')}
              </td>
              <td className="cat-panel__td cat-panel__td--accion">
                <button
                  className="cat-panel__btn-quitar"
                  onClick={() => onQuitar(item.id)}
                  aria-label="Quitar producto"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PanelCrear({ onCrear, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [lista, setLista] = useState([]);
  const [error, setError] = useState('');

  const handleAgregar = (producto, cantidad) => {
    setLista(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) {
        return prev.map(i =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [...prev, { id: producto.id, nombre: producto.nombre, cantidad, precioUnitario: producto.precio }];
    });
  };

  const handleQuitar = (id) => setLista(prev => prev.filter(i => i.id !== id));

  const handleSubmit = () => {
    if (!nombre.trim()) {
      setError('Ingresá un nombre para la categoría.');
      return;
    }
    if (lista.length === 0) {
      setError('Agregá al menos un producto.');
      return;
    }
    onCrear({ nombre: nombre.trim(), productos: lista });
  };

  return (
    <div className="cat-panel">
      <h2 className="cat-panel__titulo">Crear Categoría</h2>

      <div className="cat-panel__campo cat-panel__campo--nombre">
        <label className="cat-panel__label cat-panel__label--destacado" htmlFor="cat-panel-nombre">
          Nombre:
        </label>
        <div className="cat-panel__input-busqueda-wrap">
          <span className="cat-panel__input-icono">🔍</span>
          <input
            id="cat-panel-nombre"
            className="cat-panel__input cat-panel__input--busqueda"
            type="text"
            placeholder="Busca una categoría"
            value={nombre}
            onChange={e => { setNombre(e.target.value); setError(''); }}
          />
        </div>
      </div>

      <SelectorProducto onAgregar={handleAgregar} />
      <TablaProductos lista={lista} onQuitar={handleQuitar} />

      {error && <p className="cat-panel__error">{error}</p>}

      <div className="cat-panel__acciones cat-panel__acciones--derecha">
        <button className="cat-panel__btn cat-panel__btn--secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button className="cat-panel__btn cat-panel__btn--principal" onClick={handleSubmit}>
          Agregar
        </button>
      </div>
    </div>
  );
}

function PanelEditar({ categoria, onGuardar, onBorrar, onCancelar }) {
  const [lista, setLista] = useState(
    (categoria.productos || []).map(p => ({
      id: p.id ?? p.id_producto,
      nombre: p.nombre ?? 'Producto',
      cantidad: p.cantidad ?? 1,
      precioUnitario: p.precioUnitario ?? p.precio ?? 0,
    }))
  );

  const handleAgregar = (producto, cantidad) => {
    setLista(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) {
        return prev.map(i =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [...prev, { id: producto.id, nombre: producto.nombre, cantidad, precioUnitario: producto.precio }];
    });
  };

  const handleQuitar = (id) => setLista(prev => prev.filter(i => i.id !== id));

  return (
    <div className="cat-panel">
      <h2 className="cat-panel__titulo">Editar Categoría</h2>

      <SelectorProducto onAgregar={handleAgregar} />
      <TablaProductos lista={lista} onQuitar={handleQuitar} />

      <div className="cat-panel__acciones cat-panel__acciones--editar">
        <button className="cat-panel__btn cat-panel__btn--peligro" onClick={onBorrar}>
          Borrar Categoría
        </button>
        <button
          className="cat-panel__btn cat-panel__btn--principal"
          onClick={() => onGuardar({ ...categoria, productos: lista })}
        >
          Agregar
        </button>
      </div>
    </div>
  );
}

function PanelBorrar({ onConfirmar, onVolver }) {
  return (
    <div className="cat-panel cat-panel--borrar">
      <h2 className="cat-panel__titulo cat-panel__titulo--borrar">
        ¿Seguro que quieres eliminar la Categoría?
      </h2>
      <p className="cat-panel__subtitulo">Al eliminarla no la podrás recuperar</p>
      <div className="cat-panel__acciones">
        <button className="cat-panel__btn cat-panel__btn--eliminar" onClick={onConfirmar}>
          Eliminar
        </button>
        <button className="cat-panel__btn cat-panel__btn--volver" onClick={onVolver}>
          Volver
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ──

function Catalogo() {
  const [categorias, setCategorias] = useState([]);
  const [tabActivo, setTabActivo] = useState(null);
  const [infoTienda, setInfoTienda] = useState({
    nombre: 'Cargando tienda...',
    slogan: 'Cargando slogan...'
  });
  const [vistaPanel, setVistaPanel] = useState(null); // null | 'crear' | 'editar' | 'borrar'
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  useEffect(() => {
    const idTienda = 1;

    async function iniciarCarga() {
      try {
        const [categoriasDB, dataNombre, dataSlogan] = await Promise.all([
          getCategorias(),
          getNombre(idTienda),
          getSlogan(idTienda)
        ]);

        setInfoTienda({
          nombre: dataNombre?.nombre || 'M51 Jeans',
          slogan: dataSlogan?.slogan || 'Donde la ropa es la felicidad'
        });

        const categoriesConProductos = await Promise.all(
          categoriasDB.map(async (cat) => {
            const productos = await getProductosPorCategoria(cat.id_categoria);
            return { ...cat, productos };
          })
        );

        setCategorias(categoriesConProductos);

        if (categoriesConProductos.length > 0) {
          setTabActivo(categoriesConProductos[0].id);
        }

      } catch (error) {
        console.error("Error en la carga de datos:", error);
        setInfoTienda({
          nombre: "M51 Jeans",
          slogan: "Donde la ropa es la felicidad"
        });
      }
    }

    iniciarCarga();
  }, []);

  const irASeccion = (id) => {
    setTabActivo(id);
    const el = document.getElementById(`seccion-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const abrirEditar = (cat) => {
    setCategoriaEditando(cat);
    setVistaPanel('editar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cerrarPanel = () => {
    setVistaPanel(null);
    setCategoriaEditando(null);
  };

  const handleCrear = (nueva) => {
    const nuevaCategoria = { id: Date.now(), id_categoria: Date.now(), ...nueva };
    setCategorias(prev => [...prev, nuevaCategoria]);
    cerrarPanel();
  };

  const handleGuardar = (editada) => {
    setCategorias(prev => prev.map(c =>
      (c.id ?? c.id_categoria) === (editada.id ?? editada.id_categoria) ? editada : c
    ));
    cerrarPanel();
  };

  const handleBorrar = () => {
    const idBorrar = categoriaEditando.id ?? categoriaEditando.id_categoria;
    setCategorias(prev => prev.filter(c => (c.id ?? c.id_categoria) !== idBorrar));
    cerrarPanel();
  };

  return (
    <>
      <Navbar />
      <main className="cat-main">

        <div className="cat-header">
          <div className="cat-header__tienda">
            <h1 className="cat-header__nombre">{infoTienda.nombre}</h1>
            <p className="cat-header__tagline">{infoTienda.slogan}</p>
            <div className="cat-header__meta">
              <span className="cat-header__est">Est. 2022</span>
              <span className="cat-header__stars">★★★★★</span>
              <span className="cat-header__rating">5/5</span>
            </div>
            <button className="cat-header__btn-editar">
              Editar Tienda <IconoLapiz />
            </button>
          </div>

          <div className="cat-header__divider" />

          <div className="cat-header__right">
            <h2 className="cat-header__titulo">Catálogo</h2>
            <p className="cat-header__subtitulo">Hechá un vistazo a tus productos</p>
            <button className="cat-header__btn-stats">
              <IconoOjo /> Ver Estadísticas
            </button>
          </div>
        </div>

        <div className="cat-productos">
          <h2 className="cat-productos__titulo">Productos:</h2>

          {vistaPanel === 'crear' && (
            <PanelCrear onCrear={handleCrear} onCancelar={cerrarPanel} />
          )}

          {vistaPanel === 'editar' && categoriaEditando && (
            <PanelEditar
              categoria={categoriaEditando}
              onGuardar={handleGuardar}
              onBorrar={() => setVistaPanel('borrar')}
              onCancelar={cerrarPanel}
            />
          )}

          {vistaPanel === 'borrar' && categoriaEditando && (
            <PanelBorrar
              onConfirmar={handleBorrar}
              onVolver={() => setVistaPanel('editar')}
            />
          )}

          <div className="cat-tabs">
            {categorias.map(cat => (
              <button
                key={cat.id ?? cat.id_categoria}
                className={`cat-tab${tabActivo === (cat.id ?? cat.id_categoria) ? ' cat-tab--activo' : ''}`}
                onClick={() => irASeccion(cat.id ?? cat.id_categoria)}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {categorias.map(cat => (
            <Categoria
              key={cat.id ?? cat.id_categoria}
              {...cat}
              onEditar={() => abrirEditar(cat)}
            />
          ))}

          <div className="cat-crear">
            <div className="cat-crear__card">
              <div className="cat-crear__icon-wrap">
                <IconoChispas />
              </div>
              <h3 className="cat-crear__titulo">¡Seguí creciendo!</h3>
              <p className="cat-crear__texto">
                Creá una nueva categoría
                y mostrale a tus clientes todo lo que tenés para ofrecer.
              </p>
              <button
                className="cat-crear__btn"
                onClick={() => setVistaPanel('crear')}
              >
                + Crear nueva categoría
              </button>
            </div>
          </div>
        </div>

      </main>
      <Footer />
      <BurbujaChatanova />
    </>
  );
}

export default Catalogo;
