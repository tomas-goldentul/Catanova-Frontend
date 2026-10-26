// La fecha estimada de entrega llega como "YYYY-MM-DD" (sin hora). No se pasa por new Date()
// para mostrarla: en Argentina (UTC-3) se correría un día para atrás.
const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';
const MS_POR_DIA = 24 * 60 * 60 * 1000;

// "YYYY-MM-DD" del día de un timestamp ISO, en hora de Argentina (en-CA formatea así).
export function diaEnArgentina(valor = new Date()) {
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(fecha);
}

export function formatearFechaEstimada(dia) {
  const [anio, mes, diaDelMes] = String(dia ?? '').split('-');
  if (!anio || !mes || !diaDelMes) return 'Sin definir';
  return `${diaDelMes}/${mes}/${anio}`;
}

function diasEntre(desde, hasta) {
  const aUtc = (dia) => {
    const [anio, mes, diaDelMes] = dia.split('-').map(Number);
    return Date.UTC(anio, mes - 1, diaDelMes);
  };
  return Math.round((aUtc(hasta) - aUtc(desde)) / MS_POR_DIA);
}

function plural(cantidad, palabra) {
  return `${cantidad} ${palabra}${cantidad === 1 ? '' : 's'}`;
}

/**
 * Compara la fecha estimada con la entrega real (si ya se entregó) o con hoy.
 * Devuelve { tono, texto } para el chip, o null si no hay nada que avisar.
 */
export function situacionEntrega({ estado, fecha_entrega_estimada: estimada, fecha_entrega: entrega }) {
  if (!estimada) return null;

  if (estado === 'Entregado') {
    // Pedidos viejos pueden estar entregados sin fecha de entrega registrada.
    if (!entrega) return null;
    const demora = diasEntre(estimada, diaEnArgentina(entrega));
    return demora > 0
      ? { tono: 'demora', texto: `Entregado con ${plural(demora, 'día')} de demora` }
      : { tono: 'a-tiempo', texto: 'Entregado a tiempo' };
  }

  const faltan = diasEntre(diaEnArgentina(), estimada);
  if (faltan < 0) return { tono: 'demora', texto: `Vencida hace ${plural(-faltan, 'día')}` };
  if (faltan === 0) return { tono: 'hoy', texto: 'Se entrega hoy' };
  if (faltan === 1) return { tono: 'pronto', texto: 'Se entrega mañana' };
  return null;
}
