import { BODEGAS, PLAZOS, PROMO, NEGOCIO, clp } from './config.js';
import { ITEMS, GRUPOS, PRESETS } from './items.js';
import { calcular } from './precio.js';
import { empacar, expandir } from './pack.js';
import { cabecera } from './ui.js';
import { crearBodega, REPISA } from './bodega3d.js';

cabecera();
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const q = new URLSearchParams(location.search);

const st = {
  paso: 0, max: 0,
  items: {},
  bodega: BODEGAS[q.get('bodega')] ? Number(q.get('bodega')) : null,
  elegidaPorUsuario: !!BODEGAS[q.get('bodega')],
  plazo: 3, retiro: false,
};
if (PRESETS[q.get('preset')]) st.items = { ...PRESETS[q.get('preset')].items };
$$('[data-respuesta]').forEach((e) => (e.textContent = NEGOCIO.respuesta));

// ---------- 3D ----------
const host = $('#escena-cot');
const b3 = crearBodega(host, { onPack: medir, lejos: 1.15 });
function medir(res) {
  const p = Math.round(res.ocupacion * 100); $('#cm-barra').style.width = p + '%';
  $('#cm-pct').textContent = res.afuera.length ? `${res.afuera.length} afuera` : p + ' %';
  $('#cm-pct').style.color = res.afuera.length ? '#b23c17' : '';
}

// ---------- paso 1: objetos ----------
$('#atajos').innerHTML = Object.entries(PRESETS).map(([k, p]) => `<button type="button" class="chip" data-preset="${k}">${p.nombre}</button>`).join('');
$('#lista-items').innerHTML = GRUPOS.map((g) => {
  const filas = Object.entries(ITEMS).filter(([, it]) => it.grupo === g).map(([k, it]) => `
    <div class="item-fila"><div><div>${it.nombre}</div><div class="dato">${fmt(it.w)} × ${fmt(it.d)} × ${fmt(it.h)} m</div></div>
      <div class="contador" data-item="${k}"><button type="button" data-d="-1" aria-label="Quitar ${it.nombre}">−</button><output>0</output><button type="button" data-d="1" aria-label="Agregar ${it.nombre}">+</button></div>
    </div>`).join('');
  return `<div class="grupo-items"><h4>${g}</h4>${filas}</div>`;
}).join('');
function fmt(n) { return n.toFixed(2).replace('.', ','); }

$('#lista-items').addEventListener('click', (e) => {
  const bt = e.target.closest('button[data-d]'); if (!bt) return;
  const k = bt.closest('[data-item]').dataset.item; const n = Math.max(0, Math.min(60, (st.items[k] || 0) + Number(bt.dataset.d)));
  if (n) st.items[k] = n; else delete st.items[k];
  syncItems();
});
$('#atajos').addEventListener('click', (e) => { const b = e.target.closest('[data-preset]'); if (!b) return; st.items = { ...PRESETS[b.dataset.preset].items }; syncItems(); });
$('[data-vaciar]').addEventListener('click', () => { st.items = {}; syncItems(); });

function recomendada() {
  const lista = expandir(st.items);
  if (!lista.length) return null;
  for (const id of [7, 15]) { const b = BODEGAS[id]; if (!empacar(lista, b, b.repisa ? REPISA : null).afuera.length) return id; }
  return 0; // no cabe en ninguna
}
let ultimaRec = undefined;
function syncItems() {
  $$('[data-item]').forEach((c) => { const n = st.items[c.dataset.item] || 0; c.querySelector('output').textContent = n; c.classList.toggle('tiene', n > 0); });
  const rec = recomendada(); ultimaRec = rec;
  if (!st.elegidaPorUsuario) {
    const nueva = rec || 7; if (rec === 0) st.bodega = 15; else if (nueva !== st.bodega) st.bodega = nueva;
  }
  ponerBodega(); b3.setItems(st.items); pintarOpciones(); precio();
}

// ---------- paso 2: bodega ----------
let bodegaEnEscena = null;
function ponerBodega() {
  const id = st.bodega || 7;
  if (bodegaEnEscena !== id) { bodegaEnEscena = id; b3.setSize(id, BODEGAS[id], BODEGAS[id].repisa); }
}
function pintarOpciones() {
  const rec = ultimaRec;
  $('#recomendacion').textContent = rec === null ? 'Elige el tamaño. Puedes volver al paso anterior para ver qué cabe.' :
    rec === 0 ? 'Lo que elegiste no cabe ni en 15 m². Elige 15 m² y te armamos una solución por WhatsApp (por ejemplo, dos bodegas).' :
    `Con lo que vas a guardar te recomendamos la de ${rec} m².`;
  $('#op-bodega').innerHTML = Object.values(BODEGAS).map((b) => `
    <label class="opcion">${rec === b.id ? '<span class="sello">Recomendada</span>' : ''}
      <input type="radio" name="bodega" value="${b.id}" ${st.bodega === b.id ? 'checked' : ''}>
      <span class="punto"></span><span class="titulo">${b.nombre} · ${b.m3} m³</span>
      <span class="sub">${b.alcanza}<br><span class="dato" style="font-size:13px">${fmt(b.largo)} × ${fmt(b.ancho)} × ${fmt(b.alto)} m</span></span>
      <span class="lado"><b>${clp(b.precio)}</b><br><span class="gris" style="font-size:13px">al mes</span></span>
    </label>`).join('');
  $('#op-plazo').innerHTML = PLAZOS.map((p) => {
    const c = calcular(st.bodega || 7, p.id, st.retiro);
    return `<label class="opcion">${p.id === 12 ? '<span class="sello">Mejor precio</span>' : ''}
      <input type="radio" name="plazo" value="${p.id}" ${st.plazo === p.id ? 'checked' : ''}>
      <span class="punto"></span><span class="titulo">${p.nombre}</span><span class="sub">${p.nota}</span>
      <span class="lado"><b>${clp(c.efectivo)}</b><br><span class="gris" style="font-size:13px">promedio al mes</span></span></label>`;
  }).join('');
  const gratis = PROMO.retiroGratisDesdeMeses;
  const c = calcular(st.bodega || 7, st.plazo, true);
  $('#sub-retiro').textContent = c.retiroGratis ? `Gratis en ${PROMO.retiroRadio}` : `Gratis desde ${gratis} meses. Si no, te cotizamos el flete`;
  $('#lado-retiro').innerHTML = c.retiroGratis ? '<b>Gratis</b>' : '<span class="gris">A cotizar</span>';
}
$('#op-bodega').addEventListener('change', (e) => { st.bodega = Number(e.target.value); st.elegidaPorUsuario = true; ponerBodega(); b3.setItems(st.items); pintarOpciones(); precio(); });
$('#op-plazo').addEventListener('change', (e) => { st.plazo = Number(e.target.value); pintarOpciones(); precio(); });
$('#op-traslado').addEventListener('change', (e) => {
  st.retiro = e.target.value === 'retiro'; $('#c-direccionRetiro').hidden = !st.retiro;
  b3.setVehiculo(st.retiro ? 'camion' : 'camioneta'); pintarOpciones(); precio();
});

// fecha: desde mañana hasta 120 días
const hoy = new Date(); const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const man = new Date(hoy); man.setDate(hoy.getDate() + 1); const tope = new Date(hoy); tope.setDate(hoy.getDate() + 120);
Object.assign($('#inicio'), { min: iso(man), max: iso(tope), value: iso(man) });

// ---------- precio ----------
function precio() {
  const id = st.bodega || 7; const c = calcular(id, st.plazo, st.retiro); const b = BODEGAS[id]; const p = PLAZOS.find((x) => x.id === st.plazo);
  $('#pf-nombre').textContent = `${b.nombre} · ${p.nombre}`; $('#bm-nombre').textContent = `${b.m2} m² · ${p.nombre}`;
  if (st.paso >= 2 && p.meses > 1) {
    $('#pf-mensual').textContent = clp(c.efectivo); $('#pf-detalle').textContent = `promedio al mes · ${clp(c.total)} por ${p.meses} meses`;
    $('#bm-precio').textContent = clp(c.efectivo); $('#bm-detalle').textContent = `promedio/mes\n${clp(c.total)} total`;
    $('#pf-tachado').textContent = c.ahorro > 0 ? `Ahorras ${clp(c.ahorro)}` : '';
  } else {
    $('#pf-mensual').textContent = clp(c.mensual); $('#pf-detalle').textContent = c.promo ? `al mes · primer mes ${clp(c.primerMes)}` : 'al mes';
    $('#bm-precio').textContent = clp(c.mensual); $('#bm-detalle').textContent = c.promo ? `1er mes ${clp(c.primerMes)}` : 'al mes';
    $('#pf-tachado').textContent = '';
  }
}

// ---------- navegación ----------
const pasos = $$('.paso-cot');
function ir(n) {
  st.paso = n; st.max = Math.max(st.max, n);
  pasos.forEach((p) => p.classList.toggle('activo', Number(p.dataset.paso) === n));
  $$('.progreso button').forEach((b) => {
    const i = Number(b.dataset.ir); b.disabled = i > st.max || n === 5;
    b.classList.toggle('hecho', i < n); if (i === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
  });
  if (n === 1 && !st.bodega) { st.bodega = ultimaRec || 7; ponerBodega(); pintarOpciones(); }
  if (n === 2) b3.setVehiculo(st.retiro ? 'camion' : 'camioneta');
  if (n === 4) resumen();
  precio();
  const cab = pasos[n].querySelector('h2'); if (cab) { cab.setAttribute('tabindex', '-1'); cab.focus({ preventScroll: true }); }
  scrollTo({ top: 0, behavior: 'smooth' });
}
$('#form').addEventListener('click', (e) => {
  if (e.target.closest('[data-sig]')) { if (validarPaso(st.paso)) ir(st.paso + 1); }
  else if (e.target.closest('[data-ant]')) ir(st.paso - 1);
  else { const b = e.target.closest('[data-ir]'); if (b && !b.disabled) ir(Number(b.dataset.ir)); }
});

// ---------- validación ----------
function err(id, msg) { const c = $('#c-' + id); if (!c) return; c.classList.toggle('mal', !!msg); c.querySelector('.error').textContent = msg || ''; }
function validarRut(rut) {
  const r = String(rut).replace(/[.\s-]/g, '').toUpperCase(); if (!/^\d{7,8}[0-9K]$/.test(r)) return false;
  let s = 0, m = 2; for (let i = r.length - 2; i >= 0; i--) { s += Number(r[i]) * m; m = m === 7 ? 2 : m + 1; }
  const x = 11 - (s % 11); return (x === 11 ? '0' : x === 10 ? 'K' : String(x)) === r.slice(-1);
}
function datos() {
  const f = $('#form'); const v = (n) => (f.elements[n]?.value || '').trim();
  return { nombre: v('nombre'), telefono: v('telefono').replace(/[^\d+]/g, ''), rut: v('rut'), email: v('email'), comuna: v('comuna'), comentario: v('comentario'),
    tipo: f.elements.tipo.value, empresa_web: v('empresa_web'), inicio: v('inicio'), direccionRetiro: v('direccionRetiro'),
    bodega: st.bodega, plazo: st.plazo, retiro: st.retiro, items: st.items };
}
function validarPaso(n) {
  const d = datos(); let ok = true; const f = (c, id, m) => { if (c) { err(id, m); ok = false; } else err(id, ''); };
  if (n === 2) {
    f(!d.inicio || d.inicio < $('#inicio').min || d.inicio > $('#inicio').max, 'inicio', 'Elige una fecha dentro de los próximos 4 meses');
    f(st.retiro && d.direccionRetiro.length < 5, 'direccionRetiro', 'Indica dónde retiramos tus cosas');
  }
  if (n === 3) {
    f(d.nombre.length < 3, 'nombre', 'Escribe tu nombre y apellido');
    f(!/^(\+?56)?9\d{8}$/.test(d.telefono), 'telefono', 'Usa un celular chileno: 9 1234 5678');
    f(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email), 'email', 'Revisa el correo');
    f(d.rut && !validarRut(d.rut), 'rut', 'El RUT no es válido');
  }
  if (!ok) { const p = $('.paso-cot.activo .mal input, .paso-cot.activo .mal select'); p && p.focus(); }
  return ok;
}
$('#rut').addEventListener('blur', (e) => {
  const r = e.target.value.replace(/[^\dkK]/g, '').toUpperCase(); if (r.length < 2) return;
  e.target.value = r.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + r.slice(-1);
});

// ---------- resumen y envío ----------
function resumen() {
  const d = datos(); const b = BODEGAS[st.bodega]; const p = PLAZOS.find((x) => x.id === st.plazo); const c = calcular(st.bodega, st.plazo, st.retiro);
  const fecha = new Date(d.inicio + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const n = Object.values(st.items).reduce((a, x) => a + x, 0);
  const filas = [
    ['Bodega', `${b.nombre} · Lampa`], ['Plazo', p.nombre], ['Inicio', fecha],
    ['Traslado', st.retiro ? (c.retiroGratis ? 'Retiro a domicilio · gratis' : 'Retiro a domicilio · a cotizar') : 'Las llevo yo'],
    ...(n ? [['Vas a guardar', `${n} cosas`]] : []),
    ['Valor mensual', clp(c.mensual)],
    ...(c.promo ? [[`Primer mes (${PROMO.nombre})`, clp(c.primerMes)]] : []),
    ...(p.meses > 1 ? [[`Total ${p.meses} meses${p.paga < p.meses ? ` (pagas ${p.paga})` : ''}`, clp(c.total)]] : []),
  ];
  $('#resumen').innerHTML = filas.map(([a, v]) => `<div class="resumen-fila"><span>${a}</span><span>${v}</span></div>`).join('') +
    `<div class="resumen-fila resumen-total"><span>Pagas al empezar</span><span>${clp(c.primerMes)}</span></div>`;
}
$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (st.paso !== 4) { if (validarPaso(st.paso)) ir(st.paso + 1); return; }
  const eg = $('#error-general'); eg.textContent = '';
  if (!$('#acepto').checked) { eg.textContent = 'Marca la casilla para que podamos contactarte.'; return; }
  const bt = $('#enviar'); bt.disabled = true; bt.textContent = 'Enviando…';
  try {
    const r = await fetch('/api/solicitud', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(datos()) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) {
      const e1 = j.errores || {}; eg.textContent = e1.general || 'Revisa los datos marcados.';
      for (const [k, v] of Object.entries(e1)) err(k, v);
      if (e1.nombre || e1.email || e1.telefono || e1.rut) ir(3); else if (e1.inicio || e1.direccionRetiro) ir(2);
      return;
    }
    const d = datos();
    $('#codigo').textContent = j.codigo;
    $('#listo-titulo').textContent = `Listo, ${d.nombre.split(' ')[0]}.`;
    $('#listo-texto').textContent = `Recibimos tu solicitud de la ${BODEGAS[st.bodega].nombre}. Te escribimos por WhatsApp ${NEGOCIO.respuesta} para confirmar y coordinar.`;
    $('#listo-wa').href = `https://wa.me/${NEGOCIO.whatsapp.replace('+', '')}?text=${encodeURIComponent(`Hola, acabo de enviar la solicitud ${j.codigo} para la ${BODEGAS[st.bodega].nombre}.`)}`;
    ir(5); b3.girar(0.9);
  } catch {
    eg.textContent = 'No pudimos enviar tu solicitud. Revisa tu conexión o escríbenos por WhatsApp.';
  } finally { bt.disabled = false; bt.textContent = 'Enviar solicitud de arriendo'; }
});

// arranque
syncItems();
if (st.elegidaPorUsuario && !Object.keys(st.items).length) { /* viene con tamaño elegido y sin objetos */ }
b3.setVehiculo('camioneta');
precio();
