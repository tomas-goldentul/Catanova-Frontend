import { useEffect, useRef, useState } from 'react';
import { FiHome, FiPlus, FiTrash2, FiTruck, FiX } from 'react-icons/fi';
import './CrearPedido.css';

const API_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

const CATALOGO_DEMO = [
  { id: 'p1', nombre: 'Remera oversize negra', talle: 'M', precio: 15000, stock: 12 },
  { id: 'p2', nombre: 'Remera oversize blanca', talle: 'L', precio: 15000, stock: 8 },
  { id: 'p3', nombre: 'Pantalón cargo beige', talle: '40', precio: 32000, stock: 5 },
  { id: 'p4', nombre: 'Buzo oversize gris', talle: 'M', precio: 28000, stock: 10 },
  { id: 'p5', nombre: 'Campera de jean', talle: 'L', precio: 45000, stock: 3 },
  { id: 'p6', nombre: 'Zapatillas urbanas', talle: '42', precio: 52000, stock: 6 },
  { id: 'p7', nombre: 'Gorra bordada', talle: 'Único', precio: 9000, stock: 20 },
];

const PRIORIDADES = ['Sin prioridad', 'Media', 'Alta'];
const ESTADOS_PEDIDO = ['Pendiente', 'Preparando', 'Enviado', 'Entregado'];
const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta'];
const ESTADOS_PAGO = ['Pagado', 'Pendiente de pago'];

function hoyISO() {
  const ahora = new Date();
  const offset = ahora.getTimezoneOffset();
  return new Date(ahora.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function CrearPedido({ onCrear, onCancelar }) {
  const [cliente, setCliente] = useState({ nombre: '', telefono: '' });
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState('');
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [entrega, setEntrega] = useState('local');
  const [direccionEnvio, setDireccionEnvio] = useState({ direccion: '', localidad: '', codigoPostal: '' });

  const [productoCatalogoId, setProductoCatalogoId] = useState(CATALOGO_DEMO[0].id);
  const [cantidadCatalogo, setCantidadCatalogo] = useState(1);
  const [itemManual, setItemManual] = useState({ nombre: '', precio: '', cantidad: 1 });
  const [mostrarItemManual, setMostrarItemManual] = useState(false);

  const [items, setItems] = useState([]);
  const [fecha, setFecha] = useState(() => hoyISO());
  const [prioridad, setPrioridad] = useState('Sin prioridad');
  const [estadoPedido, setEstadoPedido] = useState('Pendiente');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [estadoPago, setEstadoPago] = useState('Pagado');
  const [notas, setNotas] = useState('');

  const [errores, setErrores] = useState({});

  const contadorIdRef = useRef(0);
  const generarId = (prefijo) => {
    contadorIdRef.current += 1;
    return `${prefijo}-${contadorIdRef.current}`;
  };

  const limpiarError = (campo) => setErrores((previos) => ({ ...previos, [campo]: '' }));

  const actualizarCliente = (campo, valor) => {
    setCliente((previo) => ({ ...previo, [campo]: valor }));
    limpiarError(campo);
  };

  const manejarCambioUsuario = (event) => {
    const selectedId = event.target.value;
    setUsuarioSeleccionadoId(selectedId);

    if (!selectedId) {
      setCliente({ nombre: '', telefono: '' });
      limpiarError('nombre');
      limpiarError('telefono');
      return;
    }

    const usuarioSeleccionado = usuarios.find((usuario) => Number(usuario.id_usuario) === Number(selectedId));
    const nombreCompleto = usuarioSeleccionado ? `${usuarioSeleccionado.nombre || ''} ${usuarioSeleccionado.apellido || ''}`.trim() : '';

    setCliente({
      nombre: nombreCompleto,
      telefono: usuarioSeleccionado?.telefono || '',
    });

    limpiarError('nombre');
    limpiarError('telefono');
  };

  useEffect(() => {
    const cargarUsuarios = async () => {
      setCargandoUsuarios(true);
      try {
        const response = await fetch(`${API_URL}/usuarios`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar los usuarios');
        }

        const data = await response.json();
        setUsuarios(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        setUsuarios([]);
      } finally {
        setCargandoUsuarios(false);
      }
    };

    cargarUsuarios();
  }, []);

  const actualizarDireccionEnvio = (campo, valor) => {
    setDireccionEnvio((previo) => ({ ...previo, [campo]: valor }));
    limpiarError('direccion');
  };

  const agregarDesdeCatalogo = () => {
    const producto = CATALOGO_DEMO.find((item) => item.id === productoCatalogoId);
    const cantidad = Number(cantidadCatalogo);

    if (!producto || !cantidad || cantidad <= 0) {
      setErrores((previos) => ({ ...previos, itemCatalogo: 'Elegí un producto y una cantidad válida.' }));
      return;
    }

    setItems((previos) => {
      const existente = previos.find((item) => item.origenId === producto.id);
      if (existente) {
        return previos.map((item) =>
          item.origenId === producto.id ? { ...item, cantidad: item.cantidad + cantidad } : item,
        );
      }
      return [
        ...previos,
        {
          id: `catalogo-${producto.id}`,
          origenId: producto.id,
          nombre: `${producto.nombre} (${producto.talle})`,
          precio: producto.precio,
          cantidad,
        },
      ];
    });

    setCantidadCatalogo(1);
    limpiarError('itemCatalogo');
    limpiarError('items');
  };

  const agregarItemManual = () => {
    const nuevosErrores = {};
    if (!itemManual.nombre.trim()) nuevosErrores.itemManualNombre = 'Ingresá un nombre.';
    if (!itemManual.precio || Number(itemManual.precio) <= 0) nuevosErrores.itemManualPrecio = 'Ingresá un precio válido.';

    if (Object.keys(nuevosErrores).length) {
      setErrores((previos) => ({ ...previos, ...nuevosErrores }));
      return;
    }

    setItems((previos) => [
      ...previos,
      {
        id: generarId('manual'),
        origenId: null,
        nombre: itemManual.nombre.trim(),
        precio: Number(itemManual.precio),
        cantidad: Number(itemManual.cantidad) || 1,
      },
    ]);

    setItemManual({ nombre: '', precio: '', cantidad: 1 });
    setErrores((previos) => ({ ...previos, itemManualNombre: '', itemManualPrecio: '', items: '' }));
  };

  const quitarItem = (id) => {
    setItems((previos) => previos.filter((item) => item.id !== id));
  };

  const actualizarCantidadItem = (id, cantidad) => {
    const valor = Math.max(1, Number(cantidad) || 1);
    setItems((previos) => previos.map((item) => (item.id === id ? { ...item, cantidad: valor } : item)));
  };

  const total = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!cliente.nombre.trim()) nuevosErrores.nombre = 'Seleccioná un usuario.';
    if (!cliente.telefono.trim()) nuevosErrores.telefono = 'El usuario seleccionado no tiene teléfono.';
    if (entrega === 'envio' && !direccionEnvio.direccion.trim()) {
      nuevosErrores.direccion = 'Ingresá la dirección de envío.';
    }
    if (items.length === 0) nuevosErrores.items = 'Agregá al menos un producto al pedido.';

    setErrores((previos) => ({ ...previos, ...nuevosErrores }));
    return Object.keys(nuevosErrores).length === 0;
  };

  const crearPedido = (event) => {
    event.preventDefault();
    if (!validarFormulario()) return;

    const idUsuario = Number(usuarioSeleccionadoId);
    const direccionPedido = entrega === 'envio'
      ? [direccionEnvio.direccion.trim(), direccionEnvio.localidad.trim(), direccionEnvio.codigoPostal.trim()].filter(Boolean).join(', ')
      : 'Retira en el local';

    const nuevoPedido = {
      id: generarId('PED'),
      id_usuario: Number.isFinite(idUsuario) && idUsuario > 0 ? idUsuario : null,
      cliente: {
        nombre: cliente.nombre.trim(),
        telefono: cliente.telefono.trim(),
      },
      clienteNombre: cliente.nombre.trim(),
      clienteTelefono: cliente.telefono.trim(),
      direccion: direccionPedido,
      metodo_pago: metodoPago.toLowerCase(),
      metodoPago: metodoPago,
      productos: items.map(({ nombre, cantidad, precio }) => ({ nombre, cantidad, precio })),
      precio_total: total,
      fecha: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
      prioridad,
      estado: estadoPedido,
      pago: estadoPago,
      notas: notas.trim(),
      origenManual: true,
    };

    onCrear(nuevoPedido);
  };

  return (
    <section className="crear-pedido" aria-labelledby="crearPedidoTitulo">
      <div className="crear-pedido-header">
        <div>
          <span className="crear-pedido-eyebrow">Pedidos</span>
          <h2 id="crearPedidoTitulo">Crear pedido manual</h2>
          <p>Cargá una venta que se registró por fuera de la tienda (WhatsApp, en persona, etc.).</p>
        </div>
        <button type="button" className="crear-pedido-cerrar" onClick={onCancelar} aria-label="Cerrar formulario">
          <FiX aria-hidden="true" />
        </button>
      </div>

      <form className="crear-pedido-contenido" onSubmit={crearPedido}>
        <fieldset className="crear-pedido-seccion">
          <legend>Cliente</legend>
          <div className="crear-pedido-grid">
            <div className="crear-pedido-campo">
              <label htmlFor="usuarioSelect">Usuario</label>
              <select id="usuarioSelect" value={usuarioSeleccionadoId} onChange={manejarCambioUsuario}>
                <option value="">Seleccioná un usuario</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id_usuario} value={usuario.id_usuario}>
                    {`${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Usuario sin nombre'}
                  </option>
                ))}
              </select>
              {cargandoUsuarios && <span className="crear-pedido-cargando">Cargando usuarios...</span>}
              {errores.nombre && <span className="crear-pedido-error">{errores.nombre}</span>}
            </div>

            <div className="crear-pedido-campo">
              <label htmlFor="clienteTelefono">Teléfono / WhatsApp</label>
              <input
                id="clienteTelefono"
                type="tel"
                placeholder="Ej: 11 2345 6789"
                value={cliente.telefono}
                onChange={(event) => actualizarCliente('telefono', event.target.value)}
              />
              {errores.telefono && <span className="crear-pedido-error">{errores.telefono}</span>}
            </div>
          </div>
        </fieldset>

        <fieldset className="crear-pedido-seccion">
          <legend>Entrega</legend>
          <div className="crear-pedido-entrega-switch">
            <button
              type="button"
              className={entrega === 'local' ? 'active' : ''}
              onClick={() => setEntrega('local')}
            >
              <FiHome aria-hidden="true" />
              Retira en el local
            </button>
            <button
              type="button"
              className={entrega === 'envio' ? 'active' : ''}
              onClick={() => setEntrega('envio')}
            >
              <FiTruck aria-hidden="true" />
              Envío a domicilio
            </button>
          </div>

          {entrega === 'envio' && (
            <div className="crear-pedido-grid crear-pedido-grid--envio">
              <div className="crear-pedido-campo crear-pedido-campo--doble">
                <label htmlFor="envioDireccion">Dirección</label>
                <input
                  id="envioDireccion"
                  type="text"
                  placeholder="Calle y número"
                  value={direccionEnvio.direccion}
                  onChange={(event) => actualizarDireccionEnvio('direccion', event.target.value)}
                />
                {errores.direccion && <span className="crear-pedido-error">{errores.direccion}</span>}
              </div>

              <div className="crear-pedido-campo">
                <label htmlFor="envioLocalidad">Localidad</label>
                <input
                  id="envioLocalidad"
                  type="text"
                  placeholder="Ej: San Isidro"
                  value={direccionEnvio.localidad}
                  onChange={(event) => actualizarDireccionEnvio('localidad', event.target.value)}
                />
              </div>

              <div className="crear-pedido-campo">
                <label htmlFor="envioCodigoPostal">Código postal</label>
                <input
                  id="envioCodigoPostal"
                  type="text"
                  placeholder="Ej: 1642"
                  value={direccionEnvio.codigoPostal}
                  onChange={(event) => actualizarDireccionEnvio('codigoPostal', event.target.value)}
                />
              </div>
            </div>
          )}
        </fieldset>

        <fieldset className="crear-pedido-seccion">
          <legend>Productos</legend>

          <div className="crear-pedido-selector-producto">
            <div className="crear-pedido-campo crear-pedido-campo--doble">
              <label htmlFor="catalogoProducto">Producto del catálogo</label>
              <select
                id="catalogoProducto"
                value={productoCatalogoId}
                onChange={(event) => setProductoCatalogoId(event.target.value)}
              >
                {CATALOGO_DEMO.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} · Talle {producto.talle} · {formatearPrecio(producto.precio)} · Stock {producto.stock}
                  </option>
                ))}
              </select>
            </div>

            <div className="crear-pedido-campo crear-pedido-campo--cantidad">
              <label htmlFor="catalogoCantidad">Cantidad</label>
              <input
                id="catalogoCantidad"
                type="number"
                min="1"
                value={cantidadCatalogo}
                onChange={(event) => setCantidadCatalogo(event.target.value)}
              />
            </div>

            <button type="button" className="crear-pedido-agregar-btn" onClick={agregarDesdeCatalogo}>
              <FiPlus aria-hidden="true" />
              Agregar
            </button>
          </div>
          {errores.itemCatalogo && <span className="crear-pedido-error">{errores.itemCatalogo}</span>}

          <button
            type="button"
            className="crear-pedido-toggle-manual"
            onClick={() => setMostrarItemManual((actual) => !actual)}
          >
            {mostrarItemManual ? 'Ocultar ítem manual' : '¿Vendiste algo fuera del catálogo? Agregalo acá'}
          </button>

          {mostrarItemManual && (
            <div className="crear-pedido-selector-producto crear-pedido-selector-producto--manual">
              <div className="crear-pedido-campo crear-pedido-campo--doble">
                <label htmlFor="manualNombre">Nombre del ítem</label>
                <input
                  id="manualNombre"
                  type="text"
                  placeholder="Ej: Bufanda tejida a mano"
                  value={itemManual.nombre}
                  onChange={(event) => {
                    setItemManual((previo) => ({ ...previo, nombre: event.target.value }));
                    limpiarError('itemManualNombre');
                  }}
                />
                {errores.itemManualNombre && <span className="crear-pedido-error">{errores.itemManualNombre}</span>}
              </div>

              <div className="crear-pedido-campo">
                <label htmlFor="manualPrecio">Precio unitario</label>
                <input
                  id="manualPrecio"
                  type="number"
                  min="0"
                  placeholder="10000"
                  value={itemManual.precio}
                  onChange={(event) => {
                    setItemManual((previo) => ({ ...previo, precio: event.target.value }));
                    limpiarError('itemManualPrecio');
                  }}
                />
                {errores.itemManualPrecio && <span className="crear-pedido-error">{errores.itemManualPrecio}</span>}
              </div>

              <div className="crear-pedido-campo crear-pedido-campo--cantidad">
                <label htmlFor="manualCantidad">Cantidad</label>
                <input
                  id="manualCantidad"
                  type="number"
                  min="1"
                  value={itemManual.cantidad}
                  onChange={(event) => setItemManual((previo) => ({ ...previo, cantidad: event.target.value }))}
                />
              </div>

              <button type="button" className="crear-pedido-agregar-btn" onClick={agregarItemManual}>
                <FiPlus aria-hidden="true" />
                Agregar
              </button>
            </div>
          )}

          {errores.items && <span className="crear-pedido-error">{errores.items}</span>}

          <div className="crear-pedido-tabla-wrap">
            <table className="crear-pedido-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio unitario</th>
                  <th>Subtotal</th>
                  <th aria-label="Quitar" />
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="crear-pedido-tabla-vacia">
                      Todavía no agregaste productos.
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nombre}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(event) => actualizarCantidadItem(item.id, event.target.value)}
                      />
                    </td>
                    <td>{formatearPrecio(item.precio)}</td>
                    <td>{formatearPrecio(item.precio * item.cantidad)}</td>
                    <td>
                      <button
                        type="button"
                        className="crear-pedido-quitar-item"
                        onClick={() => quitarItem(item.id)}
                        aria-label={`Quitar ${item.nombre}`}
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="crear-pedido-total">
            <span>Total del pedido</span>
            <strong>{formatearPrecio(total)}</strong>
          </div>
        </fieldset>

        <fieldset className="crear-pedido-seccion">
          <legend>Detalles del pedido</legend>
          <div className="crear-pedido-grid crear-pedido-grid--detalles">
            <div className="crear-pedido-campo">
              <label htmlFor="pedidoFecha">Fecha</label>
              <input id="pedidoFecha" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
            </div>

            <div className="crear-pedido-campo">
              <label htmlFor="pedidoPrioridad">Prioridad</label>
              <select id="pedidoPrioridad" value={prioridad} onChange={(event) => setPrioridad(event.target.value)}>
                {PRIORIDADES.map((opcion) => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
            </div>

            <div className="crear-pedido-campo">
              <label htmlFor="pedidoEstado">Estado inicial</label>
              <select id="pedidoEstado" value={estadoPedido} onChange={(event) => setEstadoPedido(event.target.value)}>
                {ESTADOS_PEDIDO.map((opcion) => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
            </div>

            <div className="crear-pedido-campo">
              <label htmlFor="pedidoMetodoPago">Método de pago</label>
              <select id="pedidoMetodoPago" value={metodoPago} onChange={(event) => setMetodoPago(event.target.value)}>
                {METODOS_PAGO.map((opcion) => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
            </div>

            <div className="crear-pedido-campo">
              <label htmlFor="pedidoEstadoPago">Estado de pago</label>
              <select id="pedidoEstadoPago" value={estadoPago} onChange={(event) => setEstadoPago(event.target.value)}>
                {ESTADOS_PAGO.map((opcion) => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="crear-pedido-campo crear-pedido-campo--doble">
            <label htmlFor="pedidoNotas">Notas internas</label>
            <textarea
              id="pedidoNotas"
              rows="3"
              placeholder="Ej: Pagó por transferencia a nombre de..."
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
            />
          </div>
        </fieldset>

        <div className="crear-pedido-acciones">
          <button type="button" className="crear-pedido-btn-secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="crear-pedido-btn-principal">
            Crear pedido
          </button>
        </div>
      </form>
    </section>
  );
}

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

export default CrearPedido;
