import { useEffect, useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiFilter, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import './Pedidos.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ESTADOS = ['Todos', 'Pendiente', 'Preparando', 'Enviado', 'Entregado'];
const ITEMS_POR_PAGINA = 4;

const PEDIDOS_DEMO = [
  {
    id: 'ENV-5255',
    direccion: 'Cnel. Niceto Vega 5255',
    productos: [
      { nombre: 'Remera azul', cantidad: 4 },
      { nombre: 'Gorra Jeans', cantidad: 1 },
    ],
    comprador: 'Miguel Rodriguez',
    repartidor: 'Juan Bautista Son',
    codigoPostal: 'C1414BEM',
    localidad: 'Ciudad Autonoma de Buenos Aires',
    estado: 'Preparando',
    total: 48600,
    fecha: '2026-06-26T10:30:00',
  },
  {
    id: 'ENV-4699',
    direccion: 'Guatemala 4699',
    productos: [
      { nombre: 'Remera blanca', cantidad: 1 },
    ],
    comprador: 'Manuel Rodriguez',
    repartidor: 'Juan Bautista Gartenkrot',
    codigoPostal: 'C1414BEM',
    localidad: 'Ciudad Autonoma de Buenos Aires',
    estado: 'Pendiente',
    total: 18900,
    fecha: '2026-06-25T18:20:00',
  },
  {
    id: 'ENV-4367',
    direccion: 'Av Estado de Israel 4367',
    productos: [
      { nombre: 'Remera azul', cantidad: 4 },
      { nombre: 'Gorra Jeans', cantidad: 1 },
    ],
    comprador: 'Miguel Rodriguez',
    repartidor: 'Juan Bautista Son',
    codigoPostal: 'C1414BEM',
    localidad: 'Ciudad Autonoma de Buenos Aires',
    estado: 'Enviado',
    total: 52200,
    fecha: '2026-06-24T12:40:00',
  },
  {
    id: 'ENV-5256',
    direccion: 'Cnel. Niceto Vega 5255',
    productos: [
      { nombre: 'Remera azul', cantidad: 4 },
      { nombre: 'Gorra Jeans', cantidad: 1 },
    ],
    comprador: 'Miguel Rodriguez',
    repartidor: 'Juan Bautista Son',
    codigoPostal: 'C1414BEM',
    localidad: 'Ciudad Autonoma de Buenos Aires',
    estado: 'Entregado',
    total: 48600,
    fecha: '2026-06-22T09:15:00',
  },
  {
    id: 'ENV-1880',
    direccion: 'Honduras 4120',
    productos: [
      { nombre: 'Buzo oversize', cantidad: 2 },
      { nombre: 'Jean recto', cantidad: 1 },
    ],
    comprador: 'Camila Pereira',
    repartidor: 'Mora Alvarez',
    codigoPostal: 'C1180ACD',
    localidad: 'Palermo',
    estado: 'Pendiente',
    total: 74300,
    fecha: '2026-06-21T15:10:00',
  },
  {
    id: 'ENV-9021',
    direccion: 'Av. Corrientes 2145',
    productos: [
      { nombre: 'Campera urbana', cantidad: 1 },
    ],
    comprador: 'Tomas Silva',
    repartidor: 'Sin asignar',
    codigoPostal: 'C1045AAB',
    localidad: 'Balvanera',
    estado: 'Preparando',
    total: 66900,
    fecha: '2026-06-20T11:05:00',
  },
];

function getStoredVendedorId() {
  const directId = localStorage.getItem('vendedorId');
  if (directId) return directId;

  const user = localStorage.getItem('user') || localStorage.getItem('usuario');
  if (!user) return '';

  try {
    const parsedUser = JSON.parse(user);
    return parsedUser.vendedorId || parsedUser.id || '';
  } catch {
    return '';
  }
}

function Pedidos() {
  const [vendedorId] = useState(getStoredVendedorId);
  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pedidosDisponibles = pedidos.length > 0 ? pedidos : PEDIDOS_DEMO;

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return [...pedidosDisponibles].filter((pedido) => {
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
      const coincideTexto = !texto || campos.toLowerCase().includes(texto);

      return coincideEstado && coincideTexto;
    }).sort((a, b) => {
      const fechaA = new Date(a.fecha || a.createdAt || 0).getTime();
      const fechaB = new Date(b.fecha || b.createdAt || 0).getTime();
      return fechaB - fechaA;
    });
  }, [busqueda, estado, pedidosDisponibles]);

  const totalPaginas = Math.max(1, Math.ceil(pedidosFiltrados.length / ITEMS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const pedidosPaginados = pedidosFiltrados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA,
  );

  const metricas = useMemo(() => {
    const normalizados = pedidosDisponibles.map(normalizarPedido);
    return {
      total: normalizados.length,
      pendientes: normalizados.filter((pedido) => pedido.estado === 'Pendiente').length,
      enviados: normalizados.filter((pedido) => pedido.estado === 'Enviado').length,
    };
  }, [pedidosDisponibles]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, estado]);

  useEffect(() => {
    if (!vendedorId) return;

    const controller = new AbortController();

    async function cargarPedidos() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_URL}/pedidos/vendedor/${vendedorId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('No se pudieron cargar los pedidos del vendedor.');
        }

        const data = await response.json();
        setPedidos(Array.isArray(data) ? data : data.pedidos || data.envios || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setPedidos([]);
        }
      } finally {
        setLoading(false);
      }
    }

    cargarPedidos();

    return () => controller.abort();
  }, [vendedorId]);

  return (
    <section className="pedidos-page">
      <div className="pedidos-shell">
        <header className="pedidos-header">
          <div className="pedidos-heading">
            <span className="pedidos-kicker">Panel del vendedor</span>
            <h1>Pedidos y envios</h1>
            <p>Gestiona entregas, compradores y repartidores desde una sola vista.</p>
          </div>

          <button type="button" className="pedidos-create">
            <FiPlus aria-hidden="true" />
            Crear envio
          </button>
        </header>

        <div className="pedidos-summary" aria-label="Resumen de pedidos">
          <div>
            <span>Total pedidos</span>
            <strong>{metricas.total}</strong>
          </div>
          <div>
            <span>Pendientes</span>
            <strong>{metricas.pendientes}</strong>
          </div>
          <div>
            <span>En camino</span>
            <strong>{metricas.enviados}</strong>
          </div>
        </div>

        <div className="pedidos-toolbar">
          <label className="pedidos-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Busca por direccion, comprador o CP"
            />
          </label>

          <label className="pedidos-filter">
            <FiFilter aria-hidden="true" />
            <select value={estado} onChange={(event) => setEstado(event.target.value)}>
              {ESTADOS.map((option) => (
                <option key={option} value={option}>
                  {option === 'Todos' ? 'Todos los estados' : option}
                </option>
              ))}
            </select>
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

            return (
              <article className="pedido-card" key={detalle.id}>
                <div className="pedido-main">
                  <div className="pedido-title-row">
                    <span className="pedido-id">{detalle.id}</span>
                    <span className={`pedido-status ${estadoClass(detalle.estado)}`}>{detalle.estado}</span>
                  </div>

                  <h2>{detalle.direccion}</h2>
                  <p>{resumenProductos(detalle.productos)}</p>

                  <div className="pedido-people">
                    <span>Comprador: {detalle.comprador}</span>
                    <span>Repartidor: {detalle.repartidor}</span>
                  </div>
                </div>

                <dl className="pedido-address">
                  <div>
                    <dt>Codigo postal</dt>
                    <dd>{detalle.codigoPostal}</dd>
                  </div>
                  <div>
                    <dt>Localidad</dt>
                    <dd>{detalle.localidad}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{formatearPrecio(detalle.total)}</dd>
                  </div>
                </dl>

                <div className="pedido-actions">
                  <button type="button">Ver pedido</button>
                  <button type="button" className="danger">
                    <FiTrash2 aria-hidden="true" />
                    Borrar
                  </button>
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

function normalizarPedido(pedido) {
  const productos = pedido.productos || pedido.items || [];

  return {
    id: pedido.id || pedido._id || 'Sin ID',
    direccion: pedido.direccion || pedido.direccionEnvio || pedido.cliente?.direccion || 'Direccion sin cargar',
    comprador: pedido.cliente?.nombre || pedido.comprador || pedido.clienteNombre || 'Sin datos',
    repartidor: pedido.repartidor?.nombre || pedido.repartidor || pedido.vendedor?.nombre || 'Sin asignar',
    codigoPostal: pedido.codigoPostal || pedido.cp || pedido.cliente?.codigoPostal || 'Sin CP',
    localidad: pedido.localidad || pedido.ciudad || pedido.cliente?.localidad || 'Sin localidad',
    estado: pedido.estado || 'Pendiente',
    total: Number(pedido.total || pedido.totalPedido || 0),
    productos,
  };
}

function resumenProductos(productos) {
  if (!productos.length) return 'Sin productos cargados';

  return productos
    .slice(0, 3)
    .map((producto) => {
      const nombre = producto.nombre || producto.producto?.nombre || 'Producto';
      const cantidad = producto.cantidad || 1;
      return `${nombre}: ${cantidad} unidad${cantidad === 1 ? '' : 'es'}`;
    })
    .join('; ');
}

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor);
}

function estadoClass(estado) {
  return estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default Pedidos;
