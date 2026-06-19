import './StoreHeader.css';

const IconExternalLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

function StoreHeader() {
  return (
    <header className="store-header">
      <div className="store-info">
        <span className="store-panel-label">Panel de administración</span>
        <h1 className="store-name">M51 Jeans</h1>
        <div className="store-meta">
          <span className="meta-badge">
            <span className="status-dot" />
            Tienda activa
          </span>
          <span className="meta-sep">·</span>
          <span className="meta-text">★ 5.0 · 120 reseñas</span>
          <span className="meta-sep">·</span>
          <span className="meta-text">Desde 2022</span>
        </div>
      </div>
      <button className="btn-ver-tienda">
        Ver tienda pública
        <IconExternalLink />
      </button>
    </header>
  );
}

export default StoreHeader;
