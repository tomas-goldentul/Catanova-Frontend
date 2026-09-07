import React, { useMemo } from "react";

export default function FiltrosTiendas({
  tiendas,
  provincia,
  onProvinciaChange,
}) {
  const provincias = useMemo(() => {
    const set = new Set(
      tiendas.map((t) => t.provincia).filter((p) => p && p.trim().length > 0)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [tiendas]);

  return (
    <div className="tiendas-filtros">
      <div className="ct-select-wrap">
        <svg className="ct-select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <select
          className="ct-select"
          value={provincia}
          onChange={(e) => onProvinciaChange(e.target.value)}
          aria-label="Filtrar por provincia"
        >
          <option value="">Todas las provincias</option>
          {provincias.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
