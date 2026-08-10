import { useEffect, useMemo, useState } from 'react';
import {
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiEdit3,
  FiEye,
  FiFileText,
  FiMapPin,
  FiMoreVertical,
  FiPackage,
  FiPlus,
  FiPrinter,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTruck,
  FiUserCheck,
  FiUsers,
  FiX,
  FiTrash2,
} from 'react-icons/fi';
import CrearPedido from './CrearPedido';
import { actualizarEstadoPedido, editarPedido, obtenerPedido } from '../../api/pedidos';
import './Pedidos.css';

const API_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ESTADOS_PEDIDO = ['Pendiente', 'Preparando', 'Enviado', 'Entregado'];
const ESTADOS = ['Todos', ...ESTADOS_PEDIDO];
const ORDENES = [
  { value: 'fecha', label: 'Fecha reciente' },
  { value: 'total', label: 'Mayor total' },
  { value: 'estado', label: 'Estado' },
];
const ITEMS_POR_PAGINA = 4;

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [vista, setVista] = useState(() => obtenerVistaInicial());
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [orden, setOrden] = useState('fecha');
  const [pagina, setPagina] = useState(1);
  const [menuAbierto, setMenuAbierto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [mostrarCrearPedido, setMostrarCrearPedido] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [pedidoEnEdicion, setPedidoEnEdicion] = useState(null);
  const [pedidoParaActualizar, setPedidoParaActualizar] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('Pendiente');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState('');

  const pedidosDisponibles = pedidos;
  const actualizarPedidos = () => {
    setRefreshKey((actual) => actual + 1);
  };
  const crearPedidoManual = (nuevoPedido) => {
    setPedidos((actuales) => [nuevoPedido, ...actuales]);
    setMostrarCrearPedido(false);
    setPagina(1);
  };
  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista);
    setPagina(1);
    setMenuAbierto('');
    guardarVista(nuevaVista);
  };
  const abrirCambioEstado = (pedido) => {
    const detalle = normalizarPedido(pedido);
    setPedidoParaActualizar({ id: detalle.id, pedido });
    setNuevoEstado(detalle.estado);
    setErrorEstado('');
    setMenuAbierto('');
  };
  const cerrarCambioEstado = () => {
    if (!guardandoEstado) {
      setPedidoParaActualizar(null);
      setErrorEstado('');
    }
  };
  const guardarCambioEstado = async () => {
    if (!pedidoParaActualizar) return;

    setGuardandoEstado(true);
    setErrorEstado('');

    try {
      await actualizarEstadoPedido(pedidoParaActualizar.id, nuevoEstado);
      setPedidos((actuales) => actuales.map((pedido) => {
        if (String(normalizarPedido(pedido).id) !== String(pedidoParaActualizar.id)) return pedido;

        const actualizado = { ...pedido, estado: nuevoEstado };
        if (Object.hasOwn(pedido, 'entregado')) {
          actualizado.entregado = nuevoEstado === 'Entregado';
        }
        return actualizado;
      }));
      setPedidoParaActualizar(null);
    } catch (err) {
      setErrorEstado(err.message || 'No se pudo actualizar el estado del pedido.');
    } finally {
      setGuardandoEstado(false);
    }
  };

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const filtrados = [...pedidosDisponibles].filter((pedido) => {
      const detalle = normalizarPedido(pedido);
      const coincideEstado = estado === 'Todos' || detalle.estado === estado;
      const campos = [
        detalle.id,
        detalle.comprador,
        detalle.direccion,
        detalle.codigoPostal,
        detalle.localidad,
        detalle.repartidor,
        detalle.tienda,
        resumenProductos(detalle.productos),
      ].join(' ');

      return coincideEstado && (!texto || campos.toLowerCase().includes(texto));
    });

    return filtrados.sort((a, b) => ordenarPedidos(normalizarPedido(a), normalizarPedido(b), orden));
  }, [busqueda, estado, orden, pedidosDisponibles]);

  const totalPaginas = Math.max(1, Math.ceil(pedidosFiltrados.length / ITEMS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const pedidosPaginados = pedidosFiltrados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA,
  );

  const metricas = useMemo(() => {
    const normalizados = pedidosDisponibles.map(normalizarPedido);
    const pendientes = normalizados.filter((pedido) => pedido.estado === 'Pendiente').length;
    const entregados = normalizados.filter((pedido) => pedido.estado === 'Entregado').length;
    const facturado = normalizados.reduce((acc, pedido) => acc + pedido.total, 0);

    return { total: normalizados.length, pendientes, entregados, facturado };
  }, [pedidosDisponibles]);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarPedidos() {
      setLoading(true);
      setError('');

      try {
        const data = await fetchPedidos(vista, controller.signal);
        const lista = extraerListaPedidos(data);
        setPedidos(lista);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'No se pudieron cargar los pedidos.');
          setPedidos([]);
        }
      } finally {
        setLoading(false);
      }
    }

    cargarPedidos();

    return () => controller.abort();
  }, [vista, refreshKey]);

  return (
    <section className={`pedidos-page ${vista === 'usuario' ? 'buyer-view' : 'seller-view'}`}>
      <div className="pedidos-shell">
        <header className="pedidos-header">
          <div className="pedidos-heading">
            <span className="pedidos-kicker">{vista === 'usuario' ? 'Panel del comprador' : 'Panel del vendedor'}</span>
            <h1>{vista === 'usuario' ? 'Mis compras' : 'Pedidos y envios'}</h1>
            <p>
              {vista === 'usuario'
                ? 'Seguimiento de compras, tiendas, pagos y entregas en una vista compacta.'
                : 'Operacion diaria, entregas, pagos y responsables en una vista compacta.'}
            </p>
          </div>

          <div className="pedidos-header-actions">
            <button type="button" className="pedidos-secondary" onClick={actualizarPedidos}>
              <FiRefreshCw aria-hidden="true" />
              Actualizar
            </button>
            {vista === 'tienda' && (
              <>
                <button type="button" className="pedidos-secondary">
                  <FiPrinter aria-hidden="true" />
                  Imprimir
                </button>
                <button
                  type="button"
                  className="pedidos-create"
                  onClick={() => setMostrarCrearPedido((actual) => !actual)}
                >
                  <FiPlus aria-hidden="true" />
                  Crear pedido
                </button>
              </>
            )}
          </div>
        </header>

        {vista === 'tienda' && mostrarCrearPedido && (
          <CrearPedido onCrear={crearPedidoManual} onCancelar={() => setMostrarCrearPedido(false)} />
        )}

        <div className="pedidos-perspective-panel">
          <div className="pedidos-perspective-copy">
            <span>Punto de vista</span>
            <strong>{vista === 'usuario' ? 'Comprador' : 'Vendedor'}</strong>
          </div>
          <div className="pedidos-view-switch" aria-label="Elegir punto de vista">
            <button
              type="button"
              className={vista === 'usuario' ? 'active' : ''}
              onClick={() => cambiarVista('usuario')}
            >
              <FiShoppingBag aria-hidden="true" />
              Comprador
            </button>
            <button
              type="button"
              className={vista === 'tienda' ? 'active' : ''}
              onClick={() => cambiarVista('tienda')}
            >
              <FiTruck aria-hidden="true" />
              Vendedor
            </button>
          </div>
        </div>

        <div className="pedidos-summary" aria-label="Resumen de pedidos">
          <KpiCard label={vista === 'usuario' ? 'Compras realizadas' : 'Pedidos activos'} value={metricas.total} tone="neutral" />
          <KpiCard label="Pendientes" value={metricas.pendientes} tone="warning" />
          <KpiCard label="Entregados" value={metricas.entregados} tone="info" />
          <KpiCard label={vista === 'usuario' ? 'Total comprado' : 'Facturado'} value={formatearPrecio(metricas.facturado)} tone="success" />
        </div>

        <div className="pedidos-control-panel">
          <label className="pedidos-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value);
                setPagina(1);
              }}
              placeholder={vista === 'usuario' ? 'Buscar direccion, tienda, producto o CP' : 'Buscar direccion, cliente, repartidor o CP'}
            />
          </label>

          <div className="pedidos-status-filter" aria-label="Filtrar por estado">
            {ESTADOS.map((option) => (
              <button
                type="button"
                key={option}
                className={estado === option ? 'active' : ''}
                onClick={() => {
                  setEstado(option);
                  setPagina(1);
                }}
              >
                {option}
              </button>
            ))}
          </div>

          <label className="pedidos-sort">
            <span>Ordenar</span>
            <select value={orden} onChange={(event) => setOrden(event.target.value)}>
              {ORDENES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FiChevronDown aria-hidden="true" />
          </label>
        </div>

        {loading && <p className="pedidos-message">Cargando pedidos...</p>}

        {error && <p className="pedidos-message error">{error}</p>}

        {!loading && !error && pedidosFiltrados.length === 0 && (
          <p className="pedidos-message">No hay pedidos que coincidan con la busqueda.</p>
        )}

        <div className="pedidos-list">
          {pedidosPaginados.map((pedido) => {
            const detalle = normalizarPedido(pedido);
            const menuId = `menu-${detalle.id}`;
            const tituloPedido = vista === 'usuario' ? detalle.tienda : detalle.direccion;

            return (
              <article className="pedido-card" key={detalle.id}>
                <div className="pedido-card-main">
                  <div className="pedido-topline">
                    <span className="pedido-id">{detalle.id}</span>
                    <span className={`pedido-priority ${priorityClass(detalle.prioridad)}`}>
                      {detalle.prioridad}
                    </span>
                    <time dateTime={detalle.fecha}>{formatearFecha(detalle.fecha)}</time>
                  </div>

                  <div className="pedido-title-block">
                    <h2>{tituloPedido}</h2>
                    <span className={`pedido-status ${estadoClass(detalle.estado)}`}>
                      {estadoLabel(detalle.estado)}
                    </span>
                  </div>

                  <p className="pedido-products">{resumenProductos(detalle.detalles || detalle.productos)}</p>

                  <div className="pedido-people">
                    <PersonPill
                      icon={vista === 'usuario' ? <FiPackage aria-hidden="true" /> : <FiUsers aria-hidden="true" />}
                      label={vista === 'usuario' ? `Pedido ${detalle.id}` : detalle.comprador}
                    />
                    <PersonPill icon={<FiTruck aria-hidden="true" />} label={detalle.repartidor} muted={detalle.repartidor === 'Sin asignar'} />
                  </div>

                  <ProgressBar estado={detalle.estado} />
                </div>

                <div className="pedido-meta">
                  <MetaItem
                    icon={<FiMapPin aria-hidden="true" />}
                    label={vista === 'usuario' ? 'Destino' : 'Zona'}
                    value={vista === 'usuario' ? detalle.direccion : `${detalle.localidad} · ${detalle.codigoPostal}`}
                  />
                  <MetaItem icon={<FiClock aria-hidden="true" />} label={vista === 'usuario' ? 'Llega' : 'Entrega estimada'} value={detalle.eta} />
                  <MetaItem icon={<FiCreditCard aria-hidden="true" />} label="Pago" value={detalle.pago} accent={detalle.pago === 'Pagado'} />
                </div>

                <div className="pedido-total-panel">
                  <span>Total</span>
                  <strong>{formatearPrecio(detalle.total)}</strong>
                  <button 
                    type="button" 
                    className="pedido-view"
                    onClick={() => setPedidoSeleccionado(detalle)}
                  >
                    <FiEye aria-hidden="true" />
                    {vista === 'usuario' ? 'Ver compra' : 'Ver detalle'}
                  </button>
                </div>

                <div className="pedido-menu-wrap">
                  <button
                    type="button"
                    className="pedido-menu-trigger"
                    aria-label="Acciones del pedido"
                    aria-expanded={menuAbierto === menuId}
                    onClick={() => setMenuAbierto((actual) => (actual === menuId ? '' : menuId))}
                  >
                    <FiMoreVertical aria-hidden="true" />
                  </button>

                  {menuAbierto === menuId && (
                    <div className="pedido-menu">
                      {vista === 'tienda' && (
                        <>
                          <button 
                            type="button"
                            onClick={() => {
                              setPedidoEnEdicion(pedido);
                              setMenuAbierto('');
                            }}
                          >
                            <FiEdit3 aria-hidden="true" />
                            Editar pedido
                          </button>
                          <button type="button">
                            <FiUserCheck aria-hidden="true" />
                            Asignar repartidor
                          </button>
                        </>
                      )}
                      {vista === 'tienda' ? (
                        <button type="button" onClick={() => abrirCambioEstado(pedido)}>
                          <FiCheckCircle aria-hidden="true" />
                          Cambiar estado
                        </button>
                      ) : (
                        <button type="button">
                          <FiCheckCircle aria-hidden="true" />
                          Consultar estado
                        </button>
                      )}
                      <button type="button">
                        <FiFileText aria-hidden="true" />
                        {vista === 'usuario' ? 'Ver comprobante' : 'Imprimir etiqueta'}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {pedidosFiltrados.length > 0 && (
          <nav className="pedidos-pagination" aria-label="Paginacion">
            <button
              type="button"
              aria-label="Pagina anterior"
              disabled={paginaActual === 1}
              onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
            >
              <FiChevronLeft aria-hidden="true" />
            </button>

            {Array.from({ length: totalPaginas }, (_, index) => index + 1).map((numero) => (
              <button
                type="button"
                key={numero}
                className={paginaActual === numero ? 'active' : ''}
                onClick={() => setPagina(numero)}
              >
                {numero}
              </button>
            ))}

            <button
              type="button"
              aria-label="Pagina siguiente"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))}
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          </nav>
        )}

        {pedidoSeleccionado && !pedidoEnEdicion && (
          <DetallesPedidoModal 
            pedido={pedidoSeleccionado} 
            vista={vista}
            onClose={() => setPedidoSeleccionado(null)}
            onEdit={() => setPedidoEnEdicion(pedidoSeleccionado)}
          />
        )}

        {pedidoEnEdicion && (
          <EditarPedidoModal 
            pedido={pedidoEnEdicion} 
            vista={vista}
            onClose={() => setPedidoEnEdicion(null)}
            onGuardar={(pedidoActualizado) => {
              const idPedido = normalizarPedido(pedidoActualizado).id;
              const idPedidoNumerico = Number(idPedido);
              const idPedidoFinal = Number.isNaN(idPedidoNumerico) ? idPedido : idPedidoNumerico;

              setPedidos((actuales) => {
                const existe = actuales.some((pedidoActual) => String(normalizarPedido(pedidoActual).id) === String(idPedidoFinal));

                if (existe) {
                  return actuales.map((pedidoActual) => {
                    const detalle = normalizarPedido(pedidoActual);
                    if (String(detalle.id) !== String(idPedidoFinal)) return pedidoActual;

                    return {
                      ...pedidoActual,
                      ...pedidoActualizado,
                      id: idPedidoFinal,
                      id_pedido: idPedidoFinal,
                    };
                  });
                }

                return [{
                  ...pedidoActualizado,
                  id: idPedidoFinal,
                  id_pedido: idPedidoFinal,
                }, ...actuales];
              });

              setPedidoEnEdicion(null);
              setPedidoSeleccionado(null);
            }}
          />
        )}

        {pedidoParaActualizar && (
          <div className="pedido-modal-backdrop" role="presentation" onMouseDown={cerrarCambioEstado}>
            <section
              className="pedido-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cambiarEstadoTitulo"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div>
                <span className="pedido-modal-kicker">Administrar pedido</span>
                <h2 id="cambiarEstadoTitulo">Cambiar estado</h2>
                <p>Pedido #{pedidoParaActualizar.id}</p>
              </div>

              <label className="pedido-modal-field" htmlFor="nuevoEstadoPedido">
                <span>Nuevo estado</span>
                <select
                  id="nuevoEstadoPedido"
                  value={nuevoEstado}
                  disabled={guardandoEstado}
                  onChange={(event) => setNuevoEstado(event.target.value)}
                >
                  {ESTADOS_PEDIDO.map((opcion) => (
                    <option key={opcion} value={opcion}>{opcion}</option>
                  ))}
                </select>
              </label>

              {errorEstado && <p className="pedido-modal-error">{errorEstado}</p>}

              <div className="pedido-modal-actions">
                <button type="button" className="pedido-modal-cancel" onClick={cerrarCambioEstado} disabled={guardandoEstado}>
                  Cancelar
                </button>
                <button type="button" className="pedido-modal-save" onClick={guardarCambioEstado} disabled={guardandoEstado}>
                  {guardandoEstado ? 'Guardando...' : 'Guardar estado'}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}

function KpiCard({ label, value, tone }) {
  return (
    <div className={`kpi-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DetallesPedidoModal({ pedido, vista, onClose, onEdit }) {
  return (
    <>
      <div className="detalles-modal-overlay" onClick={onClose} />
      <div className="detalles-modal">
        <div className="detalles-modal-header">
          <h2>Detalles del pedido {pedido.id}</h2>
          <button 
            type="button" 
            className="detalles-modal-close"
            onClick={onClose}
            aria-label="Cerrar detalles"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <div className="detalles-modal-content">
          {/* Información general */}
          <section className="detalles-section">
            <h3>Información general</h3>
            <div className="detalles-grid">
              <div className="detalles-item">
                <span className="detalles-label">Número de pedido</span>
                <strong>{pedido.id}</strong>
              </div>
              <div className="detalles-item">
                <span className="detalles-label">Fecha</span>
                <strong>{formatearFecha(pedido.fecha)}</strong>
              </div>
              <div className="detalles-item">
                <span className="detalles-label">Estado</span>
                <strong className={`estado-badge ${estadoClass(pedido.estado)}`}>
                  {estadoLabel(pedido.estado)}
                </strong>
              </div>
              <div className="detalles-item">
                <span className="detalles-label">Prioridad</span>
                <strong>{pedido.prioridad}</strong>
              </div>
            </div>
          </section>

          {/* Información del comprador/vendedor */}
          <section className="detalles-section">
            <h3>{vista === 'usuario' ? 'Tu tienda' : 'Información del comprador'}</h3>
            <div className="detalles-grid">
              <div className="detalles-item">
                <span className="detalles-label">
                  {vista === 'usuario' ? 'Tienda' : 'Nombre del comprador'}
                </span>
                <strong>{vista === 'usuario' ? pedido.tienda : pedido.comprador}</strong>
              </div>
              {vista === 'tienda' && (
                <div className="detalles-item">
                  <span className="detalles-label">Repartidor</span>
                  <strong>{pedido.repartidor}</strong>
                </div>
              )}
            </div>
          </section>

          {/* Información de entrega */}
          <section className="detalles-section">
            <h3>Información de entrega</h3>
            <div className="detalles-grid">
              <div className="detalles-item full-width">
                <span className="detalles-label">Dirección</span>
                <strong>{pedido.direccion}</strong>
              </div>
              <div className="detalles-item">
                <span className="detalles-label">Localidad</span>
                <strong>{pedido.localidad}</strong>
              </div>
              <div className="detalles-item">
                <span className="detalles-label">Código postal</span>
                <strong>{pedido.codigoPostal}</strong>
              </div>
              <div className="detalles-item">
                <span className="detalles-label">Entrega estimada</span>
                <strong>{pedido.eta}</strong>
              </div>
            </div>
          </section>

          {/* Productos */}
          <section className="detalles-section">
            <h3>Productos ({(pedido.detalles || []).length})</h3>
            <div className="detalles-productos">
              {pedido.detalles && Array.isArray(pedido.detalles) && pedido.detalles.length > 0 ? (
                <table className="detalles-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.detalles.map((detalle, index) => {
                      const nombre = detalle.nombre || detalle.producto?.nombre || 'Producto sin nombre';
                      const cantidad = Number(detalle.cantidad) || 1;
                      const precioUnitario = Number(detalle.precio_unitario || 0);
                      const precioTotal = Number(detalle.precio_total || 0);
                      return (
                        <tr key={index}>
                          <td>{nombre}</td>
                          <td className="detalles-cantidad">{cantidad}</td>
                          <td>${precioUnitario.toFixed(2)}</td>
                          <td className="detalles-subtotal">${precioTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="detalles-vacio">No hay productos en este pedido</p>
              )}
            </div>
          </section>

          {/* Información de pago */}
          <section className="detalles-section">
            <h3>Información de pago</h3>
            <div className="detalles-grid">
              <div className="detalles-item">
                <span className="detalles-label">Método de pago</span>
                <strong>{pedido.pago}</strong>
              </div>
              <div className="detalles-item">
                <span className="detalles-label">Total</span>
                <strong className="detalles-total">${Number(pedido.total || 0).toFixed(2)}</strong>
              </div>
            </div>
          </section>
        </div>

        <div className="detalles-modal-footer">
          <button 
            type="button" 
            className="detalles-modal-editar"
            onClick={onEdit}
          >
            <FiEdit3 aria-hidden="true" />
            Editar pedido
          </button>
          <button 
            type="button" 
            className="detalles-modal-cerrar"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}

function EditarPedidoModal({ pedido, vista, onClose, onGuardar }) {
  const detalleOriginal = normalizarPedido(pedido);
  const puedeEditar = detalleOriginal.estado !== 'Entregado';

  const [productos, setProductos] = useState(
    (detalleOriginal.detalles || detalleOriginal.productos || []).map((p, index) => ({
      ...p,
      _tmpId: p.id || p.producto?.id || p.id_detallepedido || index,
    }))
  );

  const [formData, setFormData] = useState({
    estado: detalleOriginal.estado || 'Pendiente',
    prioridad: detalleOriginal.prioridad || 'Sin prioridad',
    repartidor: detalleOriginal.repartidor || 'Sin asignar',
    direccion: detalleOriginal.direccion || '',
    localidad: detalleOriginal.localidad || '',
    codigoPostal: detalleOriginal.codigoPostal || '',
    eta: detalleOriginal.eta || '',
    pago: detalleOriginal.pago || 'Sin informar',
  });

  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    if (mensajeError) {
      setMensajeError('');
    }
  };

  const actualizarProducto = (tmpId, campo, valor) => {
    setProductos((prev) =>
      prev.map((p) =>
        p._tmpId === tmpId ? { ...p, [campo]: valor } : p
      )
    );
    if (mensajeError) {
      setMensajeError('');
    }
  };

  const incrementarCantidad = (tmpId) => {
    setProductos((prev) =>
      prev.map((p) =>
        p._tmpId === tmpId
          ? { ...p, cantidad: (p.cantidad || 1) + 1 }
          : p
      )
    );
  };

  const decrementarCantidad = (tmpId) => {
    setProductos((prev) =>
      prev.map((p) =>
        p._tmpId === tmpId && (p.cantidad || 1) > 1
          ? { ...p, cantidad: (p.cantidad || 1) - 1 }
          : p
      )
    );
  };

  const eliminarProducto = (tmpId) => {
    setProductos((prev) => prev.filter((p) => p._tmpId !== tmpId));
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.direccion.trim()) {
      nuevosErrores.direccion = 'La dirección es requerida';
    }
    if (!formData.localidad.trim()) {
      nuevosErrores.localidad = 'La localidad es requerida';
    }
    if (!formData.codigoPostal.trim()) {
      nuevosErrores.codigoPostal = 'El código postal es requerido';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    setGuardando(true);
    setMensajeError('');

    try {
      // Preparar los datos sin el campo _tmpId para la API
      const productosParaEnviar = productos.map((p) => {
        const producto = { ...p };
        delete producto._tmpId;
        return producto;
      });

      const datosActualizados = {
        ...formData,
        productos: productosParaEnviar,
      };

      await editarPedido(detalleOriginal.id, datosActualizados);

      const pedidoResponse = await obtenerPedido(detalleOriginal.id);
      const pedidoActualizado = {
        ...pedidoResponse,
        detalles: pedidoResponse.detalles || pedidoResponse.productos,
        productos: pedidoResponse.detalles || pedidoResponse.productos || productosParaEnviar,
        total: pedidoResponse.total ?? calcularTotal(),
      };

      onGuardar(pedidoActualizado);
    } catch (err) {
      setMensajeError(
        err.message || 'No se pudo guardar los cambios del pedido.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const calcularTotal = () => {
    return productos.reduce((sum, p) => {
      const precioTotal = Number(p.precio_total || p.precio_unitario || p.precio || 0);
      const cantidad = Number(p.cantidad) || 1;
      return sum + precioTotal;
    }, 0);
  };

  if (!puedeEditar) {
    return (
      <>
        <div className="editar-modal-overlay" onClick={onClose} />
        <div className="editar-modal">
          <div className="editar-modal-header">
            <h2>No se puede editar este pedido</h2>
            <button
              type="button"
              className="editar-modal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <FiX aria-hidden="true" />
            </button>
          </div>
          <div className="editar-modal-content">
            <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              Los pedidos con estado "Entregado" no pueden ser editados.
            </p>
          </div>
          <div className="editar-modal-footer">
            <button
              type="button"
              className="editar-modal-cancelar"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="editar-modal-overlay" onClick={onClose} />
      <div className="editar-modal editar-modal-grande">
        <div className="editar-modal-header">
          <h2>Editar pedido {detalleOriginal.id}</h2>
          <button
            type="button"
            className="editar-modal-close"
            onClick={onClose}
            aria-label="Cerrar edición"
            disabled={guardando}
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <div className="editar-modal-content">
          {mensajeError && (
            <div className="editar-modal-error-banner">
              <strong>Error:</strong> {mensajeError}
            </div>
          )}

          {/* Información de entrega */}
          <section className="editar-section">
            <h3>Información de entrega</h3>
            <div className="editar-grid">
              <div className="editar-campo full-width">
                <label htmlFor="direccion">Dirección</label>
                <input
                  id="direccion"
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Calle y número"
                  disabled={guardando}
                />
                {errores.direccion && (
                  <span className="error-message">{errores.direccion}</span>
                )}
              </div>

              <div className="editar-campo">
                <label htmlFor="localidad">Localidad</label>
                <input
                  id="localidad"
                  type="text"
                  name="localidad"
                  value={formData.localidad}
                  onChange={handleChange}
                  placeholder="Localidad"
                  disabled={guardando}
                />
                {errores.localidad && (
                  <span className="error-message">{errores.localidad}</span>
                )}
              </div>

              <div className="editar-campo">
                <label htmlFor="codigoPostal">Código postal</label>
                <input
                  id="codigoPostal"
                  type="text"
                  name="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={handleChange}
                  placeholder="CP"
                  disabled={guardando}
                />
                {errores.codigoPostal && (
                  <span className="error-message">{errores.codigoPostal}</span>
                )}
              </div>

              <div className="editar-campo">
                <label htmlFor="eta">Entrega estimada</label>
                <input
                  id="eta"
                  type="text"
                  name="eta"
                  value={formData.eta}
                  onChange={handleChange}
                  placeholder="Ej: 2-3 días"
                  disabled={guardando}
                />
              </div>
            </div>
          </section>

          {/* Método de pago */}
          <section className="editar-section">
            <h3>Método de pago</h3>
            <div className="editar-grid">
              <div className="editar-campo">
                <label htmlFor="pago">Forma de pago</label>
                <select
                  id="pago"
                  name="pago"
                  value={formData.pago}
                  onChange={handleChange}
                  disabled={guardando}
                >
                  <option value="Sin informar">Sin informar</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente de pago">Pendiente de pago</option>
                </select>
              </div>
            </div>
          </section>

          {/* Productos */}
          <section className="editar-section">
            <h3>Productos ({productos.length})</h3>
            <div className="editar-productos-lista">
              {productos && Array.isArray(productos) && productos.length > 0 ? (
                <table className="editar-tabla-productos">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio Unitario</th>
                      <th>Cantidad</th>
                      <th>Subtotal</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((producto) => {
                      const nombre = producto.nombre || producto.producto?.nombre || 'Producto sin nombre';
                      const cantidad = Number(producto.cantidad) || 1;
                      const precioUnitario = Number(producto.precio_unitario || producto.precio || 0);
                      const precioTotal = Number(producto.precio_total || 0) || (precioUnitario * cantidad);

                      return (
                        <tr key={producto._tmpId}>
                          <td>{nombre}</td>
                          <td className="editar-precio">
                            ${precioUnitario.toFixed(2)}
                          </td>
                          <td className="editar-cantidad">
                            <div className="cantidad-controls">
                              <button
                                type="button"
                                className="cantidad-btn"
                                onClick={() =>
                                  decrementarCantidad(producto._tmpId)
                                }
                                disabled={guardando || cantidad <= 1}
                                title="Decrementar cantidad"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={cantidad}
                                onChange={(e) => {
                                  const newCant = Math.max(
                                    1,
                                    parseInt(e.target.value, 10) || 1
                                  );
                                  actualizarProducto(
                                    producto._tmpId,
                                    'cantidad',
                                    newCant
                                  );
                                }}
                                disabled={guardando}
                                className="cantidad-input"
                              />
                              <button
                                type="button"
                                className="cantidad-btn"
                                onClick={() =>
                                  incrementarCantidad(producto._tmpId)
                                }
                                disabled={guardando}
                                title="Incrementar cantidad"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="editar-subtotal">
                            ${precioTotal.toFixed(2)}
                          </td>
                          <td className="editar-acciones">
                            <button
                              type="button"
                              className="editar-eliminar"
                              onClick={() =>
                                eliminarProducto(producto._tmpId)
                              }
                              disabled={guardando}
                              title="Eliminar producto"
                              aria-label="Eliminar producto"
                            >
                              <FiTrash2 aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="editar-vacio">
                  No hay productos en este pedido
                </p>
              )}
            </div>
            <div className="editar-productos-total">
              <span>Total del pedido:</span>
              <strong>${calcularTotal().toFixed(2)}</strong>
            </div>
          </section>

          {/* Estado y Prioridad */}
          <section className="editar-section">
            <h3>Estado y prioridad</h3>
            <div className="editar-grid">
              <div className="editar-campo">
                <label htmlFor="estado">Estado</label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  disabled={guardando}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Preparando">Preparando</option>
                  <option value="Enviado">Enviado</option>
                  <option value="Entregado">Entregado</option>
                </select>
              </div>

              <div className="editar-campo">
                <label htmlFor="prioridad">Prioridad</label>
                <select
                  id="prioridad"
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                  disabled={guardando}
                >
                  <option value="Sin prioridad">Sin prioridad</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>

              {vista === 'tienda' && (
                <div className="editar-campo">
                  <label htmlFor="repartidor">Repartidor</label>
                  <input
                    id="repartidor"
                    type="text"
                    name="repartidor"
                    value={formData.repartidor}
                    onChange={handleChange}
                    placeholder="Nombre del repartidor"
                    disabled={guardando}
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="editar-modal-footer">
          <button
            type="button"
            className="editar-modal-cancelar"
            onClick={onClose}
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="editar-modal-guardar"
            onClick={handleGuardar}
            disabled={guardando}
          >
            {guardando ? (
              <>
                <FiRefreshCw aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }} />
                Guardando...
              </>
            ) : (
              <>
                <FiCheckCircle aria-hidden="true" />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function PersonPill({ icon, label, muted = false }) {
  return (
    <span className={muted ? 'muted' : ''}>
      <span className="person-avatar">{iniciales(label)}</span>
      {icon}
      {label}
    </span>
  );
}

function MetaItem({ icon, label, value, accent = false }) {
  return (
    <div className={accent ? 'accent' : ''}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProgressBar({ estado }) {
  const steps = ['Pendiente', 'Entregado'];
  const activeIndex = Math.max(0, steps.indexOf(estado));

  return (
    <div className="pedido-progress" aria-label={`Progreso ${estadoLabel(estado)}`}>
      {steps.map((step, index) => (
        <span
          key={step}
          className={index <= activeIndex ? 'active' : ''}
          title={estadoLabel(step)}
        />
      ))}
    </div>
  );
}

async function fetchPedidos(vista, signal) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;

  if (vista === 'usuario') {
    return fetchPedidosUsuario(headers, signal);
  }

  return fetchPedidosTienda(headers, signal);
}

async function fetchPedidosTienda(headers, signal) {
  const tiendaId = obtenerTiendaId();
  const candidates = ['/pedidos/tienda', '/pedidos/store'];

  if (tiendaId) {
    candidates.push(
      `/pedidos/tienda/${tiendaId}`,
      `/pedidos/get/tienda/${tiendaId}`,
      `/pedidos/getByTienda/${tiendaId}`,
      `/pedidos/store/${tiendaId}`,
      `/tiendas/${tiendaId}/pedidos`,
    );
  }

  for (const path of candidates) {
    try {
      return await requestPedidos(path, headers, signal);
    } catch (err) {
      if (signal.aborted || ![400, 401, 403, 404, 405].includes(err.status)) {
        throw err;
      }
    }
  }

  const data = await requestPedidos('/pedidos/getAll', headers, signal);
  const lista = extraerListaPedidos(data);

  return tiendaId ? lista.filter((pedido) => pedidoPerteneceATienda(pedido, tiendaId)) : lista;
}

async function fetchPedidosUsuario(headers, signal) {
  const usuarioId = obtenerUsuarioId();
  const candidates = [
    '/pedidos/mis-pedidos',
    '/pedidos/mios',
    '/pedidos/usuario',
    '/pedidos/user',
  ];

  if (usuarioId) {
    candidates.push(
      `/pedidos/usuario/${usuarioId}`,
      `/pedidos/get/usuario/${usuarioId}`,
      `/pedidos/getByUsuario/${usuarioId}`,
      `/pedidos/user/${usuarioId}`,
      `/usuarios/${usuarioId}/pedidos`,
    );
  }

  let lastError;

  for (const path of candidates) {
    try {
      return await requestPedidos(path, headers, signal);
    } catch (err) {
      lastError = err;
      if (signal.aborted || ![400, 401, 403, 404, 405].includes(err.status)) {
        throw err;
      }
    }
  }

  const data = await requestPedidos('/pedidos/getAll', headers, signal);
  const lista = extraerListaPedidos(data);

  if (!usuarioId) {
    throw lastError || new Error('Inicia sesion para ver tus pedidos.');
  }

  return lista.filter((pedido) => pedidoPerteneceAUsuario(pedido, usuarioId));
}

async function requestPedidos(path, headers, signal) {
  const response = await fetch(`${API_URL}${path}`, { headers, signal });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || payload.error || `Error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

function obtenerUsuarioId() {
  const fuente = obtenerSesionActual();

  return (
    fuente.id ||
    fuente._id ||
    fuente.id_usuario ||
    fuente.idUsuario ||
    fuente.usuarioId ||
    fuente.userId ||
    fuente.sub ||
    ''
  );
}

function obtenerTiendaId() {
  const fuente = obtenerSesionActual();

  return (
    fuente.id_tienda ||
    fuente.idTienda ||
    fuente.tiendaId ||
    fuente.storeId ||
    fuente.tienda?.id ||
    fuente.tienda?._id ||
    fuente.store?.id ||
    localStorage.getItem('id_tienda') ||
    ''
  );
}

function obtenerVistaDesdeSesion() {
  return obtenerTipoSesion() === 'vendedor' ? 'tienda' : 'usuario';
}

function obtenerVistaInicial() {
  const guardada = localStorage.getItem('pedidos_vista');
  if (guardada === 'usuario' || guardada === 'tienda') return guardada;
  return obtenerVistaDesdeSesion();
}

function guardarVista(vista) {
  localStorage.setItem('pedidos_vista', vista);
}

function obtenerTipoSesion() {
  const fuente = obtenerSesionActual();
  const valores = [
    fuente.rol,
    fuente.role,
    fuente.tipo,
    fuente.tipoUsuario,
    fuente.tipo_usuario,
    fuente.perfil,
    fuente.cuenta,
    fuente.accountType,
  ]
    .filter(Boolean)
    .map((valor) => String(valor).toLowerCase());

  if (
    fuente.esVendedor ||
    fuente.isSeller ||
    fuente.vendedor ||
    fuente.tienda ||
    obtenerTiendaIdDesdeFuente(fuente) ||
    valores.some((valor) => ['vendedor', 'seller', 'tienda', 'store', 'comercio', 'admin_tienda'].includes(valor))
  ) {
    return 'vendedor';
  }

  if (
    fuente.esComprador ||
    fuente.isBuyer ||
    valores.some((valor) => ['comprador', 'buyer', 'cliente', 'customer', 'usuario', 'user'].includes(valor))
  ) {
    return 'comprador';
  }

  return 'desconocido';
}

function obtenerSesionActual() {
  return leerJsonLocalStorage('user') || leerJsonLocalStorage('usuario') || decodificarJwt(localStorage.getItem('token')) || {};
}

function obtenerTiendaIdDesdeFuente(fuente) {
  return fuente.id_tienda || fuente.idTienda || fuente.tiendaId || fuente.storeId || fuente.tienda?.id || fuente.tienda?._id || fuente.store?.id || '';
}

function leerJsonLocalStorage(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function decodificarJwt(token) {
  if (!token || !token.includes('.')) return null;

  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function pedidoPerteneceAUsuario(pedido, usuarioId) {
  const id = String(usuarioId);
  const comprador = pedido.cliente || pedido.comprador || pedido.usuario || {};
  const candidatos = [
    pedido.id_usuario,
    pedido.usuarioId,
    pedido.userId,
    pedido.clienteId,
    pedido.id_cliente,
    comprador.id,
    comprador._id,
    comprador.id_usuario,
    comprador.usuarioId,
  ];

  return candidatos.some((value) => value != null && String(value) === id);
}

function pedidoPerteneceATienda(pedido, tiendaId) {
  const id = String(tiendaId);
  const tienda = pedido.tienda || pedido.vendedor || pedido.store || {};
  const candidatos = [
    pedido.id_tienda,
    pedido.tiendaId,
    pedido.storeId,
    pedido.vendedorId,
    pedido.id_vendedor,
    tienda.id,
    tienda._id,
    tienda.id_tienda,
    tienda.tiendaId,
  ];

  return candidatos.some((value) => value != null && String(value) === id);
}

function extraerListaPedidos(data) {
  let lista = [];
  
  if (data?.success === true && Array.isArray(data.data)) lista = data.data;
  else if (Array.isArray(data)) lista = data;
  else if (Array.isArray(data?.pedidos)) lista = data.pedidos;
  else if (Array.isArray(data?.envios)) lista = data.envios;
  else if (Array.isArray(data?.orders)) lista = data.orders;
  else if (Array.isArray(data?.data)) lista = data.data;
  else if (Array.isArray(data?.results)) lista = data.results;
  else return [];

  // Eliminar duplicados basándose en el ID del pedido
  const idsVistos = new Set();
  const listaSinDuplicados = [];

  for (const pedido of lista) {
    const id = pedido.id_pedido || pedido.idPedido || pedido.id || pedido._id;
    
    // Si el ID no existe o ya lo vimos, saltar
    if (!id || idsVistos.has(id)) continue;
    
    idsVistos.add(id);
    listaSinDuplicados.push(pedido);
  }

  return listaSinDuplicados;
}

function normalizarPedido(pedido) {
  const detallesBase = pedido.detalles || pedido.productos || pedido.items || pedido.detalle || [];
  const detalles = Array.isArray(detallesBase) ? detallesBase : [];
  const comprador = pedido.cliente || pedido.comprador || pedido.usuario || {};
  const repartidor = pedido.repartidor || pedido.delivery || pedido.cadete || {};
  const tienda = pedido.tienda || pedido.vendedor || pedido.store || {};
  const direccion = pedido.direccion || pedido.direccionEnvio || pedido.shippingAddress || comprador.direccion || {};

  // Buscar ID - el campo principal en backend es id_pedido (número)
  const idRaw = 
    pedido.id_pedido ||
    pedido.idPedido ||
    pedido.id ||
    pedido._id ||
    pedido.pedidoId ||
    pedido.num_pedido ||
    pedido.numero ||
    pedido.numero_pedido ||
    pedido.order_id ||
    pedido.orderId;

  // Asegurar que el ID es un número válido
  const id = idRaw ? String(idRaw).trim() : null;

  return {
    id: id || 'Sin ID',
    direccion: normalizarDireccion(direccion),
    comprador: comprador.nombre || comprador.name || pedido.clienteNombre || pedido.compradorNombre || 'Sin datos',
    tienda: tienda.nombre || tienda.name || pedido.tiendaNombre || pedido.nombreTienda || pedido.vendedor?.nombre || 'Tienda sin datos',
    repartidor: repartidor.nombre || repartidor.name || pedido.repartidorNombre || pedido.vendedor?.nombre || 'Sin asignar',
    codigoPostal: pedido.codigoPostal || pedido.cp || direccion.codigoPostal || direccion.cp || comprador.codigoPostal || 'Sin CP',
    localidad: pedido.localidad || pedido.ciudad || direccion.localidad || direccion.ciudad || comprador.localidad || 'Sin localidad',
    estado: normalizarEstado(pedido),
    total: normalizarPrecio(pedido.precio_total ?? pedido.total ?? pedido.totalPedido ?? pedido.montoTotal ?? pedido.amount ?? 0),
    productos: detalles,
    detalles,
    fecha: pedido.fecha || pedido.createdAt || '',
    prioridad: pedido.prioridad || pedido.priority || 'Sin prioridad',
    pago: pedido.metodo_pago || pedido.pago || pedido.estadoPago || pedido.paymentStatus || 'Sin informar',
    eta: pedido.eta || pedido.entregaEstimada || pedido.estimatedDelivery || 'Sin informar',
  };
}

function normalizarEstado(pedido) {
  if (typeof pedido.entregado === 'boolean') {
    return pedido.entregado ? 'Entregado' : 'Pendiente';
  }

  if (pedido.entregado === 1 || pedido.entregado === '1' || pedido.entregado === 'true') {
    return 'Entregado';
  }

  if (pedido.entregado === 0 || pedido.entregado === '0' || pedido.entregado === 'false') {
    return 'Pendiente';
  }

  return pedido.estado || 'Pendiente';
}

function normalizarPrecio(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') return Number(valor.replace(',', '.')) || 0;
  if (typeof valor === 'object' && valor !== null) {
    const candidate =
      valor.precio_unitario ??
      valor.precio ??
      valor.precioUnitario ??
      valor.precio_total ??
      valor.precioTotal ??
      valor.subtotal ??
      valor.valor ??
      valor.amount ??
      valor.producto?.precio_unitario ??
      valor.producto?.precio ??
      valor.producto?.precioUnitario ??
      valor.producto?.precio_total ??
      valor.producto?.precioTotal ??
      valor.item?.precio_unitario ??
      valor.item?.precio ??
      valor.item?.precioUnitario ??
      valor.item?.precio_total ??
      valor.item?.precioTotal ??
      valor.producto?.valor ??
      valor.producto?.amount ??
      valor.item?.valor ??
      valor.item?.amount ??
      0;

    return normalizarPrecio(candidate);
  }
  return 0;
}

function normalizarDireccion(direccion) {
  if (!direccion) return 'Direccion sin cargar';
  if (typeof direccion === 'string') return direccion;

  const calle = direccion.calle || direccion.street || direccion.direccion;
  const numero = direccion.numero || direccion.number || '';
  const texto = [calle, numero].filter(Boolean).join(' ');

  return texto || 'Direccion sin cargar';
}

function ordenarPedidos(a, b, tipo) {
  if (tipo === 'total') return b.total - a.total;
  if (tipo === 'estado') return estadoRank(a.estado) - estadoRank(b.estado);

  const fechaA = new Date(a.fecha || 0).getTime();
  const fechaB = new Date(b.fecha || 0).getTime();
  return fechaB - fechaA;
}

function estadoRank(estado) {
  return ['Pendiente', 'Preparando', 'Enviado', 'Entregado'].indexOf(estado);
}

function resumenProductos(productos) {
  if (!productos || !Array.isArray(productos) || !productos.length) return 'Sin productos cargados';

  return productos
    .slice(0, 3)
    .map((producto) => {
      const nombre = producto.nombre || producto.producto?.nombre || 'Producto';
      const cantidad = producto.cantidad || 1;
      return `${nombre} x${cantidad}`;
    })
    .join(' · ');
}

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function formatearFecha(valor) {
  if (!valor) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(valor));
}

function estadoLabel(estado) {
  return estado;
}

function iniciales(nombre) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

function estadoClass(estado) {
  return estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function priorityClass(prioridad) {
  return prioridad.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

export default Pedidos;
