import './DashboardCard.css';

function DashboardCard({ icon, title, description, tip }) {
  return (
    <div className={`card ${tip ? 'card-tip' : ''}`}>
      <div className="card-icon">{icon}</div>
      <div className="card-body">
        {tip && <span className="tip-badge">Consejo</span>}
        <h2>{title}</h2>
        <p>{description}</p>
        <a href="/" className="card-link">Ir →</a>
      </div>
    </div>
  );
}

export default DashboardCard;