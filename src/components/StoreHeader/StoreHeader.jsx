function StoreHeader() {
  return (
    <div className="store-header">
      <div className="store-title">
        <h1>Mi Tienda</h1>
        <p>Aquí puedes gestionar tu tienda en Catanova</p>
        <div className="rating-row">
          <span className="stars">★★★★★</span>
          <span className="rating-text">5/5</span>
          <span className="rating-reviews">120 reseñas</span>
        </div>
      </div>
      <button className="btn-ver-tienda">Ver Tienda Pública ▾</button>
    </div>
  );
}

export default StoreHeader;