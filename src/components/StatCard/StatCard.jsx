import './StatCard.css';
import { IconoTendenciaArriba, IconoTendenciaAbajo } from '../Icons/Icons';

function StatCard({ label, value, icono: Icono, color, tendencia, tendenciaPositiva = true }) {
    return (
        <div className="cartaEstadistica" style={{ '--stat-color': color || '#00c9a7' }}>
            <div className="cartaEstadisticaEncabezado">
                <span className="cartaEstadisticaIcono">
                    {Icono && <Icono />}
                </span>
                <p className="cartaEstadisticaNombre">{label}</p>
            </div>

            <p className="cartaEstadisticaValor">{value}</p>

            {tendencia && (
                <p
                    className={
                        tendenciaPositiva
                            ? 'cartaEstadisticaTendencia cartaEstadisticaTendencia--positiva'
                            : 'cartaEstadisticaTendencia cartaEstadisticaTendencia--negativa'
                    }
                >
                    {tendenciaPositiva ? <IconoTendenciaArriba /> : <IconoTendenciaAbajo />}
                    {tendencia}
                </p>
            )}
        </div>
    );
}

export default StatCard;