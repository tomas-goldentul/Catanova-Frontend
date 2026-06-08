import './GaleriaProductos.css';

function FiltroProductos({ orden, onCambiarOrden, soloActivos, onToggleActivos, onCerrar }) {
    return (
        <section className="galeriaFiltroPanel">
            <div className="galeriaFiltroHeader">
                <h3>Filtrar productos</h3>
                <button type="button" className="galeriaFiltroCerrar" onClick={onCerrar}>
                    Cerrar
                </button>
            </div>

            <div className="galeriaFiltroOpciones">
                <button
                    type="button"
                    className={orden === 'todos' ? 'galeriaFiltroChip active' : 'galeriaFiltroChip'}
                    onClick={() => onCambiarOrden('todos')}
                >
                    Todos
                </button>
                <button
                    type="button"
                    className={soloActivos ? 'galeriaFiltroChip active' : 'galeriaFiltroChip'}
                    onClick={onToggleActivos}
                >
                    En tienda
                </button>
                <button
                    type="button"
                    className={orden === 'barato' ? 'galeriaFiltroChip active' : 'galeriaFiltroChip'}
                    onClick={() => onCambiarOrden('barato')}
                >
                    Más baratos
                </button>
                <button
                    type="button"
                    className={orden === 'caro' ? 'galeriaFiltroChip active' : 'galeriaFiltroChip'}
                    onClick={() => onCambiarOrden('caro')}
                >
                    Más caros
                </button>
            </div>
        </section>
    );
}

export default FiltroProductos;
