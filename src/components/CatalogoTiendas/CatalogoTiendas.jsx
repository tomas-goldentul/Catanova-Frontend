import React, { useEffect, useMemo, useState } from "react";
import BuscadorTiendas from "./BuscadorTiendas";
import FiltrosTiendas from "./FiltrosTiendas";
import TiendaCard from "./TiendaCard";
import { getTodasLasTiendas } from "../../api/tiendas.js";
import './CatalogoTiendas.css';

export default function CatalogoTiendas({ onEntrar }) {
  const [tiendas, setTiendas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [provincia, setProvincia] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarTiendas() {
      setCargando(true);
      setError(null);
      try {
        const data = await getTodasLasTiendas();
        if (activo) setTiendas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al cargar tiendas:", err);
        if (activo) {
          setError(
            "No pudimos cargar las tiendas. Intentá nuevamente en unos segundos."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarTiendas();
    return () => {
      activo = false;
    };
  }, []);

  const tiendasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return tiendas.filter((t) => {
      const coincideTexto =
        !texto ||
        t.nombre?.toLowerCase().includes(texto) ||
        t.slogan?.toLowerCase().includes(texto);

      const coincideProvincia = !provincia || t.provincia === provincia;

      return coincideTexto && coincideProvincia;
    });
  }, [tiendas, busqueda, provincia]);

  return (
    <div className="ct-container">
      <header className="ct-header">
        <div className="ct-header__decoracion" aria-hidden="true" />

        <div className="ct-header__izquierda">
          <h1 className="ct-header__titulo">Explorar tiendas</h1>
          <p className="ct-header__subtitulo">
            Encontrá comercios y productos dentro de la plataforma
          </p>
          <p className="ct-header__meta">
            {cargando
              ? "Cargando tiendas..."
              : (
                <>
                  {tiendas.length} {tiendas.length === 1 ? "tienda" : "tiendas"} en total
                  <span className="ct-header__meta-dot" />
                  Plataforma Catanova
                </>
              )}
          </p>
        </div>

        <div className="ct-header__derecha">
          <span className="ct-header__numero">
            {cargando ? "—" : tiendas.length}
          </span>
          <span className="ct-header__numero-label">Tiendas disponibles</span>
        </div>
      </header>

      <section className="ct-buscar-filtros">
        <BuscadorTiendas value={busqueda} onChange={setBusqueda} />
        <FiltrosTiendas
          tiendas={tiendas}
          provincia={provincia}
          onProvinciaChange={setProvincia}
        />
      </section>

      {error && (
        <div className="ct-estado ct-estado--error">
          <p className="ct-estado__titulo">Ocurrió un problema</p>
          <p className="ct-estado__texto">{error}</p>
        </div>
      )}

      {!error && cargando && (
        <div className="ct-grid" aria-busy="true" aria-label="Cargando tiendas">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="tienda-card tienda-card--skeleton" />
          ))}
        </div>
      )}

      {!error && !cargando && tiendasFiltradas.length === 0 && (
        <div className="ct-estado ct-estado--vacio">
          <p className="ct-estado__titulo">No encontramos tiendas</p>
          <p className="ct-estado__texto">
            Probá con otro nombre o cambiá los filtros aplicados.
          </p>
        </div>
      )}

      {!error && !cargando && tiendasFiltradas.length > 0 && (
        <div className="ct-grid">
          {tiendasFiltradas.map((tienda, index) => (
            <TiendaCard
              key={tienda.id_tienda}
              tienda={tienda}
              index={index}
              onEntrar={onEntrar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
