import { useState, useEffect } from 'react';
import './Catalogo.css';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import BurbujaChatanova from '../BurbujaChatanova/BurbujaChatanova';
import Categoria from '../Categoria/Categoria';
import { getCategorias } from '../../api/categorias';
import { getProductosPorCategoria } from '../../api/productos';
import { getNombre, getSlogan } from '../../api/tiendas';
import { IconoLapiz, IconoOjo, IconoChispas } from '../Icons/Icons';

// ── Datos de ejemplo para el selector de productos en los paneles ──
const PRODUCTOS_DISPONIBLES = [
  { id: 1, nombre: 'Remera oversize', precio: 50000 },
  { id: 2, nombre: 'Pantalón cargo',  precio: 45000 },
  { id: 3, nombre: 'Campera bomber',  precio: 85000 },
  { id: 4, nombre: 'Buzo hoodie',     precio: 65000 },
  { id: 5, nombre: 'Calza deportiva', precio: 35000 },
];

// Fallback cuando el backend no está disponible
const CATEGORIAS_MOCK = [
  {
    id: 1,
    nombre: 'Remeras',
    productos: [
      { id: 1, nombre: 'Remera oversize', precio: 50000, cantidad: 2, precioUnitario: 50000, stock: 12, ventas: 8, vistas: 40, favoritos: 3 },
      { id: 3, nombre: 'Campera bomber',  precio: 85000, cantidad: 1, precioUnitario: 85000, stock: 5,  ventas: 2, vistas: 15, favoritos: 1 },
    ],
  },
  {
    id: 2,
    nombre: 'Pantalones',
    productos: [
      { id: 2, nombre: 'Pantalón cargo', precio: 45000, cantidad: 1, precioUnitario: 45000, stock: 20, ventas: 5, vistas: 30, favoritos: 2 },
    ],
  },
];

// Normaliza una categoría de la API a la estructura interna consistente
function normalizarCategoria(cat, productos) {
  return {
    id: cat.id_categoria ?? cat.id,
    nombre: cat.nombre ?? 'Sin nombre',
    productos: (productos || []).map(p => ({
      id:             p.id_producto ?? p.id,
      nombre:         p.nombre ?? 'Producto',
      precio:         Number(p.precio) || 0,
      precioUnitario: Number(p.precioUnitario ?? p.precio) || 0,
      cantidad:       Number(p.cantidad) || 1,
      stock:          p.stock,
      ventas:         p.ventas,
      vistas:         p.vistas,
      favoritos:      p.favoritos,
    })),
  };
}

// ════════════════════════════════════════════
//   PANEL: CREAR CATEGORÍA
// ════════════════════════════════════════════

function SelectorProducto({ onAgregar }) {
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);

  const handleAgregar = () => {
    const producto = PRODUCTOS_DISPONIBLES.find(p => p.id === Number(productoId));
    if (!producto) return;
    onAgregar(producto, Math.max(1, Number(cantidad)));
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
          {PRODUCTOS_DISPONIBLES.map(p => (
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

  const agregarProducto = (producto, cantidad) => {
    setLista(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) {
        return prev.map(i =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [...prev, {
        id:             producto.id,
        nombre:         producto.nombre,
        cantidad,
        precioUnitario: producto.precio,
      }];
    });
  };

  const handleSubmit = () => {
    if (!nombre.trim()) { setError('Ingresá un nombre para la categoría.'); return; }
    if (lista.length === 0) { setError('Agregá al menos un producto.'); return; }
    onCrear({ nombre: nombre.trim(), productos: lista });
  };

  return (
    <div className="cat-panel">
      <h2 className="cat-panel__titulo">Crear Categoría</h2>

      <div className="cat-panel__campo cat-panel__campo--nombre">
        <label className="cat-panel__label cat-panel__label--destacado" htmlFor="cat-nombre-crear">
          Nombre:
        </label>
        <div className="cat-panel__input-busqueda-wrap">
          <span className="cat-panel__input-icono">🔍</span>
          <input
            id="cat-nombre-crear"
            className="cat-panel__input cat-panel__input--busqueda"
            type="text"
            placeholder="Nombre de la categoría"
            value={nombre}
            onChange={e => { setNombre(e.target.value); setError(''); }}
          />
        </div>
      </div>

      <SelectorProducto onAgregar={agregarProducto} />
      <TablaProductos
        lista={lista}
        onQuitar={id => setLista(prev => prev.filter(i => i.id !== id))}
      />

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

// ════════════════════════════════════════════
//   PANEL: EDITAR CATEGORÍA
// ════════════════════════════════════════════

function PanelEditar({ categoria, onGuardar, onBorrar, onCancelar }) {
  const [nombre, setNombre] = useState(categoria.nombre);
  const [lista, setLista] = useState(
    categoria.productos.map(p => ({
      id:             p.id,
      nombre:         p.nombre,
      cantidad:       p.cantidad ?? 1,
      precioUnitario: p.precioUnitario ?? p.precio ?? 0,
    }))
  );

  const agregarProducto = (producto, cantidad) => {
    setLista(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) {
        return prev.map(i =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [...prev, {
        id:             producto.id,
        nombre:         producto.nombre,
        cantidad,
        precioUnitario: producto.precio,
      }];
    });
  };

  const handleGuardar = () => {
    onGuardar({ ...categoria, nombre: nombre.trim() || categoria.nombre, productos: lista });
  };

  return (
    <div className="cat-panel">
      <h2 className="cat-panel__titulo">Editar Categoría</h2>

      <div className="cat-panel__campo cat-panel__campo--nombre">
        <label className="cat-panel__label cat-panel__label--destacado" htmlFor="cat-nombre-editar">
          Nombre:
        </label>
        <div className="cat-panel__input-busqueda-wrap">
          <span className="cat-panel__input-icono">🔍</span>
          <input
            id="cat-nombre-editar"
            className="cat-panel__input cat-panel__input--busqueda"
            type="text"
            placeholder="Nombre de la categoría"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>
      </div>

      <SelectorProducto onAgregar={agregarProducto} />
      <TablaProductos
        lista={lista}
        onQuitar={id => setLista(prev => prev.filter(i => i.id !== id))}
      />

      <div className="cat-panel__acciones cat-panel__acciones--editar">
        <button className="cat-panel__btn cat-panel__btn--peligro" onClick={onBorrar}>
          Borrar Categoría
        </button>
        <div className="cat-panel__acciones-derecha">
          <button className="cat-panel__btn cat-panel__btn--secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="cat-panel__btn cat-panel__btn--principal" onClick={handleGuardar}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//   PANEL: CONFIRMAR BORRADO
// ════════════════════════════════════════════

function PanelBorrar({ nombreCategoria, onConfirmar, onVolver }) {
  return (
    <div className="cat-panel cat-panel--borrar">
      <h2 className="cat-panel__titulo cat-panel__titulo--borrar">
        ¿Seguro que quieres eliminar la Categoría?
      </h2>
      <p className="cat-panel__subtitulo">
        Se eliminará <strong>"{nombreCategoria}"</strong>. Al eliminarla no la podrás recuperar.
      </p>
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

// ════════════════════════════════════════════
//   COMPONENTE PRINCIPAL
// ════════════════════════════════════════════

function Catalogo({ onVerProducto }) {
  const [categorias, setCategorias]         = useState([]);
  const [tabActivo, setTabActivo]           = useState(null);
  const [infoTienda, setInfoTienda]         = useState({ nombre: '', slogan: '' });
  const [cargando, setCargando]             = useState(true);
  const [vistaPanel, setVistaPanel]         = useState(null); // null | 'crear' | 'editar' | 'borrar'
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  useEffect(() => {
    const idTienda = 1;

    async function cargarDatos() {
      try {
        const [categoriasDB, dataNombre, dataSlogan] = await Promise.all([
          getCategorias(),
          getNombre(idTienda),
          getSlogan(idTienda),
        ]);

        setInfoTienda({
          nombre: dataNombre?.nombre || 'Mi Tienda',
          slogan: dataSlogan?.slogan || '',
        });

        const normalizadas = await Promise.all(
          categoriasDB.map(async cat => {
            const productos = await getProductosPorCategoria(cat.id_categoria ?? cat.id);
            return normalizarCategoria(cat, productos);
          })
        );

        setCategorias(normalizadas);
        if (normalizadas.length > 0) setTabActivo(normalizadas[0].id);

      } catch (error) {
        console.error('Error al cargar el catálogo:', error);
        // Fallback con datos de ejemplo para que la UI sea funcional
        setInfoTienda({ nombre: 'M51 Jeans', slogan: 'Donde la ropa es la felicidad' });
        setCategorias(CATEGORIAS_MOCK);
        setTabActivo(CATEGORIAS_MOCK[0].id);
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  // ── Navegación ──

  const irASeccion = (id) => {
    setTabActivo(id);
    const el = document.getElementById(`seccion-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Abrir / cerrar paneles ──

  const abrirCrear = () => {
    setVistaPanel('crear');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // ── CRUD sobre el estado local ──

  const handleCrear = (nueva) => {
    const nuevaCategoria = { id: Date.now(), ...nueva };
    setCategorias(prev => {
      const actualizado = [...prev, nuevaCategoria];
      setTabActivo(nuevaCategoria.id);
      return actualizado;
    });
    cerrarPanel();
    // Al conectar el back: await crearCategoria(nueva) → usar id retornado
  };

  const handleGuardar = (editada) => {
    setCategorias(prev => prev.map(c => c.id === editada.id ? editada : c));
    cerrarPanel();
    // Al conectar el back: await actualizarCategoria(editada.id, editada)
  };

  const handleBorrar = () => {
    setCategorias(prev => prev.filter(c => c.id !== categoriaEditando.id));
    cerrarPanel();
    // Al conectar el back: await eliminarCategoria(categoriaEditando.id)
  };

  return (
    <>
      <Navbar />
      <main className="cat-main">

        {/* ── Header tienda ── */}
        <div className="cat-header">
          <div className="cat-header__tienda">
            <h1 className="cat-header__nombre">{infoTienda.nombre || 'Mi Tienda'}</h1>
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

        {/* ── Sección productos ── */}
        <div className="cat-productos">
          <h2 className="cat-productos__titulo">Productos:</h2>

          {/* ── Paneles inline ── */}
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
              nombreCategoria={categoriaEditando.nombre}
              onConfirmar={handleBorrar}
              onVolver={() => setVistaPanel('editar')}
            />
          )}

          {/* ── Tabs de categorías ── */}
          {cargando ? (
            <p className="cat-cargando">Cargando categorías...</p>
          ) : (
            <>
              <div className="cat-tabs">
                {categorias.map(cat => (
                  <button
                    key={cat.id}
                    className={`cat-tab${tabActivo === cat.id ? ' cat-tab--activo' : ''}`}
                    onClick={() => irASeccion(cat.id)}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>

              {/* ── Lista de categorías ── */}
              {categorias.length === 0 ? (
                <p className="cat-vacio">No hay categorías todavía. ¡Creá la primera!</p>
              ) : (
                categorias.map(cat => (
                  <Categoria
                    key={cat.id}
                    {...cat}
                    onEditar={() => abrirEditar(cat)}
                    onVerProducto={onVerProducto}
                  />
                ))
              )}

              {/* ── Card crear categoría ── */}
              <div className="cat-crear">
                <div className="cat-crear__card">
                  <div className="cat-crear__icon-wrap">
                    <IconoChispas />
                  </div>
                  <h3 className="cat-crear__titulo">¡Seguí creciendo!</h3>
                  <p className="cat-crear__texto">
                    Creá una nueva categoría y mostrale a tus clientes todo lo que tenés para ofrecer.
                  </p>
                  <button className="cat-crear__btn" onClick={abrirCrear}>
                    + Crear nueva categoría
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </main>
      <Footer />
      <BurbujaChatanova />
    </>
  );
}

export default Catalogo;
