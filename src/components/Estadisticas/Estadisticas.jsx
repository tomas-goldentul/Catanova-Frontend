import { useEffect, useRef, useState } from 'react';
import { FiArrowRight, FiChevronLeft, FiRefreshCw, FiZap } from 'react-icons/fi';
import { getEstadisticasTienda, getLecturaEstadisticas } from '../../api/estadisticas';
import { getImagenUrl, DEFAULT_IMAGE_URL } from '../../api/helper';
import './Estadisticas.css';

// Todo se muestra en hora de Argentina, igual que calcula el back, sin importar la zona del navegador.
const ZONA = 'America/Argentina/Buenos_Aires';

const PERIODOS = [
  { id: 'hoy', label: 'Hoy', comparacion: 'ayer a esta hora', eje: 'por hora' },
  { id: 'semana', label: 'Esta semana', comparacion: 'misma altura de la semana pasada', eje: 'por día' },
  { id: 'mes', label: 'Este mes', comparacion: 'misma altura del mes pasado', eje: 'por día' },
];

// Estados reales de un pedido en la base ("Cancelado" no existe en el back).
const ESTADOS_PEDIDO = ['Pendiente', 'En preparación', 'Enviado', 'Entregado'];

// ——— Formato ———

const fmtMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const fmtNumero = new Intl.NumberFormat('es-AR');

const formatPrecio = (valor) => fmtMoneda.format(Number(valor) || 0);
const formatNumero = (valor) => fmtNumero.format(Number(valor) || 0);

function formatPrecioCompacto(valor) {
  const n = Number(valor) || 0;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `$${(n / 1_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}k`;
  return `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

// "2026-11-09" → Date al mediodía UTC (cae el mismo día en Argentina, sin corrimientos).
function fechaDeClave(clave) {
  const [y, m, d] = clave.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

const fmtFecha = (fecha, opciones) => fecha.toLocaleString('es-AR', { timeZone: ZONA, ...opciones });

function etiquetasBalde(periodo, clave) {
  if (periodo === 'hoy') {
    return { corta: `${clave}h`, larga: `${clave}:00 a ${clave}:59 h` };
  }
  const fecha = fechaDeClave(clave);
  const larga = fmtFecha(fecha, { weekday: 'long', day: 'numeric', month: 'long' });
  if (periodo === 'semana') {
    const dia = fmtFecha(fecha, { weekday: 'short' }).replace('.', '');
    return { corta: `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${fecha.getUTCDate()}`, larga };
  }
  return { corta: String(fecha.getUTCDate()), larga };
}

// Texto que explica qué rango se está mirando y contra qué se compara.
function describirRango(periodo, rango) {
  if (!rango?.desde || !rango?.hasta) return '';
  const desde = new Date(rango.desde);
  const hasta = new Date(rango.hasta);
  const hora = fmtFecha(hasta, { hour: '2-digit', minute: '2-digit', hour12: false });
  if (periodo === 'hoy') {
    return `${fmtFecha(hasta, { weekday: 'long', day: 'numeric', month: 'long' })}, hasta las ${hora} h`;
  }
  const inicio = fmtFecha(desde, { weekday: periodo === 'semana' ? 'long' : undefined, day: 'numeric', month: 'long' })
    .replace(',', '');
  return `Del ${inicio} a hoy, hasta las ${hora} h`;
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

// ——— Subcomponentes ———

function Variacion({ valor, actual }) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    // El back manda null cuando el período anterior fue 0.
    return actual > 0
      ? <span className="est-cambio est-cambio--neutro">Nuevo</span>
      : <span className="est-cambio est-cambio--neutro">—</span>;
  }
  const n = Number(valor);
  const clase = n > 0 ? 'positivo' : n < 0 ? 'negativo' : 'neutro';
  const signo = n > 0 ? '▲ ' : n < 0 ? '▼ ' : '';
  const texto = Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: 1 });
  return <span className={`est-cambio est-cambio--${clase}`}>{signo}{texto}%</span>;
}

function Kpi({ label, value, variacion, actual, comparacion, nota }) {
  return (
    <div className="est-kpi">
      <span className="est-kpi__label">{label}</span>
      <strong className="est-kpi__value">{value}</strong>
      <span className="est-kpi__comparacion">
        {nota ?? (
          <>
            <Variacion valor={variacion} actual={actual} />
            <span>vs. {comparacion}</span>
          </>
        )}
      </span>
    </div>
  );
}

function GraficoBarras({ serie, periodo }) {
  const [activo, setActivo] = useState(null);
  const max = Math.max(0, ...serie.map((d) => d.facturado));
  const techo = techoEje(max);
  const lineas = [4, 3, 2, 1, 0].map((i) => (techo / 4) * i);
  // En el mes y en el día mostramos etiqueta cada tantos baldes para que no se pisen.
  const cadaCuanto = periodo === 'mes' ? 5 : periodo === 'hoy' ? 3 : 1;

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
          {serie.map((d, i) => {
            const { corta, larga } = etiquetasBalde(periodo, d.clave);
            const alto = (d.facturado / techo) * 100;
            const mostrarEtiqueta = i % cadaCuanto === 0 || (periodo === 'mes' && i === serie.length - 1);
            const esActivo = activo === i && !d.futuro;
            return (
              <div
                key={d.clave}
                className={`est-chart__col${esActivo ? ' is-activa' : ''}${d.futuro ? ' is-futuro' : ''}`}
                onMouseEnter={() => setActivo(i)}
                onFocus={() => setActivo(i)}
                onBlur={() => setActivo(null)}
                tabIndex={d.futuro ? -1 : 0}
                aria-label={d.futuro ? `${larga}: todavía no pasó` : `${larga}: ${formatPrecio(d.facturado)}, ${d.ventas} ventas`}
              >
                {!d.futuro && d.facturado > 0 && (
                  <div className="est-chart__barra" style={{ height: `${Math.max(alto, 1.5)}%` }} />
                )}
                <span className="est-chart__label-x">{mostrarEtiqueta ? corta : ''}</span>

                {esActivo && (
                  <div className={`est-tooltip${i > serie.length * 0.7 ? ' est-tooltip--izq' : i < serie.length * 0.2 ? ' est-tooltip--der' : ''}`} role="tooltip">
                    <span className="est-tooltip__titulo">{larga}</span>
                    <span><strong>{formatPrecio(d.facturado)}</strong> facturado</span>
                    <span>
                      {d.ventas} {d.ventas === 1 ? 'venta' : 'ventas'} · {d.unidades} {d.unidades === 1 ? 'unidad' : 'unidades'}
                    </span>
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

function ListaProductos({ items, vacio, mostrarBarra }) {
  if (!items.length) return <p className="est-vacio-mini">{vacio}</p>;
  const max = Math.max(1, ...items.map((p) => p.unidades));
  return (
    <ul className="est-productos">
      {items.map((p, i) => (
        <li key={p.id_producto} className="est-producto">
          <span className="est-producto__pos">{i + 1}</span>
          <img
            className="est-producto__img"
            src={getImagenUrl(p.imagen)}
            alt=""
            loading="lazy"
            onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE_URL; }}
          />
          <div className="est-producto__info">
            <div className="est-producto__fila">
              <span className="est-producto__nombre" title={p.nombre}>{p.nombre}</span>
              <span className="est-producto__valor">
                {formatNumero(p.unidades)} {p.unidades === 1 ? 'unidad' : 'unidades'}
              </span>
            </div>
            {mostrarBarra ? (
              <div className="est-producto__track">
                <div className="est-producto__fill" style={{ width: `${(p.unidades / max) * 100}%` }} />
              </div>
            ) : null}
            <span className="est-producto__sub">
              {p.unidades > 0 ? `${formatPrecio(p.facturado)} facturado` : 'Sin ventas en el período'}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TarjetaPedidos({ pedidos, resumen, comparacion, onIrAPedidos }) {
  const { total, por_estado: porEstado = {}, facturado_pedidos: facPedidos, facturado_manual: facManual } = pedidos;
  const pctPedidos = Number(pedidos.porcentaje_pedidos) || 0;
  const pctManual = Number(pedidos.porcentaje_manual) || 0;
  const hayFacturacion = facPedidos + facManual > 0;

  return (
    <div className="est-card est-pedidos">
      <div className="est-card__header">
        <h2>Pedidos</h2>
        {onIrAPedidos && (
          <button type="button" className="est-link" onClick={onIrAPedidos}>
            Ver pedidos <FiArrowRight aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="est-pedidos__total">
        <strong>{formatNumero(total)}</strong>
        <span>{total === 1 ? 'pedido recibido' : 'pedidos recibidos'}</span>
        <span className="est-kpi__comparacion">
          <Variacion valor={resumen.variacion?.pedidos} actual={resumen.actual?.pedidos} />
          <span>vs. {comparacion}</span>
        </span>
      </div>

      {total > 0 && (
        <ul className="est-estados">
          {ESTADOS_PEDIDO.map((estado) => (
            <li key={estado} className={`est-estado est-estado--${estado.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').toLowerCase()}`}>
              <span>{estado}</span>
              <strong>{formatNumero(porEstado[estado])}</strong>
            </li>
          ))}
        </ul>
      )}

      <div className="est-origen">
        <span className="est-origen__titulo">¿De dónde viene lo facturado?</span>
        {hayFacturacion ? (
          <>
            <div className="est-origen__barra" role="img" aria-label={`Pedidos ${pctPedidos}%, ventas manuales ${pctManual}%`}>
              {pctPedidos > 0 && <span className="est-origen__seg est-origen__seg--pedidos" style={{ width: `${pctPedidos}%` }} />}
              {pctManual > 0 && <span className="est-origen__seg est-origen__seg--manual" style={{ width: `${pctManual}%` }} />}
            </div>
            <div className="est-origen__leyenda">
              <span>
                <i className="est-origen__dot est-origen__dot--pedidos" />
                Pedidos <strong>{pctPedidos.toLocaleString('es-AR')}%</strong>
                <small>{formatPrecio(facPedidos)}</small>
              </span>
              <span>
                <i className="est-origen__dot est-origen__dot--manual" />
                Ventas manuales <strong>{pctManual.toLocaleString('es-AR')}%</strong>
                <small>{formatPrecio(facManual)}</small>
              </span>
            </div>
          </>
        ) : (
          <p className="est-vacio-mini">Todavía no hay facturación en este período.</p>
        )}
      </div>
    </div>
  );
}

function TarjetaLectura({ estado, onReintentar }) {
  // Si la IA no está configurada (503) o falla, el bloque no se muestra.
  if (estado.oculto) return null;
  return (
    <div className="est-card est-lectura" aria-live="polite">
      <div className="est-card__header">
        <h2><FiZap aria-hidden="true" /> Lectura del período</h2>
        <span className="est-lectura__badge">Generado con IA</span>
      </div>
      {estado.cargando && (
        <div className="est-lectura__skeleton" aria-label="Generando lectura">
          <span /><span /><span />
        </div>
      )}
      {!estado.cargando && estado.error && (
        <p className="est-vacio-mini">
          No se pudo generar la lectura.{' '}
          <button type="button" className="est-link" onClick={onReintentar}>Reintentar</button>
        </p>
      )}
      {!estado.cargando && estado.texto && <p className="est-lectura__texto">{estado.texto}</p>}
    </div>
  );
}

// ——— Componente principal ———

function Estadisticas({ onVolver, onIrAPedidos }) {
  const idTienda = Number(localStorage.getItem('id_tienda')) || null;

  const [periodo, setPeriodo] = useState('hoy');
  // Guardamos cada período ya cargado para que cambiar de solapa sea instantáneo.
  const [datos, setDatos] = useState({});
  const [errores, setErrores] = useState({});
  const [recarga, setRecarga] = useState(0);
  const [lecturas, setLecturas] = useState({});
  const [intentoLectura, setIntentoLectura] = useState(0);
  const lecturasPedidas = useRef(new Set());
  // Sube con cada "Actualizar" para descartar lecturas que llegan tarde de una carga anterior.
  const generacion = useRef(0);

  const stats = datos[periodo];
  const error = !idTienda ? 'No se encontró la tienda. Por favor iniciá sesión nuevamente.' : errores[periodo];
  const cargando = Boolean(idTienda) && !stats && !error;
  const infoPeriodo = PERIODOS.find((p) => p.id === periodo);

  // Estadísticas del período elegido.
  useEffect(() => {
    if (!idTienda || datos[periodo]) return undefined;
    const controller = new AbortController();
    getEstadisticasTienda(idTienda, periodo, controller.signal)
      .then((data) => {
        setDatos((prev) => ({ ...prev, [periodo]: data }));
        setErrores((prev) => ({ ...prev, [periodo]: '' }));
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        const mensaje = err.status === 403
          ? 'No tenés permiso para ver las estadísticas de esta tienda.'
          : err.message || 'No se pudieron cargar las estadísticas.';
        setErrores((prev) => ({ ...prev, [periodo]: mensaje }));
      });
    return () => controller.abort();
  }, [idTienda, periodo, datos, recarga]);

  // Lectura con IA: se pide aparte (puede tardar) y una sola vez por período.
  useEffect(() => {
    if (!idTienda || !stats || lecturasPedidas.current.has(periodo)) return;
    lecturasPedidas.current.add(periodo);
    const p = periodo;
    const gen = generacion.current;
    const guardar = (valor) => {
      if (gen === generacion.current) setLecturas((prev) => ({ ...prev, [p]: valor }));
    };
    getLecturaEstadisticas(idTienda, p)
      .then((data) => {
        const texto = String(data?.texto ?? '').trim();
        guardar(texto ? { texto } : { oculto: true });
      })
      .catch((err) => {
        // 503 = IA no configurada en el servidor: directamente no mostramos el bloque.
        const oculto = err.status === 503 || err.status === 401 || err.status === 403;
        guardar(oculto ? { oculto: true } : { error: true });
      });
  }, [idTienda, periodo, stats, intentoLectura]);

  const reintentarLectura = () => {
    lecturasPedidas.current.delete(periodo);
    setLecturas((prev) => ({ ...prev, [periodo]: undefined }));
    setIntentoLectura((n) => n + 1);
  };

  const actualizar = () => {
    generacion.current += 1;
    lecturasPedidas.current.clear();
    setLecturas({});
    setErrores({});
    setDatos({});
    setRecarga((n) => n + 1);
  };

  const resumen = stats?.resumen;
  const actual = resumen?.actual ?? {};
  const serie = stats?.serie ?? [];
  const mejorBalde = serie.reduce((best, d) => (d.facturado > (best?.facturado ?? 0) ? d : best), null);
  const sinVentas = !actual.ventas && !actual.facturado;
  const ticket = actual.ventas ? actual.facturado / actual.ventas : 0;

  return (
    <section className="est-page">
      <div className="est-shell">
        <header className="est-header">
          <div className="est-heading">
            {onVolver && (
              <button type="button" className="est-back" onClick={onVolver}>
                <FiChevronLeft aria-hidden="true" />
                Volver
              </button>
            )}
            <span className="est-kicker">Panel del vendedor</span>
            <h1>Estadísticas</h1>
            <p>Cómo le va a tu tienda, con datos en tiempo real.</p>
          </div>
        </header>

        <div className="est-filtros">
          <div className="est-segmento" role="tablist" aria-label="Período">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={periodo === p.id}
                className={`est-segmento__btn${periodo === p.id ? ' is-activo' : ''}`}
                onClick={() => setPeriodo(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="est-rango">
            {stats && <span>{describirRango(periodo, stats.rango)}</span>}
            <button type="button" className="est-refresh" onClick={actualizar} disabled={cargando} aria-label="Actualizar datos" title="Actualizar datos">
              <FiRefreshCw aria-hidden="true" className={cargando ? 'is-girando' : ''} />
            </button>
          </div>
        </div>

        {error && (
          <div className="est-msg est-msg--error" role="alert">
            <p>{error}</p>
            {idTienda && <button type="button" className="est-link" onClick={actualizar}>Reintentar</button>}
          </div>
        )}

        {cargando && (
          <div className="est-skeleton" aria-label="Cargando estadísticas">
            <div className="est-kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="est-kpi est-skeleton__bloque" />)}</div>
            <div className="est-card est-skeleton__bloque est-skeleton__bloque--alto" />
          </div>
        )}

        {stats && !error && (
          <>
            <div className="est-kpis">
              <Kpi
                label="Facturado"
                value={formatPrecio(actual.facturado)}
                variacion={resumen.variacion?.facturado}
                actual={actual.facturado}
                comparacion={infoPeriodo.comparacion}
              />
              <Kpi
                label="Ventas"
                value={formatNumero(actual.ventas)}
                variacion={resumen.variacion?.ventas}
                actual={actual.ventas}
                comparacion={infoPeriodo.comparacion}
              />
              <Kpi
                label="Unidades vendidas"
                value={formatNumero(actual.unidades)}
                variacion={resumen.variacion?.unidades}
                actual={actual.unidades}
                comparacion={infoPeriodo.comparacion}
              />
              {actual.vistas === null || actual.vistas === undefined ? (
                <Kpi label="Vistas de productos" value="—" nota={<span>No disponible por ahora</span>} />
              ) : (
                <Kpi
                  label="Vistas de productos"
                  value={formatNumero(actual.vistas)}
                  variacion={resumen.variacion?.vistas}
                  actual={actual.vistas}
                  comparacion={infoPeriodo.comparacion}
                />
              )}
            </div>

            <div className="est-card">
              <div className="est-card__header">
                <h2>Facturación {infoPeriodo.eje}</h2>
                {!sinVentas && (
                  <span className="est-card__nota">
                    Ticket promedio <strong>{formatPrecio(ticket)}</strong>
                    {mejorBalde && (
                      <> · Mejor momento <strong>{etiquetasBalde(periodo, mejorBalde.clave).larga}</strong></>
                    )}
                  </span>
                )}
              </div>
              {sinVentas ? (
                <p className="est-vacio">Todavía no hubo ventas en este período.</p>
              ) : (
                <GraficoBarras serie={serie} periodo={periodo} />
              )}
            </div>

            <TarjetaLectura estado={lecturas[periodo] ?? { cargando: true }} onReintentar={reintentarLectura} />

            <div className="est-columnas">
              <div className="est-card">
                <div className="est-card__header"><h2>Más vendidos</h2></div>
                <ListaProductos items={stats.top_productos ?? []} vacio="Sin ventas en este período." mostrarBarra />
              </div>
              <div className="est-card">
                <div className="est-card__header">
                  <h2>Menos vendidos</h2>
                  <span className="est-card__nota">Productos activos</span>
                </div>
                <ListaProductos
                  items={stats.menos_vendidos ?? []}
                  vacio="Todos tus productos activos ya aparecen entre los más vendidos."
                />
              </div>
            </div>

            <TarjetaPedidos
              pedidos={stats.pedidos}
              resumen={resumen}
              comparacion={infoPeriodo.comparacion}
              onIrAPedidos={onIrAPedidos}
            />
          </>
        )}
      </div>
    </section>
  );
}

export default Estadisticas;
