import { useState, useEffect } from 'react';
import './Catalogo.css';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import BurbujaChatanova from '../BurbujaChatanova/BurbujaChatanova';
import { getCategorias, getCategoriaPorId } from '../../api/categorias';

const IconoOjo = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconoLapiz = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconoVentas = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6" />
  </svg>
);

const IconoVistas = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconoFavoritos = () => (
  <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const IconoChispas = () => (
  <svg width="28" height="28" fill="none" stroke="#00b894" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z" />
    <path d="M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5z" />
    <path d="M19 17l.4 1.2L21 19l-1.6.4L19 21l-.4-1.6L17 19l1.6-.4z" />
  </svg>
);

const CATEGORIAS = [
  {
    id: 'jeans',
    nombre: 'Jeans',
    productos: [
      { id: 1,  nombre: 'Bermuda',   ventas: 4,  vistas: 29, favoritos: 6,  stock: 50 },
      { id: 2,  nombre: 'Pantalón',  ventas: 7,  vistas: 21, favoritos: 11, stock: 21 },
      { id: 3,  nombre: 'Camisa',    ventas: 12, vistas: 31, favoritos: 13, stock: 56 },
      { id: 4,  nombre: 'Gorra',     ventas: 2,  vistas: 7,  favoritos: 1,  stock: 5  },
      { id: 5,  nombre: 'Remera',    ventas: 4,  vistas: 28, favoritos: 8,  stock: 12 },
    ],
  },
  {
    id: 'remeras',
    nombre: 'Remeras',
    productos: [
      { id: 6,  nombre: 'Remera celeste', ventas: 4,  vistas: 28, favoritos: 8,  stock: 50 },
      { id: 7,  nombre: 'Remera negra',   ventas: 7,  vistas: 21, favoritos: 11, stock: 21 },
      { id: 8,  nombre: 'Remera verde',   ventas: 12, vistas: 31, favoritos: 13, stock: 56 },
      { id: 9,  nombre: 'Remera azul',    ventas: 2,  vistas: 7,  favoritos: 1,  stock: 5  },
      { id: 10, nombre: 'Remera am.',     ventas: 4,  vistas: 28, favoritos: 8,  stock: 12 },
    ],
  },
  {
    id: 'vieja-escuela',
    nombre: 'Vieja escuela',
    productos: [
      { id: 11, nombre: 'Remera celeste', ventas: 4,  vistas: 28, favoritos: 8,  stock: 50 },
      { id: 12, nombre: 'Remera negra',   ventas: 7,  vistas: 21, favoritos: 11, stock: 21 },
      { id: 13, nombre: 'Remera verde',   ventas: 12, vistas: 31, favoritos: 13, stock: 56 },
      { id: 14, nombre: 'Remera azul',    ventas: 2,  vistas: 7,  favoritos: 1,  stock: 5  },
      { id: 15, nombre: 'Remera am.',     ventas: 4,  vistas: 28, favoritos: 8,  stock: 12 },
    ],
  },
  {
    id: 'ropa-colorida',
    nombre: 'Ropa Colorida',
    productos: [
      { id: 16, nombre: 'Remera Rayada', ventas: 4,  vistas: 28, favoritos: 8,  stock: 50 },
      { id: 17, nombre: 'Remera Batik',  ventas: 7,  vistas: 21, favoritos: 11, stock: 21 },
      { id: 18, nombre: 'Kit Fluor',     ventas: 12, vistas: 31, favoritos: 13, stock: 56 },
      { id: 19, nombre: 'Maya',          ventas: 2,  vistas: 7,  favoritos: 1,  stock: 5  },
      { id: 20, nombre: 'Boxers',        ventas: 4,  vistas: 28, favoritos: 8,  stock: 12 },
    ],
  },
];

function TarjetaCatalogo({ id, nombre, ventas, vistas, favoritos, stock }) {
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
          <button className="cat-card__btn-datos">Más datos<br />y analítica</button>
        </div>
      </div>
      <div className="cat-card__stats">
        <div className="cat-card__stat"><IconoVentas /><span>Ventas: {ventas}</span></div>
        <div className="cat-card__stat"><IconoVistas /><span>Vistas: {vistas}</span></div>
        <div className="cat-card__stat"><IconoFavoritos /><span>Favoritos: {favoritos}</span></div>
        <div className="cat-card__stock">Stock restante: {stock}</div>
      </div>
    </div>
  );
}

function SeccionCategoria({ id, nombre, productos }) {
  return (
    <div className="cat-seccion" id={`seccion-${id}`}>
      <div className="cat-seccion__header">
        <h3 className="cat-seccion__nombre">{nombre}</h3>
        <button className="cat-seccion__btn-editar" aria-label={`Editar ${nombre}`}>
          <IconoLapiz />
        </button>
      </div>
      <div className="cat-seccion__scroll">
        {productos.map(p => (
          <TarjetaCatalogo key={p.id} {...p} />
        ))}
      </div>
    </div>
  );
}

function Catalogo() {
  const [tabActivo, setTabActivo] = useState(CATEGORIAS[0].id);

  const irASeccion = (id) => {
    setTabActivo(id);
    const el = document.getElementById(`seccion-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Navbar />
      <main className="cat-main">

        {/* ── HEADER ── */}
        <div className="cat-header">
          <div className="cat-header__tienda">
            <h1 className="cat-header__nombre">M51 Jeans</h1>
            <p className="cat-header__tagline">Donde la ropa es la felicidad</p>
            <div className="cat-header__meta">
              <span className="cat-header__est">Est. 2022</span>
              <span className="cat-header__stars">★★★★★</span>
              <span className="cat-header__rating">5/5</span>
            </div>
            <button className="cat-header__btn-editar">
              Editar Tienda <IconoLapiz />
            </button>
          </div>

          <div className="cat-header__divider" />

          <div className="cat-header__right">
            <h2 className="cat-header__titulo">Catálogo</h2>
            <p className="cat-header__subtitulo">Hechá un vistazo a tus productos</p>
            <button className="cat-header__btn-stats">
              <IconoOjo /> Ver Estadísticas
            </button>
          </div>
        </div>

        {/* ── PRODUCTOS ── */}
        <div className="cat-productos">
          <h2 className="cat-productos__titulo">Productos:</h2>

          <div className="cat-tabs">
            {CATEGORIAS.map(cat => (
              <button
                key={cat.id}
                className={`cat-tab${tabActivo === cat.id ? ' cat-tab--activo' : ''}`}
                onClick={() => irASeccion(cat.id)}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {CATEGORIAS.map(cat => (
            <SeccionCategoria key={cat.id} {...cat} />
          ))}

          {/* ── SECCIÓN FINAL ── */}
          <div className="cat-crear">
            <div className="cat-crear__card">
              <div className="cat-crear__icon-wrap">
                <IconoChispas />
              </div>
              <h3 className="cat-crear__titulo">¡Seguí creciendo!</h3>
              <p className="cat-crear__texto">
                Creá una nueva categoría
                y mostrale a tus clientes todo lo que tenés para ofrecer.
              </p>
              <button className="cat-crear__btn">
                + Crear nueva categoría
              </button>
            </div>
          </div>
        </div>

      </main>
      <Footer />
      <BurbujaChatanova />
    </>
  );
}

export default Catalogo;
