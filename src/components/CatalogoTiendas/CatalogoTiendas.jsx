import React, { useEffect, useMemo, useState } from "react";
import BuscadorTiendas from "./BuscadorTiendas";
import FiltrosTiendas from "./FiltrosTiendas";
import TiendaCard from "./TiendaCard";
import { getTodasLasTiendas } from "../api/tiendas.js";
import './CatalogoTiendas.css';

export default function CatalogoTiendas() {
  const [tiendas, setTiendas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [tabActivo, setTabActivo] = useState("todas");
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

      // "abierta" = actividad de navegación dentro de la app, no horario comercial.
      const coincideTab = tabActivo === "todas" || Boolean(t.abierta) === true;

      const coincideProvincia = !provincia || t.provincia === provincia;

      return coincideTexto && coincideTab && coincideProvincia;
    });
  }, [tiendas, busqueda, tabActivo, provincia]);

  return (
    <div className="cat-container">
      <header className="cat-header">
        <div className="cat-header__decoracion" aria-hidden="true" />

        <div className="cat-header__izquierda">
          <h1 className="cat-header__titulo">Explorar tiendas</h1>
          <p className="cat-header__subtitulo">
            Encontrá comercios y productos dentro de la plataforma
          </p>
          <p className="cat-header__meta">
            {cargando
              ? "Cargando tiendas…"
              : `${tiendas.length} ${
                  tiendas.length === 1 ? "tienda" : "tiendas"
                } en total`}
          </p>
        </div>

        <div className="cat-header__derecha">
          <span className="cat-header__numero">
            {cargando ? "—" : tiendas.length}
          </span>
          <span className="cat-header__numero-label">Tiendas disponibles</span>
        </div>
      </header>

      <section className="divBuscarProductos">
        <BuscadorTiendas value={busqueda} onChange={setBusqueda} />
        <FiltrosTiendas
          tiendas={tiendas}
          tabActivo={tabActivo}
          onTabChange={setTabActivo}
          provincia={provincia}
          onProvinciaChange={setProvincia}
        />
      </section>

      {error && (
        <div className="cat-estado cat-estado--error">
          <p className="cat-estado__titulo">Ocurrió un problema</p>
          <p className="cat-estado__texto">{error}</p>
        </div>
      )}

      {!error && cargando && (
        <div className="cat-grid" aria-busy="true" aria-label="Cargando tiendas">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="tienda-card tienda-card--skeleton" />
          ))}
        </div>
      )}

      {!error && !cargando && tiendasFiltradas.length === 0 && (
        <div className="cat-estado cat-estado--vacio">
          <p className="cat-estado__titulo">No encontramos tiendas</p>
          <p className="cat-estado__texto">
            Probá con otro nombre, otro slogan o cambiá los filtros aplicados.
          </p>
        </div>
      )}

      {!error && !cargando && tiendasFiltradas.length > 0 && (
        <div className="cat-grid">
          {tiendasFiltradas.map((tienda, index) => (
            <TiendaCard key={tienda.id_tienda} tienda={tienda} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}