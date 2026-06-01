import './TarjetaProducto.css';

const IconoImagen = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9l4-4 4 4 4-4 4 4" />
        <circle cx="8.5" cy="13.5" r="1.5" />
    </svg>
);

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
 *   activo: boolean,
 *   onAgregar?: () => void,
 *   onEliminar?: () => void,
 * }} props
 */

function TarjetaProducto({ nombre, talle, stock, precio, activo, onAgregar, onEliminar }) {
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
        <>
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
                    <IconoImagen />
                    <span>Imagen</span>
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
        </>
    );
}

export default TarjetaProducto;
