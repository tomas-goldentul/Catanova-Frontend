import { useState, useEffect } from 'react';
import './Catalogo.css';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import BurbujaChatanova from '../BurbujaChatanova/BurbujaChatanova';
import Categoria from '../Categoria/Categoria';
import { getCategorias, getCategoriaPorId } from '../../api/categorias';
import {
  IconoLapiz,
  IconoOjo,
  IconoChispas
} from '../Icons/Icons';

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
            <Categoria key={cat.id} {...cat} />
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
