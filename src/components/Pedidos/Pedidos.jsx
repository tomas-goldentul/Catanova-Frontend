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
  FiPlus,
  FiPrinter,
  FiSearch,
  FiTruck,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import './Pedidos.css';

const API_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ESTADOS = ['Todos', 'Pendiente', 'Entregado'];
const ORDENES = [
  { value: 'fecha', label: 'Fecha reciente' },
  { value: 'total', label: 'Mayor total' },
  { value: 'estado', label: 'Estado' },
];
const ITEMS_POR_PAGINA = 4;

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [orden, setOrden] = useState('fecha');
  const [pagina, setPagina] = useState(1);
  const [menuAbierto, setMenuAbierto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pedidosDisponibles = pedidos;

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
        const data = await fetchPedidos(controller.signal);
        setPedidos(extraerListaPedidos(data));
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
  }, []);

  return (
    <section className="pedidos-page">
      <div className="pedidos-shell">
        <header className="pedidos-header">
          <div className="pedidos-heading">
            <span className="pedidos-kicker">Panel del vendedor</span>
            <h1>Pedidos y envios</h1>
            <p>Operacion diaria, entregas, pagos y responsables en una vista compacta.</p>
          </div>

          <div className="pedidos-header-actions">
            <button type="button" className="pedidos-secondary">
              <FiPrinter aria-hidden="true" />
              Imprimir
            </button>
            <button type="button" className="pedidos-create">
              <FiPlus aria-hidden="true" />
              Crear envio
            </button>
          </div>
        </header>

        <div className="pedidos-summary" aria-label="Resumen de pedidos">
          <KpiCard label="Pedidos activos" value={metricas.total} tone="neutral" />
          <KpiCard label="Pendientes" value={metricas.pendientes} tone="warning" />
          <KpiCard label="Entregados" value={metricas.entregados} tone="info" />
          <KpiCard label="Facturado" value={formatearPrecio(metricas.facturado)} tone="success" />
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
              placeholder="Buscar direccion, cliente, repartidor o CP"
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
                    <h2>{detalle.direccion}</h2>
                    <span className={`pedido-status ${estadoClass(detalle.estado)}`}>
                      {estadoLabel(detalle.estado)}
                    </span>
                  </div>

                  <p className="pedido-products">{resumenProductos(detalle.productos)}</p>

                  <div className="pedido-people">
                    <PersonPill icon={<FiUsers aria-hidden="true" />} label={detalle.comprador} />
                    <PersonPill icon={<FiTruck aria-hidden="true" />} label={detalle.repartidor} muted={detalle.repartidor === 'Sin asignar'} />
                  </div>

                  <ProgressBar estado={detalle.estado} />
                </div>

                <div className="pedido-meta">
                  <MetaItem icon={<FiMapPin aria-hidden="true" />} label="Zona" value={`${detalle.localidad} · ${detalle.codigoPostal}`} />
                  <MetaItem icon={<FiClock aria-hidden="true" />} label="Entrega estimada" value={detalle.eta} />
                  <MetaItem icon={<FiCreditCard aria-hidden="true" />} label="Pago" value={detalle.pago} accent={detalle.pago === 'Pagado'} />
                </div>

                <div className="pedido-total-panel">
                  <span>Total</span>
                  <strong>{formatearPrecio(detalle.total)}</strong>
                  <button type="button" className="pedido-view">
                    <FiEye aria-hidden="true" />
                    Ver detalle
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
                      <button type="button">
                        <FiEdit3 aria-hidden="true" />
                        Editar pedido
                      </button>
                      <button type="button">
                        <FiUserCheck aria-hidden="true" />
                        Asignar repartidor
                      </button>
                      <button type="button">
                        <FiCheckCircle aria-hidden="true" />
                        Cambiar estado
                      </button>
                      <button type="button">
                        <FiFileText aria-hidden="true" />
                        Imprimir etiqueta
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

async function fetchPedidos(signal) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/pedidos/getAll`, { headers, signal });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || payload.error || `Error ${response.status}`);
  }

  return payload;
}

function extraerListaPedidos(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.pedidos)) return data.pedidos;
  if (Array.isArray(data?.envios)) return data.envios;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizarPedido(pedido) {
  const productosBase = pedido.productos || pedido.items || pedido.detalle || [];
  const productos = Array.isArray(productosBase) ? productosBase : [];
  const comprador = pedido.cliente || pedido.comprador || pedido.usuario || {};
  const repartidor = pedido.repartidor || pedido.delivery || pedido.cadete || {};
  const direccion = pedido.direccion || pedido.direccionEnvio || pedido.shippingAddress || comprador.direccion || {};

  return {
    id: pedido.id || pedido._id || 'Sin ID',
    direccion: normalizarDireccion(direccion),
    comprador: comprador.nombre || comprador.name || pedido.clienteNombre || pedido.compradorNombre || 'Sin datos',
    repartidor: repartidor.nombre || repartidor.name || pedido.repartidorNombre || pedido.vendedor?.nombre || 'Sin asignar',
    codigoPostal: pedido.codigoPostal || pedido.cp || direccion.codigoPostal || direccion.cp || comprador.codigoPostal || 'Sin CP',
    localidad: pedido.localidad || pedido.ciudad || direccion.localidad || direccion.ciudad || comprador.localidad || 'Sin localidad',
    estado: normalizarEstado(pedido),
    total: normalizarPrecio(pedido.precio_total ?? pedido.total ?? pedido.totalPedido ?? pedido.montoTotal ?? pedido.amount ?? 0),
    productos,
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
  if (!productos.length) return 'Sin productos cargados';

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
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
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
