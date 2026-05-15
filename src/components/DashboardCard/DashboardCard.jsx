function DashboardCard({ icon, title, description }) {
  return (
    <div className="card">
      <div className="card-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      <a href="/" className="card-link">Ir →</a>
    </div>
  );
}

export default DashboardCard;