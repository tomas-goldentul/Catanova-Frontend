import './TarjetaProducto.css';
import { getImagenUrl } from '../../api/helper.js';

const IconoEliminar = () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
 * }} props
 */

function TarjetaProducto({ nombre, talle, stock, precio, imagen, activo, onAgregar, onEliminar }) {
    const datosDistintivos = [];
    if (!activo) datosDistintivos.push(
        {
            tipo: 'no-publicado', label: 'No publicado'
        }
    );
    if (stock < 10) datosDistintivos.push(
        {
            tipo: 'stock-bajo', label: 'Stock bajo'
        }
    );

    return (
        <article className="tarjetaProducto">
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
                        e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22 viewBox=%220 0 200 200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23f0f2f5%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%239ca3af%22 font-size=%2218%22%3ESin%20Imagen%3C/text%3E%3C/svg%3E';
                    }}
                />
            </div>

            <div className="tarjetaProductoContenido">
                <p className="tarjetaProductoNombre">{nombre}</p>
                <p className="tarjetaProductoDatos">{talle} · Stock: {stock} uds.</p>
                <p className="tarjetaProductoPrecio">{precio}</p>

                <div className="tarjetaProductoAcciones">
                    <button className="tarjetaProductoAgregar" onClick={onAgregar}>
                        <IconoMas /> Agregar a tienda
                    </button>
                    <button className="tarjetaProductoEliminar" onClick={onEliminar} aria-label="Eliminar producto">
                        <IconoEliminar />
                    </button>
                </div>
            </div>
        </article>
    );
}

export default TarjetaProducto;