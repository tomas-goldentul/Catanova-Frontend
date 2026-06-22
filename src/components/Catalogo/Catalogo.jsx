import { useState, useEffect } from 'react';
import './Catalogo.css';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import BurbujaChatanova from '../BurbujaChatanova/BurbujaChatanova';
import Categoria from '../Categoria/Categoria';
import { getCategorias } from '../../api/categorias';
import { getProductosPorCategoria } from '../../api/productos';
import { getNombre, getSlogan } from '../../api/tiendas'; 

import {
  IconoLapiz,
  IconoOjo,
  IconoChispas
} from '../Icons/Icons';

function Catalogo() {
  const [categorias, setCategorias] = useState([]);
  const [tabActivo, setTabActivo] = useState(null);
  const [infoTienda, setInfoTienda] = useState({ 
    nombre: 'Cargando tienda...', 
    slogan: 'Cargando slogan...' 
  });

  // ASÍ SERÍA CON EL ID DINÁMICO DE LA TIENDA DESDE LA URL (Necesitás instalar react-router-dom):
  // primero corrés: npm install react-router-dom
  // importás arriba: import { useParams } from 'react-router-dom';
  // y lo usás acá: const { idTienda } = useParams();

  useEffect(() => {
    // ACTUAL: ID hardcodeado para pruebas
    const idTienda = 1; 

    async function iniciarCarga() {
      try {
        const [categoriasDB, dataNombre, dataSlogan] = await Promise.all([
          getCategorias(),
          getNombre(idTienda), // <- Si fuera dinámico usaría el id de useParams
          getSlogan(idTienda)  // <- Si fuera dinámico usaría el id de useParams
        ]);

        setInfoTienda({
          nombre: dataNombre?.nombre || 'M51 Jeans',
          slogan: dataSlogan?.slogan || 'Donde la ropa es la felicidad'
        });

        const categoriesConProductos = await Promise.all(
          categoriasDB.map(async (cat) => {
            const productos = await getProductosPorCategoria(cat.id_categoria);
            return {
              ...cat,
              productos
            };
          })
        );

        setCategorias(categoriesConProductos);

        if (categoriesConProductos.length > 0) {
          setTabActivo(categoriesConProductos[0].id);
        }

      } catch (error) {
        console.error("Error en la carga de datos:", error);
        setInfoTienda({
          nombre: "M51 Jeans",
          slogan: "Donde la ropa es la felicidad"
        });
      }
    }

    // SI USÁS EL ID DINÁMICO, COMENTÁS EL IF DE ABAJO PARA EVITAR EJECUCIONES SIN ID:
    // if (idTienda) iniciarCarga();
    
    iniciarCarga();
  }, []); // SI EL ID FUERA DINÁMICO, DEBERÍAS AGREGARLO ACÁ: [idTienda]

  const irASeccion = (id) => {
    setTabActivo(id);
    const el = document.getElementById(`seccion-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Navbar />
      <main className="cat-main">

        <div className="cat-header">
          <div className="cat-header__tienda">
            <h1 className="cat-header__nombre">{infoTienda.nombre}</h1>
            <p className="cat-header__tagline">{infoTienda.slogan}</p>
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

        <div className="cat-productos">
          <h2 className="cat-productos__titulo">Productos:</h2>

          <div className="cat-tabs">
            {categorias.map(cat => (
              <button
                key={cat.id}
                className={`cat-tab${tabActivo === cat.id ? ' cat-tab--activo' : ''}`}
                onClick={() => irASeccion(cat.id)}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {categorias.map(cat => (
            <Categoria key={cat.id} {...cat} />
          ))}

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