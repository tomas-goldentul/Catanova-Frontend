import { useEffect, useMemo, useState } from 'react';
import { cargarVentasTienda } from '../RegistrarVenta/cargarVentasTienda';
import './Estadisticas.css';

const PERIODOS = [
  { id: 'dia', label: 'Día' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' },
];

const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ——— Helpers de fechas ———

function inicioDelDia(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Devuelve el rango [inicio, fin) del período desplazado `offset` unidades (0 = actual, -1 = anterior...)
// junto con los "baldes" del gráfico (horas, días de la semana o días del mes).
function calcularRango(periodo, offset) {
  const hoy = inicioDelDia(new Date());

  if (periodo === 'dia') {
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() + offset);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 1);
    const buckets = Array.from({ length: 24 }, (_, h) => ({
      label: `${String(h).padStart(2, '0')}h`,
      detalle: `${String(h).padStart(2, '0')}:00 – ${String(h).padStart(2, '0')}:59`,
    }));
    const titulo = offset === 0 ? 'Hoy' : offset === -1 ? 'Ayer' : formatFechaLarga(inicio);
    return { inicio, fin, buckets, titulo, indice: (d) => d.getHours() };
  }

  if (periodo === 'semana') {
    const inicio = new Date(hoy);
    const diaSemana = (inicio.getDay() + 6) % 7; // lunes = 0
    inicio.setDate(inicio.getDate() - diaSemana + offset * 7);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 7);
    const buckets = DIAS_CORTOS.map((nombre, i) => {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i);
      return { label: `${nombre} ${d.getDate()}`, detalle: formatFechaLarga(d) };
    });
    const ultimo = new Date(fin);
    ultimo.setDate(ultimo.getDate() - 1);
    const titulo = offset === 0
      ? 'Esta semana'
      : `${formatFechaCorta(inicio)} – ${formatFechaCorta(ultimo)}`;
    return { inicio, fin, buckets, titulo, indice: (d) => (d.getDay() + 6) % 7 };
  }

  // mes
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() + offset, 1);
  const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
  const diasEnMes = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate();
  const buckets = Array.from({ length: diasEnMes }, (_, i) => {
    const d = new Date(inicio.getFullYear(), inicio.getMonth(), i + 1);
    return { label: String(i + 1), detalle: formatFechaLarga(d) };
  });
  const nombreMes = inicio.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const titulo = offset === 0 ? 'Este mes' : nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
  return { inicio, fin, buckets, titulo, indice: (d) => d.getDate() - 1 };
}

function formatFechaLarga(d) {
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatFechaCorta(d) {
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function formatPrecio(valor) {
  return `$${Number(valor ?? 0).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatPrecioCompacto(valor) {
  const n = Number(valor ?? 0);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `$${(n / 1_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}k`;
  return `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

function filtrarPorRango(ventas, inicio, fin) {
  return ventas.filter((v) => {
    if (!v?.fecha) return false;
    const d = new Date(v.fecha);
    return d >= inicio && d < fin;
  });
}

function resumir(ventas) {
  const facturado = ventas.reduce((acc, v) => acc + Number(v.total ?? 0), 0);
  const unidades = ventas.reduce((acc, v) => acc + Number(v.cantidad ?? 0), 0);
  const cantidad = ventas.length;
  return { facturado, unidades, cantidad, ticket: cantidad ? facturado / cantidad : 0 };
}

function variacion(actual, anterior) {
  if (!anterior) return actual ? null : 0; // null = "nuevo" (no había nada antes)
  return ((actual - anterior) / anterior) * 100;
}

// Escala "linda" para el eje Y: 4 divisiones con valores redondos.
function techoEje(max) {
  if (max <= 0) return 1;
  const paso = max / 4;
  const magnitud = 10 ** Math.floor(Math.log10(paso));
  const normal = paso / magnitud;
  const pasoLindo = (normal <= 1 ? 1 : normal <= 2 ? 2 : normal <= 2.5 ? 2.5 : normal <= 5 ? 5 : 10) * magnitud;
  return pasoLindo * 4;
}

// ——— Iconos ———
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconNext = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ——— Subcomponentes ———

function Kpi({ label, value, cambio, etiquetaComparacion }) {
  let chip = null;
  if (cambio === null) {
    chip = <span className="est-kpi__cambio est-kpi__cambio--neutro">Nuevo</span>;
  } else if (Number.isFinite(cambio)) {
    const redondeado = Math.round(cambio);
    const clase = redondeado > 0 ? 'positivo' : redondeado < 0 ? 'negativo' : 'neutro';
    const signo = redondeado > 0 ? '▲' : redondeado < 0 ? '▼' : '';
    chip = (
      <span className={`est-kpi__cambio est-kpi__cambio--${clase}`}>
        {signo} {Math.abs(redondeado)}%
      </span>
    );
  }

  return (
    <div className="est-kpi">
      <span className="est-kpi__label">{label}</span>
      <strong className="est-kpi__value">{value}</strong>
      <span className="est-kpi__comparacion">
        {chip} <span>vs. {etiquetaComparacion}</span>
      </span>
    </div>
  );
}

function GraficoBarras({ datos, buckets, periodo }) {
  const [activo, setActivo] = useState(null);
  const max = Math.max(0, ...datos.map((d) => d.facturado));
  const techo = techoEje(max);
  const lineas = [4, 3, 2, 1, 0].map((i) => (techo / 4) * i);
  // En el mes mostramos etiqueta cada tantos días para que no se pisen.
  const cadaCuanto = periodo === 'mes' ? 5 : periodo === 'dia' ? 3 : 1;

  return (
    <div className="est-chart" onMouseLeave={() => setActivo(null)}>
      <div className="est-chart__eje-y" aria-hidden="true">
        {lineas.map((v) => <span key={v}>{formatPrecioCompacto(v)}</span>)}
      </div>

      <div className="est-chart__area">
        <div className="est-chart__grid" aria-hidden="true">
          {lineas.map((v) => <span key={v} />)}
        </div>

        <div className="est-chart__barras">
          {datos.map((d, i) => {
            const alto = techo ? (d.facturado / techo) * 100 : 0;
            const mostrarEtiqueta = i % cadaCuanto === 0 || (periodo === 'mes' && i === datos.length - 1);
            return (
              <div
                key={i}
                className={`est-chart__col ${activo === i ? 'is-activa' : ''}`}
                onMouseEnter={() => setActivo(i)}
                onFocus={() => setActivo(i)}
                onBlur={() => setActivo(null)}
                tabIndex={0}
                aria-label={`${buckets[i].detalle}: ${formatPrecio(d.facturado)}, ${d.cantidad} ventas`}
              >
                <div className="est-chart__barra" style={{ height: `${alto}%` }} />
                <span className="est-chart__label-x">{mostrarEtiqueta ? buckets[i].label : ''}</span>

                {activo === i && (
                  <div className={`est-tooltip ${i > datos.length * 0.7 ? 'est-tooltip--izq' : ''}`} role="tooltip">
                    <span className="est-tooltip__titulo">{buckets[i].detalle}</span>
                    <span><strong>{formatPrecio(d.facturado)}</strong> facturado</span>
                    <span>{d.cantidad} {d.cantidad === 1 ? 'venta' : 'ventas'} · {d.unidades} u.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ListaBarras({ items, vacio }) {
  if (!items.length) return <p className="est-vacio-mini">{vacio}</p>;
  const max = Math.max(...items.map((i) => i.valor));
  return (
    <ul className="est-lista">
      {items.map((item) => (
        <li key={item.nombre} className="est-lista__item">
          <div className="est-lista__fila">
            <span className="est-lista__nombre" title={item.nombre}>{item.nombre}</span>
            <span className="est-lista__valor">{item.texto}</span>
          </div>
          <div className="est-lista__track">
            <div className="est-lista__fill" style={{ width: `${max ? (item.valor / max) * 100 : 0}%` }} />
          </div>
          {item.sub && <span className="est-lista__sub">{item.sub}</span>}
        </li>
      ))}
    </ul>
  );
}

// ——— Componente principal ———

function Estadisticas({ onVolver }) {
  const idTienda = Number(localStorage.getItem('id_tienda')) || null;

  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(Boolean(idTienda));
  const [errorCarga, setErrorCarga] = useState('');
  const error = idTienda ? errorCarga : 'No se encontró la tienda. Por favor iniciá sesión nuevamente.';
  const [periodo, setPeriodo] = useState('semana');
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!idTienda) return undefined;
    let montado = true;
    cargarVentasTienda(idTienda)
      .then((data) => { if (montado) setVentas(data); })
      .catch((err) => { if (montado) setErrorCarga(err.message || 'No se pudieron cargar las estadísticas.'); })
      .finally(() => { if (montado) setLoading(false); });
    return () => { montado = false; };
  }, [idTienda]);

  const cambiarPeriodo = (nuevo) => {
    setPeriodo(nuevo);
    setOffset(0);
  };

  const stats = useMemo(() => {
    const rango = calcularRango(periodo, offset);
    const rangoAnterior = calcularRango(periodo, offset - 1);
    const delPeriodo = filtrarPorRango(ventas, rango.inicio, rango.fin);
    const delAnterior = filtrarPorRango(ventas, rangoAnterior.inicio, rangoAnterior.fin);

    const serie = rango.buckets.map(() => ({ facturado: 0, cantidad: 0, unidades: 0 }));
    for (const v of delPeriodo) {
      const idx = rango.indice(new Date(v.fecha));
      if (serie[idx]) {
        serie[idx].facturado += Number(v.total ?? 0);
        serie[idx].cantidad += 1;
        serie[idx].unidades += Number(v.cantidad ?? 0);
      }
    }

    const porProducto = new Map();
    for (const v of delPeriodo) {
      const nombre = v.nombre_producto || `Producto #${v.id_producto ?? '?'}`;
      const acc = porProducto.get(nombre) ?? { facturado: 0, unidades: 0 };
      acc.facturado += Number(v.total ?? 0);
      acc.unidades += Number(v.cantidad ?? 0);
      porProducto.set(nombre, acc);
    }
    const topProductos = [...porProducto]
      .sort((a, b) => b[1].facturado - a[1].facturado)
      .slice(0, 5)
      .map(([nombre, d]) => ({
        nombre,
        valor: d.facturado,
        texto: formatPrecio(d.facturado),
        sub: `${d.unidades} ${d.unidades === 1 ? 'unidad' : 'unidades'}`,
      }));

    const porMetodo = new Map();
    for (const v of delPeriodo) {
      const metodo = v.metodo_pago || 'Sin especificar';
      porMetodo.set(metodo, (porMetodo.get(metodo) ?? 0) + 1);
    }
    const metodos = [...porMetodo]
      .sort((a, b) => b[1] - a[1])
      .map(([nombre, cant]) => ({
        nombre,
        valor: cant,
        texto: `${Math.round((cant / delPeriodo.length) * 100)}%`,
        sub: `${cant} ${cant === 1 ? 'venta' : 'ventas'}`,
      }));

    const mejorIdx = serie.reduce((best, d, i) => (d.facturado > (serie[best]?.facturado ?? 0) ? i : best), -1);

    return {
      rango,
      actual: resumir(delPeriodo),
      anterior: resumir(delAnterior),
      serie,
      topProductos,
      metodos,
      mejor: mejorIdx >= 0 && serie[mejorIdx].facturado > 0 ? rango.buckets[mejorIdx].detalle : null,
    };
  }, [ventas, periodo, offset]);

  const etiquetaComparacion = { dia: 'día anterior', semana: 'semana anterior', mes: 'mes anterior' }[periodo];
  const { actual, anterior, rango } = stats;

  return (
    <section className="est-page">
      <div className="est-shell">
        <header className="est-header">
          <div className="est-heading">
            {onVolver && (
              <button type="button" className="est-back" onClick={onVolver}>
                <IconBack />
                Volver
              </button>
            )}
            <span className="est-kicker">Panel del vendedor</span>
            <h1>Estadísticas</h1>
            <p>Analizá cómo le va a tu tienda en el período que elijas.</p>
          </div>
        </header>

        {/* Filtros: período + navegación */}
        <div className="est-filtros">
          <div className="est-segmento" role="tablist" aria-label="Período">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={periodo === p.id}
                className={`est-segmento__btn ${periodo === p.id ? 'is-activo' : ''}`}
                onClick={() => cambiarPeriodo(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="est-nav">
            <button type="button" className="est-nav__btn" onClick={() => setOffset((o) => o - 1)} aria-label="Período anterior">
              <IconBack />
            </button>
            <span className="est-nav__titulo">{rango.titulo}</span>
            <button
              type="button"
              className="est-nav__btn"
              onClick={() => setOffset((o) => Math.min(0, o + 1))}
              disabled={offset >= 0}
              aria-label="Período siguiente"
            >
              <IconNext />
            </button>
            {offset < 0 && (
              <button type="button" className="est-nav__hoy" onClick={() => setOffset(0)}>
                Volver al actual
              </button>
            )}
          </div>
        </div>

        {loading && <p className="est-msg">Cargando estadísticas...</p>}
        {error && <p className="est-msg est-msg--error">{error}</p>}

        {!loading && !error && (
          <>
            <div className="est-kpis">
              <Kpi label="Facturado" value={formatPrecio(actual.facturado)} cambio={variacion(actual.facturado, anterior.facturado)} etiquetaComparacion={etiquetaComparacion} />
              <Kpi label="Ventas" value={actual.cantidad} cambio={variacion(actual.cantidad, anterior.cantidad)} etiquetaComparacion={etiquetaComparacion} />
              <Kpi label="Unidades vendidas" value={actual.unidades} cambio={variacion(actual.unidades, anterior.unidades)} etiquetaComparacion={etiquetaComparacion} />
              <Kpi label="Ticket promedio" value={formatPrecio(actual.ticket)} cambio={variacion(actual.ticket, anterior.ticket)} etiquetaComparacion={etiquetaComparacion} />
            </div>

            <div className="est-card">
              <div className="est-card__header">
                <h2>Facturación {periodo === 'dia' ? 'por hora' : 'por día'}</h2>
                {stats.mejor && <span className="est-card__nota">Mejor momento: <strong>{stats.mejor}</strong></span>}
              </div>
              {actual.cantidad === 0 ? (
                <p className="est-vacio">No hubo ventas en este período.</p>
              ) : (
                <GraficoBarras datos={stats.serie} buckets={rango.buckets} periodo={periodo} />
              )}
            </div>

            <div className="est-columnas">
              <div className="est-card">
                <div className="est-card__header"><h2>Productos más vendidos</h2></div>
                <ListaBarras items={stats.topProductos} vacio="Sin ventas en este período." />
              </div>
              <div className="est-card">
                <div className="est-card__header"><h2>Métodos de pago</h2></div>
                <ListaBarras items={stats.metodos} vacio="Sin ventas en este período." />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default Estadisticas;
