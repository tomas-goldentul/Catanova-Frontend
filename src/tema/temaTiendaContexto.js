import { createContext, useContext } from 'react';

// El contexto y su hook viven separados del Provider para que Fast Refresh funcione.
export const TemaTiendaContext = createContext(null);

export function useTemaTienda() {
  const ctx = useContext(TemaTiendaContext);
  if (!ctx) {
    throw new Error('useTemaTienda debe usarse dentro de TemaTiendaProvider');
  }
  return ctx;
}
