import { useEffect, useState } from 'react';
import Header from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import StatCard from '../StatCard/StatCard';
import TarjetaProducto from '../TarjetaProducto/TarjetaProducto';
import Paginacion from '../Paginacion/Paginacion';
import AgregarProducto from '../AgregarProducto/AgregarProducto';
import FiltroProductos from './FiltroProductos';
import { getTodosLosProductos, updateEstadoProducto } from '../../api/productos';
import './GaleriaProductos.css';

const PRODUCTOS_INICIALES = await getTodosLosProductos()
    .then((data) => {
        const lista = Array.isArray(data)
            ? data
            : data?.productos ?? [];

        return lista.map((producto) => ({
            id: producto.id_producto ?? producto.id ?? producto._id ?? producto.productoId,
            nombre: producto.nombre ?? 'Sin nombre',
            talle: producto.talle ?? producto.talla ?? 'Sin talle',
            stock: Number(producto.stock ?? 0),
            precio: typeof producto.precio === 'number'
                ? `$${producto.precio.toLocaleString('es-AR')}`
                : (typeof producto.precio === 'string'
                    ? `$${Number(producto.precio).toLocaleString('es-AR')}`
                    : '$0'),
            activo: producto.activo ?? producto.estado ?? true,
        }));
    });
 
const PRODUCTOS_POR_PAGINA = 6; //Limite de 6 productos por pagina

const obtenerPrecioNumerico = (precio) => {
    const numero = Number(String(precio).replace(/[^\d.-]/g, ''));
    return Number.isFinite(numero) ? numero : 0;
};
 
const IconoBuscar = () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
 
const IconoFiltrar = () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
    </svg>
);
 
const IconoMas = () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
); //Iconos creados por IA para los iconos
 
function GaleriaProductos() {
    const [productos, setProductos] = useState(PRODUCTOS_INICIALES);
    const [paginaActual, setPaginaActual] = useState(1);
    const [mostrarAgregarProducto, setMostrarAgregarProducto] = useState(false);
    const [mostrarFiltro, setMostrarFiltro] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [soloActivos, setSoloActivos] = useState(false);
    const [orden, setOrden] = useState('todos');

    useEffect(() => {
        if (!mensaje) return undefined;

        const timer = window.setTimeout(() => setMensaje(''), 2500);
        return () => window.clearTimeout(timer);
    }, [mensaje]);
 
    const productosFiltrados = productos
        .filter((productoActual) => {
            const coincideBusqueda = productoActual.nombre.toLowerCase().includes(busqueda.toLowerCase());
            const coincideEstado = !soloActivos || productoActual.activo;
            return coincideBusqueda && coincideEstado;
        })
        .sort((a, b) => {
            if (orden === 'barato') {
                return obtenerPrecioNumerico(a.precio) - obtenerPrecioNumerico(b.precio);
            }
            if (orden === 'caro') {
                return obtenerPrecioNumerico(b.precio) - obtenerPrecioNumerico(a.precio);
            }
            return 0;
        });

    const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA));
    const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
    const productosPagina = productosFiltrados.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);

    const enTienda = productos.filter(productoActual => productoActual.activo).length; //productos en tienda
    const sinPublicar = productos.filter(productoActual => !productoActual.activo).length; //productos que no estan en tienda
    const stockBajo = productos.filter(productoActual => productoActual.stock < 10).length; //productos con stock bajo
 
    const handleEliminar = (id) => {
        setProductos(productosPrevios => productosPrevios.filter(productoActual => productoActual.id !== id)); //Usa el estado previo para eliminar el producto por id
    };
 
    const handleAgregar = async (id) => {
        const producto = productos.find((item) => item.id === id);

        if (!producto) {
            setMensaje('No se encontró el producto.');
            return;
        }

        if (producto.activo) {
            setMensaje('Este producto ya está en la tienda.');
            return;
        }

        try {
            await updateEstadoProducto(id, true);
            setProductos((productosPrevios) =>
                productosPrevios.map((item) =>
                    item.id === id ? { ...item, activo: true } : item
                )
            );
            setMensaje(`"${producto.nombre}" se agregó a la tienda.`);
        } catch (error) {
            setMensaje(error.message || 'No se pudo agregar el producto a la tienda.');
        }
    };

    const handleCrearProducto = (nuevoProducto) => {
        setProductos(productosPrevios => [nuevoProducto, ...productosPrevios]);
        setPaginaActual(1);
        setMostrarAgregarProducto(false);
    };
 
    return (
        <>
            <Header />
            <div className="galeria">
 
                <div className="divBuscarProductos">
                    <h1>Galería de Productos:</h1>
                    <div className="accionesBuscador">
                        
                        <div className="galeriaBuscadorContenedor">
                            <IconoBuscar />
                            <input
                                type="text"
                                className="galeriaBuscador"
                                placeholder="Busca un producto"
                                value={busqueda}
                                onChange={(event) => {
                                    setBusqueda(event.target.value);
                                    setPaginaActual(1);
                                }}
                            />
                        </div>

                        <button
                            className="galeriaFiltrar"
                            onClick={() => {
                                setMostrarFiltro((valorActual) => !valorActual);
                                setPaginaActual(1);
                            }}
                        >
                            <IconoFiltrar /> Filtrar
                        </button>
                        <button
                            className="galeriaCrearNuevoProd"
                            onClick={() => setMostrarAgregarProducto(true)}
                        >
                            <IconoMas /> Nuevo producto
                        </button>
                    </div>
                </div>

                {mostrarAgregarProducto && (
                    <AgregarProducto
                        onCrear={handleCrearProducto}
                        onCancelar={() => setMostrarAgregarProducto(false)}
                    />
                )}

                {mostrarFiltro && (
                    <FiltroProductos
                        orden={orden}
                        onCambiarOrden={(nuevoOrden) => {
                            setOrden(nuevoOrden);
                            setPaginaActual(1);
                        }}
                        soloActivos={soloActivos}
                        onToggleActivos={() => {
                            setSoloActivos((valorActual) => !valorActual);
                            setPaginaActual(1);
                        }}
                        onCerrar={() => setMostrarFiltro(false)}
                    />
                )}

                {mensaje && (
                    <div className="galeriaToast">
                        <p className="galeriaToastTexto">{mensaje}</p>
                    </div>
                )}

                <div className="estadisticasGenerales">
                    <StatCard label="Total productos" value={productosFiltrados.length}/>
                    <StatCard label="En tienda" value={enTienda}/>
                    <StatCard label="Sin publicar" value={sinPublicar}/>
                    <StatCard label="Stock bajo" value={stockBajo}/>
                </div>
 
                <div className="productosOrdenados">
                    {productosPagina.map((producto) => (
                        <TarjetaProducto
                            key={producto.id}
                            {...producto}
                            onAgregar={() => handleAgregar(producto.id)}
                            onEliminar={() => handleEliminar(producto.id)}
                        />
                    ))}
                </div>

                <Paginacion
                    total={totalPaginas}
                    paginaActual={paginaActual}
                    onChange={setPaginaActual}
                />
 
            </div>
            <Footer />
        </>
    );
}
 
export default GaleriaProductos;
