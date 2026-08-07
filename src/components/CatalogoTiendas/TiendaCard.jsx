import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Tarjeta individual de una tienda dentro del grid del catálogo.
 * `abierta` indica actividad de navegación dentro de la app (no horario
 * comercial), por eso el badge dice "Activa ahora" / "Sin actividad".
 */
export default function TiendaCard({ tienda, index = 0 }) {
  const navigate = useNavigate();
  const activa = Boolean(tienda.abierta);

  // Soporta distintos nombres de campo por si tu tabla usa uno u otro.
  const colores = [
    tienda.color_primario,
    tienda.color_secundario,
    tienda.color,
  ].filter(Boolean);

  const handleEntrar = () => {
    navigate(`/tiendas/${tienda.id_tienda}`, { state: { tienda } });
  };

  return (
    <article
      className="tienda-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="tienda-card__cabecera">
        <h3 className="tienda-card__nombre">{tienda.nombre}</h3>

        {activa ? (
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

      {tienda.slogan && <p className="tienda-card__slogan">{tienda.slogan}</p>}

      <ul className="tienda-card__datos">
        {tienda.direccion && (
          <li className="tienda-card__dato">
            <IconPin />
            <span>{tienda.direccion}</span>
          </li>
        )}
        {tienda.provincia && (
          <li className="tienda-card__dato">
            <IconMapa />
            <span>{tienda.provincia}</span>
          </li>
        )}
        {tienda.telefono && (
          <li className="tienda-card__dato">
            <IconTelefono />
            <span>{tienda.telefono}</span>
          </li>
        )}
      </ul>

      {colores.length > 0 && (
        <div className="tienda-card__colores" aria-label="Colores de la tienda">
          {colores.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="tienda-card__color"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className="tienda-card__boton"
        onClick={handleEntrar}
      >
        Entrar
      </button>
    </article>
  );
}

function IconPin() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconMapa() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function IconTelefono() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}