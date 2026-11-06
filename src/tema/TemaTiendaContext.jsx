import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getTiendaPorId } from '../api/tiendas';
import { PALETA_DEFAULT, aplicarTokens, derivarTokens, paletaDesdeTienda } from './paleta';

const TemaTiendaContext = createContext(null);

function aplicarPaleta(paleta) {
  aplicarTokens(derivarTokens(paleta));
}

export function TemaTiendaProvider({ children }) {
  const [paleta, setPaleta] = useState(PALETA_DEFAULT);
  const guardadaRef = useRef(PALETA_DEFAULT);

  const confirmar = useCallback((siguiente) => {
    const normalizada = {
      primario: siguiente?.primario || PALETA_DEFAULT.primario,
      secundario: siguiente?.secundario || PALETA_DEFAULT.secundario,
      fondo: siguiente?.fondo || PALETA_DEFAULT.fondo,
    };
    guardadaRef.current = normalizada;
    setPaleta(normalizada);
    aplicarPaleta(normalizada);
  }, []);

  const previsualizar = useCallback((siguiente) => {
    const normalizada = {
      primario: siguiente?.primario || guardadaRef.current.primario,
      secundario: siguiente?.secundario || guardadaRef.current.secundario,
      fondo: siguiente?.fondo || guardadaRef.current.fondo,
    };
    setPaleta(normalizada);
    aplicarPaleta(normalizada);
  }, []);

  const restaurar = useCallback(() => {
    setPaleta(guardadaRef.current);
    aplicarPaleta(guardadaRef.current);
  }, []);

  useEffect(() => {
    aplicarPaleta(paleta);
  }, [paleta]);

  useEffect(() => {
    let vigente = true;

    async function cargar() {
      const id = localStorage.getItem('id_tienda');
      if (!id) {
        if (vigente) confirmar(PALETA_DEFAULT);
        return;
      }

      try {
        const tienda = await getTiendaPorId(id);
        if (vigente) confirmar(paletaDesdeTienda(tienda));
      } catch (error) {
        console.error('No se pudo cargar la paleta de la tienda.', error);
      }
    }

    cargar();
    window.addEventListener('catanova:auth', cargar);
    return () => {
      vigente = false;
      window.removeEventListener('catanova:auth', cargar);
    };
  }, [confirmar]);

  const valor = useMemo(
    () => ({ paleta, previsualizar, confirmar, restaurar }),
    [paleta, previsualizar, confirmar, restaurar]
  );

  return (
    <TemaTiendaContext.Provider value={valor}>
      {children}
    </TemaTiendaContext.Provider>
  );
}

export function useTemaTienda() {
  const ctx = useContext(TemaTiendaContext);
  if (!ctx) {
    throw new Error('useTemaTienda debe usarse dentro de TemaTiendaProvider');
  }
  return ctx;
}
