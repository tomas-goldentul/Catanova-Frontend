import TarjetaCatalogo from '../TarjetaCatalogo/TarjetaCatalogo';
import { IconoLapiz } from '../Icons/Icons';
import './Categoria.css';

function Categoria({ id, nombre, productos, onEditar, onVerProducto }) {
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
        {productos.length === 0 ? (
          <div className="cat-seccion__vacio">
            <p className="cat-seccion__vacio-titulo">
              Todavía no hay productos en esta categoría
            </p>
            <p className="cat-seccion__vacio-texto">
              Podés agregar productos usando el botón de edición de la esquina
              derecha.
            </p>
          </div>
        ) : (
          productos.map((p) => (
            <TarjetaCatalogo key={p.id} {...p} onVerProducto={onVerProducto} />
          ))
        )}
      </div>
    </div>
  );
}

export default Categoria;
