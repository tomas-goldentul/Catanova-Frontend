import TarjetaCatalogo from '../TarjetaCatalogo/TarjetaCatalogo';
import { IconoLapiz } from '../Icons/Icons';
import './Categoria.css';

function Categoria({ id, nombre, productos, onEditar }) {
  return (
    <div className="cat-seccion" id={`seccion-${id}`}>
      <div className="cat-seccion__header">
        <h3 className="cat-seccion__nombre">{nombre}</h3>

        <button
          className="cat-seccion__btn-editar"
          aria-label={`Editar ${nombre}`}
          onClick={onEditar}
        >
          <IconoLapiz />
        </button>
      </div>

      <div className="cat-seccion__scroll">
        {productos.map((p) => (
          <TarjetaCatalogo key={p.id} {...p} />
        ))}
      </div>
    </div>
  );
}

export default Categoria;
