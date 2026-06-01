import './StatCard.css';

function StatCard({ label, value }) {
    return (
        <div className="cartaEstadistica">
            <p className="cartaEstadisticaNombre">{label}</p>
            <p className="cartaEstadisticaValor">{value}</p>
        </div>
    );
}

export default StatCard;
