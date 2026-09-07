import { useEffect, useRef, useState } from 'react';
import './TarjetaProducto.css';
import { getImagenUrl, DEFAULT_IMAGE_URL } from '../../api/helper.js';
import { IconoPuntos, IconoLapiz, IconoExterno } from '../Icons/Icons';

const IconoEliminar = () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
    </svg>
);

const IconoMas = () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

/**
 * @param {{
 *   nombre: string,
 *   talle: string,
 *   stock: number,
 *   precio: string,
 *   imagen?: string,
 *   activo: boolean,
 *   onAgregar?: () => void,
 *   onEliminar?: () => void,
 *   onEditar?: () => void,
 *   onVerEnTienda?: () => void,
 * }} props
 */

function TarjetaProducto({ nombre, talle, stock, precio, imagen, activo, onAgregar, onEliminar, onEditar, onVerEnTienda }) {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const cerrarMenu = (evento) => {
            if (menuRef.current && !menuRef.current.contains(evento.target)) {
                setMenuAbierto(false);
            }
        };
        document.addEventListener('mousedown', cerrarMenu);
        return () => document.removeEventListener('mousedown', cerrarMenu);
    }, []);

    const datosDistintivos = [];
    if (!activo) datosDistintivos.push(
        {
            tipo: 'no-publicado', label: 'Sin publicar'
        }
    );
    if (stock < 10) datosDistintivos.push(
        {
            tipo: 'stock-bajo', label: 'Stock bajo'
        }
    );

    return (
        <article className="tarjetaProducto">
            <div className="tarjetaProductoMenuContenedor" ref={menuRef}>
                <button
                    type="button"
                    className="tarjetaProductoMenuBtn"
                    onClick={() => setMenuAbierto((valor) => !valor)}
                    aria-label="Acciones del producto"
                    aria-haspopup="true"
                    aria-expanded={menuAbierto}
                >
                    <IconoPuntos />
                </button>

                {menuAbierto && (
                    <div className="tarjetaProductoMenu" role="menu">
                        <button
                            type="button"
                            role="menuitem"
                            className="tarjetaProductoMenuItem"
                            onClick={() => {
                                setMenuAbierto(false);
                                if (onEditar) onEditar();
                            }}
                        >
                            <IconoLapiz /> Editar
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            className="tarjetaProductoMenuItem tarjetaProductoMenuItem--peligro"
                            onClick={() => {
                                setMenuAbierto(false);
                                if (onEliminar) onEliminar();
                            }}
                        >
                            <IconoEliminar /> Eliminar
                        </button>
                    </div>
                )}
            </div>

            {datosDistintivos.length > 0 && (
                <div className="tarjetaProductoDatosDistintivos">
                    {datosDistintivos.map((dato) => (
                        <span key={dato.tipo} className={`tarjetaProductoDatoD tarjetaProductoDatoD--${dato.tipo}`}>
                            {dato.label}
                        </span>
                    ))}
                </div>
            )}

            <div className="tarjetaProductoImagen">
                <img
                    src={getImagenUrl(imagen)}
                    alt={nombre}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_IMAGE_URL;
                    }}
                />
            </div>

            <div className="tarjetaProductoContenido">
                <p className="tarjetaProductoNombre">{nombre}</p>
                <p className="tarjetaProductoDatos">{talle} · Stock: {stock} uds.</p>
                <p className="tarjetaProductoPrecio">{precio}</p>

                <div className="tarjetaProductoAcciones">
                    {activo ? (
                        <button className="tarjetaProductoVer" onClick={onVerEnTienda}>
                            <IconoExterno /> Ver en tienda
                        </button>
                    ) : (
                        <button className="tarjetaProductoAgregar" onClick={onAgregar}>
                            <IconoMas /> Agregar a tienda
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}

export default TarjetaProducto;