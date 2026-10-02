import { useState, useEffect } from 'react';
import './Catalogo.css';
import Footer from '../Footer/Footer';
import Categoria from '../Categoria/Categoria';
import { crearCategoria, getCategoriasPorTienda, editarCategoria, eliminarCategoria } from '../../api/categorias';
import { getProductosPorCategoria, getProductosPorTienda } from '../../api/productos';
import { getNombre, getSlogan, abrirTienda, cerrarTienda } from '../../api/tiendas';
import { IconoLapiz, IconoOjo, IconoChispas } from '../Icons/Icons';
import { getCantidadVentasProducto } from '../../api/ventas';
import { getCantidadFavoritosProducto } from '../../api/favoritos';
import { getCantidadVistasProducto } from '../../api/vistas';

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

// ════════════════════════════════════════════
//   PANEL: CREAR CATEGORÍA
// ════════════════════════════════════════════

function SelectorProducto({ onAgregar, productosDisponibles = [] }) {
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);

  const handleAgregar = () => {
    const productoBuscado = productosDisponibles.find(p => 
      String(p.id_producto ?? p.id) === String(productoId)
    );
    if (!productoBuscado) return;
    
    const producto = {
      id: productoBuscado.id_producto ?? productoBuscado.id,
      nombre: productoBuscado.nombre,
      precio: productoBuscado.precio,
    };
    
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
          {productosDisponibles.map(p => (
            <option key={p.id_producto ?? p.id} value={p.id_producto ?? p.id}>
              {p.nombre}
            </option>
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

function PanelCrear({ onCrear, onCancelar, productosDisponibles = [] }) {
  const [nombre, setNombre] = useState('');
  const [lista, setLista] = useState([]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const agregarProducto = (producto, cantidad) => {
    setLista(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) {
        return prev.map(i =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [...prev, {
        id: producto.id,
        nombre: producto.nombre,
        cantidad,
        precioUnitario: producto.precio,
      }];
    });
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) { 
      setError('Ingresá un nombre para la categoría.'); 
      return; 
    }
    
    setGuardando(true);
    setError('');

    try {
      await onCrear({ 
        nombre: nombre.trim(),
        productos: lista
      });
    } catch (err) {
      setError(err.message || 'No se pudo crear la categoría. Intentá nuevamente.');
    } finally {
      setGuardando(false);
    }
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

      <SelectorProducto onAgregar={agregarProducto} productosDisponibles={productosDisponibles} />
      <TablaProductos
        lista={lista}
        onQuitar={id => setLista(prev => prev.filter(i => i.id !== id))}
      />

      {error && <p className="cat-panel__error">{error}</p>}

      <div className="cat-panel__acciones cat-panel__acciones--derecha">
        <button className="cat-panel__btn cat-panel__btn--secundario" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
        <button className="cat-panel__btn cat-panel__btn--principal" onClick={handleSubmit} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Agregar'}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//   PANEL: EDITAR CATEGORÍA
// ════════════════════════════════════════════

function PanelEditar({ categoria, onGuardar, onBorrar, onCancelar, productosDisponibles = [] }) {
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

      <SelectorProducto onAgregar={agregarProducto} productosDisponibles={productosDisponibles} />
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

function Catalogo({ onVerProducto, onComprar, onIrAMenuPrincipal, tiendaSeleccionada }) {
  const [categorias, setCategorias]         = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [tabActivo, setTabActivo]           = useState(null);
  const [infoTienda, setInfoTienda]         = useState({ nombre: '', slogan: '' });
  const [cargando, setCargando]             = useState(true);
  const [vistaPanel, setVistaPanel]         = useState(null); // null | 'crear' | 'editar' | 'borrar'
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  const tipoSesion = typeof localStorage !== 'undefined' ? localStorage.getItem('tipo') : null;
  const esTienda = tipoSesion === 'tienda';

  useEffect(() => {
    const tiendaIdRaw = localStorage.getItem('id_tienda');
    const idTiendaSesion = tiendaIdRaw ? Number(tiendaIdRaw) : null;
    
    const idTienda = esTienda
      ? idTiendaSesion
      : tiendaSeleccionada;

    async function cargarDatos() {
      try {
        if (!idTienda || Number.isNaN(idTienda)) {
          throw new Error('No hay tienda iniciada en la sesión');
        }

        const [categoriasDB, dataNombre, dataSlogan, productosDelBackend] = await Promise.all([
          getCategoriasPorTienda(idTienda),
          getNombre(idTienda),
          getSlogan(idTienda),
          getProductosPorTienda(idTienda),
        ]);

        setInfoTienda({
          nombre: dataNombre?.nombre || 'Mi Tienda',
          slogan: dataSlogan?.slogan || '',
        });

        // Guardar productos disponibles
        setProductosDisponibles(Array.isArray(productosDelBackend) ? productosDelBackend : []);

        const normalizadas = await Promise.all(
          categoriasDB.map(async cat => {
            console.log(categoriasDB);
            const productos = await getProductosPorCategoria(
              cat.id_categoria ?? cat.id,
              idTienda
            );

            console.log("Categoría:", cat.nombre, cat.id_categoria ?? cat.id);
            console.log("Productos:", productos);

            let productosConAnaliticas;
            if (esTienda) {
              productosConAnaliticas = await Promise.all(
                productos.map(async p => ({
                  id: p.id_producto ?? p.id,
                  nombre: p.nombre ?? "Producto",
                  precio: Number(p.precio) || 0,
                  precioUnitario: Number(p.precioUnitario ?? p.precio) || 0,
                  cantidad: Number(p.cantidad) || 1,
                  stock: p.stock,
                  imagen: p.imagen,
                  ventas: await getCantidadVentasProducto(p.id_producto ?? p.id),
                  vistas: await getCantidadVistasProducto(p.id_producto ?? p.id),
                  favoritos: await getCantidadFavoritosProducto(p.id_producto ?? p.id),
                }))
              );
            } else {
              productosConAnaliticas = productos.map(p => ({
                id: p.id_producto ?? p.id,
                nombre: p.nombre ?? "Producto",
                precio: Number(p.precio) || 0,
                precioUnitario: Number(p.precioUnitario ?? p.precio) || 0,
                cantidad: 1,
                stock: p.stock,
                imagen: p.imagen,
              }));
            }

            return {
              id: cat.id_categoria ?? cat.id,
              nombre: cat.nombre ?? "Sin nombre",
              productos: productosConAnaliticas,
            };
          })
        );

        // 🔥 FILTRAR: Solo categorías con mínimo 1 producto
        const categoriasConProductos = normalizadas.filter(cat => cat.productos.length > 0);

        setCategorias(categoriasConProductos);
        if (categoriasConProductos.length > 0) setTabActivo(categoriasConProductos[0].id);

      } catch (error) {
        console.error('Error al cargar el catálogo:', error);
        // Fallback con datos de ejemplo para que la UI sea funcional
        setInfoTienda({ nombre: 'M51 Jeans', slogan: 'Donde la ropa es la felicidad' });
        setCategorias(CATEGORIAS_MOCK);
        setProductosDisponibles(CATEGORIAS_MOCK.flatMap(cat => cat.productos));
        setTabActivo(CATEGORIAS_MOCK[0].id);
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [tiendaSeleccionada, esTienda]);

  // ── Abrir / cerrar tienda según navegación ──
  useEffect(() => {
    if (!tiendaSeleccionada) return;

    abrirTienda(tiendaSeleccionada).catch((err) => {
      console.error("No se pudo marcar la tienda como abierta:", err);
    });

    return () => {
      cerrarTienda(tiendaSeleccionada).catch((err) => {
        console.error("No se pudo marcar la tienda como cerrada:", err);
      });
    };
  }, [tiendaSeleccionada]);

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

  const handleCrear = async (nueva) => {
    const tiendaIdRaw = localStorage.getItem('id_tienda');
    const idTienda = Number(tiendaIdRaw);

    if (!tiendaIdRaw || !Number.isFinite(idTienda)) {
      throw new Error('No se encontró una tienda válida en la sesión.');
    }

    const categoriaCreada = await crearCategoria({
      nombre: nueva.nombre,
      id_tienda: idTienda,
      productos: nueva.productos || [],
    });
    const id = categoriaCreada?.id_categoria;

    if (id === undefined || id === null) {
      throw new Error('La categoría se creó, pero la API no devolvió su identificador.');
    }

    const nuevaCategoria = {
      id,
      nombre: categoriaCreada.nombre ?? nueva.nombre,
      productos: nueva.productos || [],
    };
    setCategorias(prev => {
      const actualizado = [...prev, nuevaCategoria];
      setTabActivo(nuevaCategoria.id);
      return actualizado;
    });
    cerrarPanel();
  };

  const handleGuardar = async (editada) => {
    try {
      await editarCategoria(editada.id, {
        nombre: editada.nombre,
        productos: editada.productos || [],
      });
      setCategorias(prev => prev.map(c => c.id === editada.id ? editada : c));
      cerrarPanel();
    } catch (err) {
      alert('Error al guardar categoría: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleBorrar = async () => {
    try {
      await eliminarCategoria(categoriaEditando.id);
      setCategorias(prev => prev.filter(c => c.id !== categoriaEditando.id));
      cerrarPanel();
    } catch (err) {
      alert('Error al eliminar categoría: ' + (err.message || 'Error desconocido'));
    }
  };

  return (
    <>
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
            {esTienda && (
              <button className="cat-header__btn-editar">
                Editar Tienda <IconoLapiz />
              </button>
            )}
          </div>

          <div className="cat-header__divider" />

          <div className="cat-header__right">
            <h2 className="cat-header__titulo">Catálogo</h2>
            <p className="cat-header__subtitulo">Hechá un vistazo a tus productos</p>
            {esTienda && (
              <button className="cat-header__btn-stats">
                <IconoOjo /> Ver Estadísticas
              </button>
            )}
          </div>
        </div>

        {/* ── Sección productos ── */}
        <div className="cat-productos">
          <h2 className="cat-productos__titulo">Productos:</h2>

          {/* ── Paneles inline ── */}
          {esTienda && vistaPanel === 'crear' && (
            <PanelCrear onCrear={handleCrear} onCancelar={cerrarPanel} productosDisponibles={productosDisponibles} />
          )}

          {esTienda && vistaPanel === 'editar' && categoriaEditando && (
            <PanelEditar
              categoria={categoriaEditando}
              onGuardar={handleGuardar}
              onBorrar={() => setVistaPanel('borrar')}
              onCancelar={cerrarPanel}
              productosDisponibles={productosDisponibles}
            />
          )}

          {esTienda && vistaPanel === 'borrar' && categoriaEditando && (
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
                    tipoSesion={tipoSesion}
                    onEditar={esTienda ? () => abrirEditar(cat) : undefined}
                    onVerProducto={onVerProducto}
                    onComprar={onComprar}
                  />
                ))
              )}

              {/* ── Card crear categoría ── */}
              {esTienda && (
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
              )}
            </>
          )}
        </div>

      </main>
      <Footer />
    </>
  );
}

export default Catalogo;
