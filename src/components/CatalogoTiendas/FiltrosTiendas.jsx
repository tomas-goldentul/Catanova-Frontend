import React, { useMemo } from "react";

const TABS = [
  { key: "todas", label: "Todas las tiendas" },
  { key: "activas", label: "Tiendas activas ahora" },
];

/**
 * Filtros del catálogo:
 * - Tabs por actividad (usa el campo `abierta`, que indica navegación
 *   dentro de la app, no horario comercial).
 * - Select por provincia, calculado dinámicamente a partir de las tiendas.
 */
export default function FiltrosTiendas({
  tiendas,
  tabActivo,
  onTabChange,
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
      <div
        className="cat-tabs"
        role="tablist"
        aria-label="Filtrar tiendas por actividad"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tabActivo === tab.key}
            className={`cat-tab ${
              tabActivo === tab.key ? "cat-tab--activo" : ""
            }`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="cat-panel__select-wrapper">
        <select
          className="cat-panel__select"
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