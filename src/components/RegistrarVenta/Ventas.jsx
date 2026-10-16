import { useEffect, useState } from 'react';
import { getVentasPorTienda } from '../../api/ventas';
import RegistrarVentaModal from './RegistrarVentaModal';
import './Ventas.css';

// ——— Helpers ———

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
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Cargar ventas
  useEffect(() => {
    if (!idTienda) {
      setError('No se encontró la tienda. Por favor iniciá sesión nuevamente.');
      return;
    }

    let montado = true;
    async function cargar() {
      setLoading(true);
      setError('');
      try {
        const data = await getVentasPorTienda(idTienda);
        if (montado) setVentas(Array.isArray(data) ? data : []);
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
  const totalVentas = ventas.length;
  const facturadoTotal = ventas.reduce((acc, v) => acc + Number(v.total ?? 0), 0);
  const unidadesVendidas = ventas.reduce((acc, v) => acc + Number(v.cantidad ?? 0), 0);

  const handleVentaRegistrada = (nuevaVenta, nombreProducto) => {
    // Construir la fila optimista mientras llega el re-fetch
    const filaOptimista = {
      ...nuevaVenta,
      nombre_producto: nombreProducto,
    };
    setVentas((prev) => [filaOptimista, ...prev]);
    setMostrarModal(false);
    setToastMsg(`Venta de "${nombreProducto}" registrada correctamente`);
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
        {!loading && !error && ventas.length === 0 && (
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

        {!loading && !error && ventas.length > 0 && (
          <div className="ventas-table-wrap">
            <table className="ventas-table" aria-label="Historial de ventas">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Cliente</th>
                  <th>Cantidad</th>
                  <th>Precio unit.</th>
                  <th>Total</th>
                  <th>Método de pago</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v, idx) => (
                  <tr key={v.id_venta ?? idx}>
                    <td className="ventas-td--id">
                      {v.id_venta ? `#${v.id_venta}` : '—'}
                    </td>
                    <td className="ventas-td--nombre">{v.nombre_producto || '—'}</td>
                    <td className="ventas-td--cliente">
                      {v.nombre_cliente ? (
                        <span className="ventas-badge ventas-badge--cliente">{v.nombre_cliente}</span>
                      ) : (
                        <span className="ventas-td--sin-cliente">Presencial</span>
                      )}
                    </td>
                    <td className="ventas-td--num">{v.cantidad}</td>
                    <td className="ventas-td--num">{formatPrecio(v.precio_unitario)}</td>
                    <td className="ventas-td--total">{formatPrecio(v.total)}</td>
                    <td>
                      <span className="ventas-badge ventas-badge--metodo">
                        {v.metodo_pago || 'Sin especificar'}
                      </span>
                    </td>
                    <td className="ventas-td--fecha">{formatFecha(v.fecha)}</td>
                    <td className="ventas-td--hora">{formatHora(v.fecha)}</td>
                  </tr>
                ))}
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
    </section>
  );
}

export default Ventas;
