import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getTodasLasTiendas, abrirTienda, cerrarTienda } from "../api/tiendas.js";
import "./CatalogoTiendas.css";

/**
 * Página de detalle de una tienda.
 *
 * Al montar: PUT /tiendas/:id/abrir -> abierta = true
 *   (hay un usuario navegando dentro de esta tienda ahora mismo)
 * Al desmontar: PUT /tiendas/:id/cerrar -> abierta = false
 *   (ya no hay un usuario navegando dentro de esta tienda)
 */
export default function TiendaDetalle() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [tienda, setTienda] = useState(location.state?.tienda || null);
  const [cargando, setCargando] = useState(!location.state?.tienda);
  const [error, setError] = useState(null);

  // Si se entra directo por URL (sin pasar por la tarjeta), buscamos los datos.
  useEffect(() => {
    if (tienda) return;

    let activo = true;

    async function cargarTienda() {
      setCargando(true);
      setError(null);
      try {
        const todas = await getTodasLasTiendas();
        const encontrada = (todas || []).find(
          (t) => String(t.id_tienda) === String(id)
        );
        if (activo) {
          if (encontrada) setTienda(encontrada);
          else setError("No encontramos esta tienda.");
        }
      } catch (err) {
        console.error("Error al cargar la tienda:", err);
        if (activo) setError("No pudimos cargar la información de la tienda.");
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarTienda();
    return () => {
      activo = false;
    };
  }, [id, tienda]);

  // Registro de actividad de navegación dentro de la tienda.
  useEffect(() => {
    abrirTienda(id).catch((err) => {
      console.error("No se pudo marcar la tienda como en uso:", err);
    });

    return () => {
      cerrarTienda(id).catch((err) => {
        console.error("No se pudo marcar la tienda sin actividad:", err);
      });
    };
    // Este efecto debe correr solo al montar/desmontar para este id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (cargando) {
    return (
      <div className="cat-container">
        <div className="cat-estado">
          <p className="cat-estado__texto">Cargando tienda…</p>
        </div>
      </div>
    );
  }

  if (error || !tienda) {
    return (
      <div className="cat-container">
        <div className="cat-estado cat-estado--error">
          <p className="cat-estado__titulo">No pudimos abrir la tienda</p>
          <p className="cat-estado__texto">
            {error || "No encontramos esta tienda."}
          </p>
          <button
            type="button"
            className="tienda-card__boton"
            onClick={() => navigate("/tiendas")}
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cat-container">
      <button
        type="button"
        className="tienda-detalle__volver"
        onClick={() => navigate("/tiendas")}
      >
        ← Volver a Explorar tiendas
      </button>

      <header className="tienda-detalle__header">
        <div className="tienda-detalle__cabecera">
          <h1 className="tienda-detalle__nombre">{tienda.nombre}</h1>

          {tienda.abierta ? (
            <span className="tienda-badge tienda-badge--activa">
              <span className="tienda-badge__punto" />
              Activa ahora
            </span>
          ) : (
            <span className="tienda-badge tienda-badge--inactiva">
              Sin actividad
            </span>
          )}
        </div>

        {tienda.slogan && (
          <p className="tienda-detalle__slogan">{tienda.slogan}</p>
        )}
      </header>

      <section className="tienda-detalle__info">
        {tienda.direccion && (
          <div className="tienda-detalle__campo">
            <span className="tienda-detalle__label">Dirección</span>
            <span className="tienda-detalle__valor">{tienda.direccion}</span>
          </div>
        )}
        {tienda.provincia && (
          <div className="tienda-detalle__campo">
            <span className="tienda-detalle__label">Provincia</span>
            <span className="tienda-detalle__valor">{tienda.provincia}</span>
          </div>
        )}
        {tienda.telefono && (
          <div className="tienda-detalle__campo">
            <span className="tienda-detalle__label">Teléfono</span>
            <span className="tienda-detalle__valor">{tienda.telefono}</span>
          </div>
        )}
      </section>
    </div>
  );
}