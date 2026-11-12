// Valida una solicitud de arriendo y la envía a Telegram. Se usa en Cloudflare Pages (functions/api/solicitud.js)
// y en el servidor local de Vite. Nunca confía en precios ni totales que mande el navegador: los recalcula.
import { BODEGAS, PLAZOS, PROMO, clp } from '../../src/config.js';
import { ITEMS } from '../../src/items.js';
import { calcular } from '../../src/precio.js';

const LIM = { nombre: 80, email: 120, telefono: 20, rut: 12, comuna: 60, comentario: 600 };
const limpio = (v, n) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);

export function validarRut(rut) {
  const r = String(rut).replace(/[.\s-]/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(r)) return false;
  const cuerpo = r.slice(0, -1), dv = r.slice(-1);
  let s = 0, m = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) { s += Number(cuerpo[i]) * m; m = m === 7 ? 2 : m + 1; }
  const res = 11 - (s % 11); const esp = res === 11 ? '0' : res === 10 ? 'K' : String(res);
  return esp === dv;
}

export function validar(body) {
  const e = {};
  if (!body || typeof body !== 'object') return { errores: { general: 'Solicitud vacía' } };
  if (body.empresa_web) return { spam: true }; // trampa para bots
  const d = {
    nombre: limpio(body.nombre, LIM.nombre),
    email: limpio(body.email, LIM.email).toLowerCase(),
    telefono: limpio(body.telefono, LIM.telefono).replace(/[^\d+]/g, ''),
    rut: limpio(body.rut, LIM.rut),
    comuna: limpio(body.comuna, LIM.comuna),
    tipo: body.tipo === 'empresa' ? 'empresa' : 'persona',
    comentario: limpio(body.comentario, LIM.comentario),
    bodega: Number(body.bodega),
    plazo: Number(body.plazo),
    inicio: limpio(body.inicio, 10),
    retiro: !!body.retiro,
    direccionRetiro: limpio(body.direccionRetiro, 140),
    items: {},
  };
  if (d.nombre.length < 3) e.nombre = 'Escribe tu nombre y apellido';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.email = 'Revisa el correo';
  if (!/^(\+?56)?9\d{8}$/.test(d.telefono)) e.telefono = 'Usa un celular chileno: 9 1234 5678';
  if (d.rut && !validarRut(d.rut)) e.rut = 'El RUT no es válido';
  if (!BODEGAS[d.bodega]) e.bodega = 'Elige una bodega';
  if (!PLAZOS.find((p) => p.id === d.plazo)) e.plazo = 'Elige un plazo';
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const ini = new Date(d.inicio + 'T12:00:00');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.inicio) || isNaN(ini) || ini < hoy || (ini - hoy) / 864e5 > 120) e.inicio = 'Elige una fecha dentro de los próximos 4 meses';
  if (d.retiro && d.direccionRetiro.length < 5) e.direccionRetiro = 'Indica la dirección de retiro';
  if (body.items && typeof body.items === 'object') {
    for (const [k, v] of Object.entries(body.items)) {
      const n = Math.max(0, Math.min(200, Math.floor(Number(v) || 0)));
      if (ITEMS[k] && n > 0) d.items[k] = n;
    }
  }
  return Object.keys(e).length ? { errores: e } : { datos: d };
}

export function codigo() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = 'SB-';
  const buf = new Uint8Array(6); crypto.getRandomValues(buf);
  for (const b of buf) s += a[b % a.length];
  return s;
}

export function mensajeTelegram(d, cod) {
  const b = BODEGAS[d.bodega]; const p = PLAZOS.find((x) => x.id === d.plazo); const c = calcular(d.bodega, d.plazo, d.retiro);
  const items = Object.entries(d.items).map(([k, n]) => `${n}× ${ITEMS[k].nombre}`).join(', ');
  const fecha = new Date(d.inicio + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const tel = d.telefono.startsWith('+') ? d.telefono : '+56' + d.telefono.replace(/^56/, '');
  return [
    `📦 Nueva solicitud de arriendo · ${cod}`,
    ``,
    `${b.nombre} · ${p.nombre}`,
    `Inicio: ${fecha}`,
    `Mensual: ${clp(c.mensual)}${c.promo ? ` · 1er mes ${clp(c.primerMes)} (${PROMO.nombre})` : ''}`,
    `Total del período: ${clp(c.total)}`,
    d.retiro ? `🚚 Retiro a domicilio: ${d.direccionRetiro}${c.retiroGratis ? ' (gratis)' : ' (cotizar flete)'}` : `🚗 Trae sus cosas`,
    ``,
    `👤 ${d.nombre} (${d.tipo})`,
    `📱 ${tel}  ·  https://wa.me/${tel.replace('+', '')}`,
    `✉️ ${d.email}`,
    d.rut ? `RUT ${d.rut}` : null,
    d.comuna ? `Comuna: ${d.comuna}` : null,
    items ? `` : null,
    items ? `Guardará: ${items}` : null,
    d.comentario ? `` : null,
    d.comentario ? `💬 ${d.comentario}` : null,
  ].filter((x) => x !== null).join('\n');
}

// env: { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID }. Devuelve {status, body}.
export async function procesar(body, env, guardarLocal) {
  const v = validar(body);
  if (v.spam) return { status: 200, body: { ok: true, codigo: codigo() } };
  if (v.errores) return { status: 422, body: { ok: false, errores: v.errores } };
  const cod = codigo(); const texto = mensajeTelegram(v.datos, cod);
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    if (guardarLocal) { await guardarLocal({ codigo: cod, fecha: new Date().toISOString(), ...v.datos, texto }); return { status: 200, body: { ok: true, codigo: cod, modo: 'local' } }; }
    return { status: 500, body: { ok: false, errores: { general: 'Falta configurar Telegram' } } };
  }
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: texto, disable_web_page_preview: true }),
  });
  if (!r.ok) return { status: 502, body: { ok: false, errores: { general: 'No pudimos enviar tu solicitud. Escríbenos por WhatsApp.' } } };
  return { status: 200, body: { ok: true, codigo: cod } };
}
