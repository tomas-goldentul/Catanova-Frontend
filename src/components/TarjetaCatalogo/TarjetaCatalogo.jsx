import {
  IconoVentas,
  IconoVistas,
  IconoFavoritos
} from '../Icons/Icons';
import './TarjetaCatalogo.css';

function TarjetaCatalogo({
  id,
  nombre,
  ventas,
  vistas,
  favoritos,
  stock,
  onVerProducto,
}) {
  return (
    <div className="cat-card">
      <div className="cat-card__img-wrapper">
        <img
          src={`https://picsum.photos/seed/prod${id}/200/180`}
          alt={nombre}
          className="cat-card__img"
        />

        <div className="cat-card__overlay">
          <span className="cat-card__nombre">{nombre}</span>

          <button
            className="cat-card__btn-datos"
            onClick={() => onVerProducto(id)}
            type="button"
          >
            Más datos
            <br />
            y analítica
          </button>
        </div>
      </div>

      <div className="cat-card__stats">
        <div className="cat-card__stat">
          <IconoVentas />
          <span>Ventas: {ventas}</span>
        </div>

        <div className="cat-card__stat">
          <IconoVistas />
          <span>Vistas: {vistas}</span>
        </div>

        <div className="cat-card__stat">
          <IconoFavoritos />
          <span>Favoritos: {favoritos}</span>
        </div>

        <div className="cat-card__stock">
          Stock restante: {stock}
        </div>
      </div>
    </div>
  );
}

export default TarjetaCatalogo;