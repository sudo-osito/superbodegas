import { BODEGAS, PLAZOS, PROMO } from './config.js';

// Precio de una combinación. El mismo cálculo corre en el navegador y en el servidor.
export function calcular(bodegaId, plazoId, retiro) {
  const b = BODEGAS[bodegaId]; const p = PLAZOS.find((x) => x.id === plazoId) || PLAZOS[0];
  if (!b) return null;
  const mensual = b.precio;
  const promo = PROMO.activa && PROMO.primerMesDescuento > 0;
  const primerMes = promo ? Math.round(mensual * (1 - PROMO.primerMesDescuento)) : mensual;
  // meses que se pagan; el primero va con descuento de apertura
  const pagados = p.paga;
  const total = pagados >= 1 ? primerMes + mensual * (pagados - 1) : 0;
  const efectivo = total / p.meses;
  const retiroGratis = !!retiro && p.meses >= PROMO.retiroGratisDesdeMeses;
  return { mensual, primerMes, total, efectivo, meses: p.meses, pagados, promo, retiroGratis, ahorro: mensual * p.meses - total };
}
