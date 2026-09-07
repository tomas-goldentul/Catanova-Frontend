import React from "react";

function getInitials(nombre) {
  if (!nombre) return "?";
  const parts = nombre.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function getAvatarColor(nombre) {
  if (!nombre) return "#7b849d";
  const palette = [
    "#00b894", "#0984e3", "#6c5ce7", "#e17055",
    "#00cec9", "#fdcb6e", "#e84393", "#2d3436",
    "#0652DD", "#1289A7", "#A3CB38", "#FDA7DF",
  ];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export default function TiendaCard({ tienda, index = 0, onEntrar }) {
  const colores = [
    tienda.color_primario,
    tienda.color_secundario,
    tienda.color,
  ].filter(Boolean);

  const borderColor = tienda.color_primario || getAvatarColor(tienda.nombre);

  return (
    <article
      className="tienda-card"
      style={{
        animationDelay: `${index * 70}ms`,
        borderTopColor: borderColor,
      }}
    >
      <div className="tienda-card__top">
        <div
          className="tienda-card__avatar"
          style={{ backgroundColor: getAvatarColor(tienda.nombre) }}
        >
          {getInitials(tienda.nombre)}
        </div>
        <div className="tienda-card__info">
          <h3 className="tienda-card__nombre">{tienda.nombre}</h3>
          {tienda.slogan && <p className="tienda-card__slogan">{tienda.slogan}</p>}
        </div>
      </div>

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
        onClick={() => onEntrar(tienda)}
      >
        Ver tienda
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </button>
    </article>
  );
}

function IconPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconMapa() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function IconTelefono() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}
