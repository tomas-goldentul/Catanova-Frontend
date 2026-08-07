import React from "react";

/**
 * Barra de búsqueda de tiendas por nombre o slogan.
 * El filtrado real se resuelve en CatalogoTiendas.jsx a partir de `value`.
 */
export default function BuscadorTiendas({ value, onChange }) {
  return (
    <div className="tiendas-buscador">
      <svg
        className="tiendas-buscador__icono"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        type="text"
        className="tiendas-buscador__input"
        placeholder="Buscar tienda..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Buscar tienda por nombre o slogan"
      />

      {value && (
        <button
          type="button"
          className="tiendas-buscador__limpiar"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
        >
          ×
        </button>
      )}
    </div>
  );
}