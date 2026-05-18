import './Paginacion.css';

/**
 * @param {{
 *   total: number,
 *   paginaActual: number,
 *   onChange: (pagina: number) => void,
 * }} props
 */
function Paginacion({ total, paginaActual, onChange }) {
    return (
        <nav className="paginacion" aria-label="Paginación">
            {Array.from({ length: total }, (_, i) => i + 1).map((num) => (
                <button
                    key={num}
                    className={`paginacion__btn${paginaActual === num ? ' paginacion__btn--activo' : ''}`}
                    onClick={() => onChange(num)}
                    aria-current={paginaActual === num ? 'page' : undefined}
                >
                    {num}
                </button>
            ))}
            {total > 3 && (
                <span className="paginacion__dots">···</span>
            )}
        </nav>
    );
}

export default Paginacion;