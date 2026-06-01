import { useState } from 'react';
import Header from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import StatCard from '../StatCard/StatCard';
import TarjetaProducto from '../TarjetaProducto/TarjetaProducto';
import Paginacion from '../Paginacion/Paginacion';
import './GaleriaProductos.css';

// Datos de ejemplo para productos
const PRODUCTOS_INICIALES = [
    { id: 1, nombre: 'Remera azul', talle: 'Talle L', stock: 30, precio: '$28.500', activo: true},
    { id: 2, nombre: 'Pantalon slim fit', talle: 'Talle N', stock: 23, precio: '$45.000', activo: false},
    { id: 3, nombre: 'Zapatillas urbanas', talle: 'Talle 40',stock: 14, precio: '$82.000', activo: true},
    { id: 4, nombre: 'Buzo con capucha', talle: 'Talle L', stock: 16, precio: '$55.000', activo: false},
    { id: 5, nombre: 'Campera de cuero', talle: 'Talle M', stock:  6, precio: '$108.000', activo: true},
    { id: 6, nombre: 'Gorra snapback', talle: 'Único',   stock:  8, precio: '$12.000', activo: false},
    { id: 7, nombre: 'Remera verde', talle: 'Talle L', stock: 30, precio: '$28.500', activo: true},
    { id: 8, nombre: 'Pantalon rojo', talle: 'Talle N', stock: 23, precio: '$45.000', activo: false},
    { id: 9, nombre: 'Zapatillas nike', talle: 'Talle 40',stock: 14, precio: '$82.000', activo: true},
    { id: 10, nombre: 'Buzo celeste', talle: 'Talle L', stock: 16, precio: '$55.000', activo: false},
    { id: 11, nombre: 'Campera para el invierno', talle: 'Talle M', stock:  6, precio: '$108.000', activo: true},
    { id: 12, nombre: 'Gorra de beisbol', talle: 'Único',   stock:  8, precio: '$12.000', activo: false},
];
 
const PRODUCTOS_POR_PAGINA = 6; //Limite de 6 productos por pagina
 
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
 
    const totalPaginas = Math.ceil(productos.length / PRODUCTOS_POR_PAGINA);
    const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
    const productosPagina = productos.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);
 
    const enTienda = productos.filter(productoActual => productoActual.activo).length; //productos en tienda
    const sinPublicar = productos.filter(productoActual => !productoActual.activo).length; //productos que no estan en tienda
    const stockBajo = productos.filter(productoActual => productoActual.stock < 10).length; //productos con stock bajo
 
    const handleEliminar = (id) => {
        setProductos(productosPrevios => productosPrevios.filter(productoActual => productoActual.id !== id)); //Usa el estado previo para eliminar el producto por id
    };
 
    const handleAgregar = (id) => {
        // lógica de agregar a tienda; no esta hecho todavia
        console.log('Agregar producto', id);
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
                            <input type="text" className="galeriaBuscador" placeholder="Busca un producto" />
                        </div>

                        <button className="galeriaFiltrar">
                            <IconoFiltrar /> Filtrar
                        </button>
                        <button className="galeriaCrearNuevoProd">
                            <IconoMas /> Nuevo producto
                        </button>
                    </div>
                </div>

                <div className="estadisticasGenerales">
                    <StatCard label="Total productos" value={productos.length}/>
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
