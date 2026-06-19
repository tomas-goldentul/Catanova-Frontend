import './DashboardCard.css';

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
);

function DashboardCard({ icon, title, description, accentBg, accentColor }) {
  return (
    <div className="dashboard-card">
      <div className="card-icon-bg" style={{ background: accentBg, color: accentColor }}>
        {icon}
      </div>
      <p className="card-title">{title}</p>
      <p className="card-description">{description}</p>
      <div className="card-action">
        Acceder <IconArrow />
      </div>
    </div>
  );
}

export default DashboardCard;
