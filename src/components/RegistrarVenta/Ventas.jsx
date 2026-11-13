import { useEffect, useState } from 'react';
import { cargarVentasTienda } from './cargarVentasTienda';
import { calcularTotalVenta, normalizarDetallesVenta, crearPedidoDesdeVenta } from '../../api/ventas';
import RegistrarVentaModal from './RegistrarVentaModal';
import CampoDireccion from '../Pedidos/CampoDireccion';
import { formatoDireccionValido } from '../../api/direcciones';
import './RegistrarVentaModal.css';
import './Ventas.css';

// ——— Helpers ———

function obtenerClienteVenta(venta) {
  const nombreCliente =
    venta?.nombre_cliente ||
    venta?.cliente ||
    venta?.nombre ||
    venta?.usuario?.nombre ||
    '';

  const idUsuario =
    venta?.id_usuario ??
    venta?.usuario_id ??
    venta?.idUsuario ??
    venta?.usuario?.id_usuario ??
    null;

  if (idUsuario !== null && idUsuario !== undefined && idUsuario !== '' && idUsuario !== 'null') {
    return nombreCliente || 'Cliente asociado';
  }

  if (nombreCliente) return nombreCliente;

  return null;
}

function esVentaDeTienda(venta, idTienda) {
  if (!idTienda) return false;

  const idTiendaVenta = Number(
    venta?.id_tienda ??
    venta?.tienda_id ??
    venta?.idTienda ??
    0
  );

  return idTiendaVenta === Number(idTienda);
}

function formatFecha(fechaStr) {
  if (!fechaStr) return '—';
  const d = new Date(fechaStr);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatHora(fechaStr) {
  if (!fechaStr) return '—';
  const d = new Date(fechaStr);
  return d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrecio(valor) {
  return `$${Number(valor ?? 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ——— Iconos ———
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconEmpty = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

// ——— KPI ———
function KpiCard({ label, value, accent }) {
  return (
    <div className="ventas-kpi" style={{ '--accent': accent }}>
      <span className="ventas-kpi__label">{label}</span>
      <strong className="ventas-kpi__value">{value}</strong>
    </div>
  );
}

// ——— Toast de éxito ———
function ToastExito({ mensaje, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="ventas-toast" role="status" aria-live="polite">
      <span className="ventas-toast__icon">✓</span>
      {mensaje}
      <button type="button" className="ventas-toast__close" onClick={onClose} aria-label="Cerrar">✕</button>
    </div>
  );
}

// ——— Componente principal ———
function Ventas({ onVolver }) {
  const idTienda = Number(localStorage.getItem('id_tienda')) || null;

  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorCarga, setError] = useState('');
  const error = idTienda ? errorCarga : 'No se encontró la tienda. Por favor iniciá sesión nuevamente.';
  const [refreshKey, setRefreshKey] = useState(0);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [ventaPedido, setVentaPedido] = useState(null);
  const [direccionPedido, setDireccionPedido] = useState('');
  const [direccionPedidoValida, setDireccionPedidoValida] = useState(false);
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [errorPedido, setErrorPedido] = useState('');

  const ventasDeLaTienda = Array.isArray(ventas)
    ? ventas.filter((venta) => esVentaDeTienda(venta, idTienda))
    : [];

  // Cargar ventas
  useEffect(() => {
    if (!idTienda) return undefined;

    let montado = true;
    async function cargar() {
      setLoading(true);
      setError('');
      try {
        const ventasValidas = await cargarVentasTienda(idTienda);
        if (!montado) return;

        setVentas(ventasValidas);
      } catch (err) {
        if (montado) setError(err.message || 'No se pudieron cargar las ventas.');
      } finally {
        if (montado) setLoading(false);
      }
    }
    cargar();
    return () => { montado = false; };
  }, [idTienda, refreshKey]);

  // KPIs calculados
  const totalVentas = ventasDeLaTienda.length;
  const facturadoTotal = ventasDeLaTienda.reduce((acc, v) => acc + Number(calcularTotalVenta(v) ?? 0), 0);
  const unidadesVendidas = ventasDeLaTienda.reduce(
    (acc, v) => acc + normalizarDetallesVenta(v).reduce((s, d) => s + Number(d.cantidad ?? 0), 0),
    0
  );

  const handleVentaRegistrada = (nuevaVenta, nombreProducto, nombreCliente = null) => {
    const filaOptimista = {
      ...nuevaVenta,
      id_tienda: idTienda,
      ...(nombreCliente && { nombre_cliente: nombreCliente }),
    };
    setVentas((prev) => [filaOptimista, ...prev]);
    setMostrarModal(false);
    setToastMsg(`Venta registrada correctamente: ${nombreProducto}`);
  };

  const abrirModalPedido = (venta) => {
    if (!venta?.id_venta) return;
    const dirInicial = String(venta?.direccion || '').trim();
    setVentaPedido(venta);
    setDireccionPedido(dirInicial);
    setDireccionPedidoValida(dirInicial ? formatoDireccionValido(dirInicial) : false);
    setErrorPedido('');
  };

  const cerrarModalPedido = () => {
    if (guardandoPedido) return;
    setVentaPedido(null);
    setDireccionPedido('');
    setDireccionPedidoValida(false);
    setErrorPedido('');
  };

  const confirmarAgregarPedido = async () => {
    if (!ventaPedido?.id_venta) return;
    const dir = direccionPedido.trim();
    if (!dir) {
      setErrorPedido('La dirección es obligatoria para crear el pedido.');
      return;
    }
    if (!direccionPedidoValida) {
      setErrorPedido('Seleccioná una dirección válida del desplegable de sugerencias.');
      return;
    }
    setGuardandoPedido(true);
    setErrorPedido('');
    try {
      const res = await crearPedidoDesdeVenta(ventaPedido.id_venta, { direccion: dir, metodo_pago: ventaPedido.metodo_pago || null });
      const idPedido = res?.id_pedido ?? res?.data?.id_pedido;
      setVentas((prev) => prev.map((v) => (String(v.id_venta) === String(ventaPedido.id_venta) ? { ...v, id_pedido: idPedido ?? v.id_pedido } : v)));
      setToastMsg(`Pedido ${idPedido ? `#${idPedido}` : ''} creado y asociado a la venta #${ventaPedido.id_venta}`.trim());
      setVentaPedido(null);
      setDireccionPedido('');
      setDireccionPedidoValida(false);
    } catch (err) {
      setErrorPedido(err.message || 'No se pudo crear el pedido.');
    } finally {
      setGuardandoPedido(false);
    }
  };

  return (
    <section className="ventas-page">
      {toastMsg && (
        <ToastExito mensaje={toastMsg} onClose={() => setToastMsg('')} />
      )}

      <div className="ventas-shell">
        {/* Header */}
        <header className="ventas-header">
          <div className="ventas-heading">
            {onVolver && (
              <button type="button" className="ventas-back" onClick={onVolver}>
                <IconBack />
                Volver
              </button>
            )}
            <span className="ventas-kicker">Panel del vendedor</span>
            <h1>Ventas</h1>
            <p>Historial de ventas y registro de nuevas transacciones.</p>
          </div>

          <div className="ventas-header-actions">
            <button
              type="button"
              className="ventas-btn ventas-btn--secondary"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
            >
              <IconRefresh />
              Actualizar
            </button>
            <button
              type="button"
              className="ventas-btn ventas-btn--primary"
              onClick={() => setMostrarModal(true)}
              disabled={!idTienda}
            >
              <IconPlus />
              Registrar venta
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="ventas-kpis" aria-label="Resumen de ventas">
          <KpiCard label="Total de ventas" value={totalVentas} accent="#059669" />
          <KpiCard label="Unidades vendidas" value={unidadesVendidas} accent="#0369a1" />
          <KpiCard label="Facturado" value={formatPrecio(facturadoTotal)} accent="#7c3aed" />
        </div>

        {/* Estados */}
        {loading && <p className="ventas-msg">Cargando ventas...</p>}
        {error && <p className="ventas-msg ventas-msg--error">{error}</p>}

        {/* Tabla de historial */}
        {!loading && !error && ventasDeLaTienda.length === 0 && (
          <div className="ventas-empty">
            <IconEmpty />
            <p>No hay ventas registradas todavía.</p>
            <button
              type="button"
              className="ventas-btn ventas-btn--primary"
              onClick={() => setMostrarModal(true)}
            >
              <IconPlus />
              Registrar primera venta
            </button>
          </div>
        )}

        {!loading && !error && ventasDeLaTienda.length > 0 && (
          <div className="ventas-table-wrap">
            <table className="ventas-table" aria-label="Historial de ventas">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Productos</th>
                  <th>Cliente</th>
                  <th>Unidades</th>
                  <th>Total</th>
                  <th>Método de pago</th>
                  <th>Pedido</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {ventasDeLaTienda.map((v, idx) => {
                  const clienteVenta = obtenerClienteVenta(v);
                  const detalles = normalizarDetallesVenta(v);
                  const unidades = detalles.reduce((s, d) => s + Number(d.cantidad ?? 0), 0);
                  const total = calcularTotalVenta(v);
                  const idPedido = v?.id_pedido ?? v?.pedido?.id_pedido ?? null;

                  return (
                    <tr key={v.id_venta ?? idx}>
                      <td className="ventas-td--id">{v.id_venta ? `#${v.id_venta}` : '—'}</td>
                      <td className="ventas-td--nombre">
                        {detalles.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {detalles.map((d, i) => (
                              <span key={d.id_detalleventa ?? `${d.id_producto}-${i}`}>
                                {d.nombre_producto || `Producto #${d.id_producto}`} × {d.cantidad}{' '}
                                <span style={{ color: '#64748b' }}>({formatPrecio(d.precio_unitario)} c/u)</span>
                              </span>
                            ))}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="ventas-td--cliente">
                        {clienteVenta ? (
                          <span className="ventas-badge ventas-badge--cliente">{clienteVenta}</span>
                        ) : (
                          <span className="ventas-td--sin-cliente">Presencial</span>
                        )}
                      </td>
                      <td className="ventas-td--num">{unidades}</td>
                      <td className="ventas-td--total">{formatPrecio(total)}</td>
                      <td>
                        <span className="ventas-badge ventas-badge--metodo">{v.metodo_pago || 'Sin especificar'}</span>
                      </td>
                      <td>
                        {idPedido ? (
                          <span className="ventas-badge ventas-badge--metodo">Pedido #{idPedido}</span>
                        ) : (
                          <button
                            type="button"
                            className="ventas-btn ventas-btn--secondary"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                            onClick={() => abrirModalPedido(v)}
                            disabled={!v.id_venta}
                          >
                            Agregar pedido
                          </button>
                        )}
                      </td>
                      <td className="ventas-td--fecha">{formatFecha(v.fecha)}</td>
                      <td className="ventas-td--hora">{formatHora(v.fecha)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {mostrarModal && idTienda && (
        <RegistrarVentaModal
          idTienda={idTienda}
          onVentaRegistrada={handleVentaRegistrada}
          onCancelar={() => setMostrarModal(false)}
        />
      )}

      {ventaPedido && (
        <div className="rvm-backdrop" role="presentation" onMouseDown={cerrarModalPedido}>
          <div
            className="rvm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ventas-pedido-titulo"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: 520 }}
          >
            <div className="rvm-header">
              <div>
                <span className="rvm-kicker">Pedido</span>
                <h2 id="ventas-pedido-titulo">Agregar pedido a la venta #{ventaPedido.id_venta}</h2>
              </div>
              <button type="button" className="rvm-close" aria-label="Cerrar" onClick={cerrarModalPedido} disabled={guardandoPedido}>
                ✕
              </button>
            </div>

            <div className="rvm-form" style={{ gap: 12 }}>
              <p className="rvm-alta-usuario__desc" style={{ margin: 0, lineHeight: 1.5 }}>
                Se creará el pedido con los productos de la venta (sin descontar stock nuevamente) y quedará vinculado a esta venta.
              </p>
              <div className="ventas-campo-direccion">
                <CampoDireccion
                  label="Dirección de entrega"
                  value={direccionPedido}
                  valida={direccionPedidoValida}
                  onChange={(texto, valida) => {
                    setDireccionPedido(texto);
                    setDireccionPedidoValida(valida);
                    if (errorPedido) setErrorPedido('');
                  }}
                  disabled={guardandoPedido}
                />
              </div>

              {errorPedido && <p className="rvm-msg rvm-msg--error" role="alert" style={{ margin: 0 }}>{errorPedido}</p>}

              <div className="rvm-actions" style={{ marginTop: 4 }}>
                <button type="button" className="rvm-btn rvm-btn--cancel" onClick={cerrarModalPedido} disabled={guardandoPedido}>
                  Cancelar
                </button>
                <button type="button" className="rvm-btn rvm-btn--confirm" onClick={confirmarAgregarPedido} disabled={guardandoPedido || !direccionPedidoValida}>
                  {guardandoPedido ? 'Creando pedido...' : 'Crear y vincular pedido'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Ventas;
