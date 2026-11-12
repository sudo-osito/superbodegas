import { BODEGAS, PLAZOS, PROMO, NEGOCIO, clp } from './config.js';
import { ITEMS, GRUPOS, PRESETS } from './items.js';
import { calcular } from './precio.js';
import { empacar, expandir } from './pack.js';
import { cabecera } from './ui.js';
import { crearBodega, REPISA } from './bodega3d.js';

cabecera();
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const q = new URLSearchParams(location.search);
const st = {
  fase: 0,
  bodega: BODEGAS[q.get('bodega')] ? Number(q.get('bodega')) : 7,
  manual: !!BODEGAS[q.get('bodega')],
  items: PRESETS[q.get('preset')] ? { ...PRESETS[q.get('preset')].items } : {},
  preset: PRESETS[q.get('preset')] ? q.get('preset') : null,
  plazo: 3, retiro: false,
};
const FASES = 5;
const coma = (n) => String(n).replace('.', ',');
const total = () => Object.values(st.items).reduce((a, b) => a + b, 0);

// ---------- 3D integrado ----------
const b3 = crearBodega($('#escena'), { girar: true, distancia: 0.95, onPack: estado3d });
function estado3d(res) {
  const n = total(); const e = $('#estado'); const b = BODEGAS[st.bodega];
  e.classList.toggle('no', res.afuera.length > 0);
  $('#probar15').hidden = !(res.afuera.length && st.bodega === 7);
  if (!n) e.innerHTML = `Bodega de ${b.m2} m² <span>· ${coma(b.largo)} × ${coma(b.ancho)} × ${coma(b.alto)} m</span>`;
  else if (res.afuera.length) e.innerHTML = `${res.afuera.length === 1 ? 'Queda 1 cosa' : `Quedan ${res.afuera.length} cosas`} afuera`;
  else e.innerHTML = `Cabe todo en ${b.m2} m² <span>· ${Math.round(res.ocupacion * 100)} % ocupado</span>`;
}
function pintar3d() { b3.setItems(st.items); b3.setBodega(st.bodega, BODEGAS[st.bodega]); b3.mostrar(); }
$('#probar15').addEventListener('click', () => { st.bodega = 15; st.manual = true; refrescar(); });

// ---------- fase 0: qué guardas ----------
$('#atajos').innerHTML = Object.entries(PRESETS).map(([k, p]) => `
  <button type="button" class="op" data-preset="${k}" aria-pressed="${st.preset === k}"><span class="izq"><span class="nom">${p.nombre}</span><span class="det">${Object.values(p.items).reduce((a, b) => a + b, 0)} cosas</span></span></button>`).join('') +
  `<button type="button" class="op" data-preset="" aria-pressed="false"><span class="izq"><span class="nom">Todavía no sé</span><span class="det">Te ayudamos por WhatsApp</span></span></button>`;
$('#objetos').innerHTML = GRUPOS.map((g) => Object.entries(ITEMS).filter(([, it]) => it.grupo === g).map(([k, it]) => `
  <div class="fila"><span>${it.nombre}</span><span class="cont" data-item="${k}"><button type="button" data-d="-1" aria-label="Quitar ${it.nombre}">−</button><output>0</output><button type="button" data-d="1" aria-label="Agregar ${it.nombre}">+</button></span></div>`).join('')).join('');
$('#atajos').addEventListener('click', (e) => {
  const b = e.target.closest('[data-preset]'); if (!b) return;
  const k = b.dataset.preset; st.preset = k || ''; st.items = k ? { ...PRESETS[k].items } : {};
  cambioObjetos();
});
$('#ver-objetos').addEventListener('click', (e) => { const o = $('#objetos'); const ab = !o.classList.contains('abierto'); o.classList.toggle('abierto', ab); e.target.setAttribute('aria-expanded', ab); e.target.textContent = ab ? 'Ocultar la lista' : 'Elegir objeto por objeto'; });
$('#objetos').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-d]'); if (!b) return;
  const k = b.closest('[data-item]').dataset.item; const n = Math.max(0, Math.min(60, (st.items[k] || 0) + Number(b.dataset.d)));
  if (n) st.items[k] = n; else delete st.items[k]; st.preset = null; cambioObjetos();
});
function recomendada() {
  const lista = expandir(st.items); if (!lista.length) return null;
  for (const id of [7, 15]) { const b = BODEGAS[id]; if (!empacar(lista, b, b.repisa ? REPISA : null).afuera.length) return id; }
  return 0;
}
function cambioObjetos() {
  $$('[data-preset]').forEach((b) => b.setAttribute('aria-pressed', String(st.preset !== null && b.dataset.preset === st.preset)));
  $$('[data-item]').forEach((c) => (c.querySelector('output').textContent = st.items[c.dataset.item] || 0));
  const rec = recomendada(); if (!st.manual && rec !== null) st.bodega = rec || 15;
  refrescar();
}

// ---------- fase 1: bodega · fase 2: plazo · fase 3: fecha y traslado ----------
function pintarOpciones() {
  const rec = recomendada();
  $('#rec').textContent = rec === null ? 'Mismo fondo y mismo alto; cambia el ancho.' : rec === 0 ? 'No cabe ni en 15 m². Elige 15 m² y te escribimos con una solución.' : `Con lo que vas a guardar, te sirve la de ${rec} m².`;
  $('#op-bodega').innerHTML = Object.values(BODEGAS).map((b) => `
    <label class="op">${rec === b.id ? '<span class="marca">Recomendada</span>' : ''}
      <input type="radio" name="bodega" value="${b.id}" ${st.bodega === b.id ? 'checked' : ''}>
      <span class="izq"><span class="nom">${b.m2} m²</span><span class="det">${coma(b.largo)} × ${coma(b.ancho)} × ${coma(b.alto)} m · ${b.alcanza.split(',')[0]}</span></span>
      <span class="der">${clp(b.precio)}<small>al mes</small></span></label>`).join('');
  $('#op-plazo').innerHTML = PLAZOS.map((p) => { const c = calcular(st.bodega, p.id, st.retiro); return `
    <label class="op">${p.id === 12 ? '<span class="marca">Mejor precio</span>' : ''}
      <input type="radio" name="plazo" value="${p.id}" ${st.plazo === p.id ? 'checked' : ''}>
      <span class="izq"><span class="nom">${p.nombre}</span><span class="det">${p.nota}</span></span>
      <span class="der">${clp(p.meses > 1 ? c.efectivo : c.mensual)}<small>${p.meses > 1 ? 'promedio al mes' : 'al mes'}</small></span></label>`; }).join('');
  const c = calcular(st.bodega, st.plazo, true);
  $('#det-retiro').textContent = c.retiroGratis ? 'Gratis con tu plazo' : `Gratis desde ${PROMO.retiroGratisDesdeMeses} meses`;
}
$('#op-bodega').addEventListener('change', (e) => { st.bodega = Number(e.target.value); st.manual = true; refrescar(); });
$('#op-plazo').addEventListener('change', (e) => { st.plazo = Number(e.target.value); refrescar(); });
$('#op-traslado').addEventListener('change', (e) => { st.retiro = e.target.value === 'retiro'; $('#c-direccionRetiro').hidden = !st.retiro; refrescar(); });
const hoy = new Date(); const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const man = new Date(hoy); man.setDate(hoy.getDate() + 1); const tope = new Date(hoy); tope.setDate(hoy.getDate() + 120);
Object.assign($('#inicio'), { min: iso(man), max: iso(tope), value: iso(man) });
$('#inicio').addEventListener('change', () => barraTotal());

// ---------- total y navegación ----------
function barraTotal() {
  const c = calcular(st.bodega, st.plazo, st.retiro); const p = PLAZOS.find((x) => x.id === st.plazo);
  const f = new Date($('#inicio').value + 'T12:00:00');
  $('#t-nom').textContent = `Bodega ${st.bodega} m²${st.fase >= 2 ? ' · ' + p.nombre : ''}`;
  $('#t-det').textContent = st.fase >= 3 && !isNaN(f) ? `Desde el ${f.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })} · ${clp(c.mensual)} al mes` : `${clp(c.mensual)} al mes`;
  $('#t-monto').textContent = clp(c.primerMes);
  $('#t-sub').textContent = c.promo ? 'primer mes · 50 % de apertura' : 'pagas al empezar';
  $('#seguir').textContent = st.fase === FASES - 1 ? 'Arrienda' : 'Continuar';
  $('#atras').hidden = st.fase === 0;
}
function refrescar() { pintar3d(); pintarOpciones(); barraTotal(); }
function irFase(n) {
  st.fase = Math.max(0, Math.min(FASES - 1, n));
  $$('.fase').forEach((f) => f.classList.toggle('activa', Number(f.dataset.fase) === st.fase));
  $$('.pasos-i i').forEach((i, k) => i.classList.toggle('on', k <= st.fase));
  $('#prog-txt').textContent = `${st.fase + 1} de ${FASES}`;
  barraTotal(); $('#error-general').textContent = '';
  const h = $('.fase.activa h1'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
  if (innerWidth < 960) scrollTo({ top: 0, behavior: 'smooth' });
}
$('#atras').addEventListener('click', () => irFase(st.fase - 1));

// ---------- validación y envío ----------
function err(id, m) { const c = $('#c-' + id); if (!c) return; c.classList.toggle('mal', !!m); c.querySelector('.error').textContent = m || ''; }
function rutOk(rut) {
  const r = String(rut).replace(/[.\s-]/g, '').toUpperCase(); if (!/^\d{7,8}[0-9K]$/.test(r)) return false;
  let s = 0, m = 2; for (let i = r.length - 2; i >= 0; i--) { s += Number(r[i]) * m; m = m === 7 ? 2 : m + 1; }
  const x = 11 - (s % 11); return (x === 11 ? '0' : x === 10 ? 'K' : String(x)) === r.slice(-1);
}
$('#rut').addEventListener('blur', (e) => { const r = e.target.value.replace(/[^\dkK]/g, '').toUpperCase(); if (r.length > 1) e.target.value = r.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + r.slice(-1); });
function datos() {
  const f = $('#form').elements; const v = (n) => (f[n]?.value || '').trim();
  return { nombre: v('nombre'), telefono: v('telefono').replace(/[^\d+]/g, ''), rut: v('rut'), email: v('email'), comuna: v('comuna'), comentario: v('comentario'),
    tipo: 'persona', empresa_web: v('empresa_web'), inicio: v('inicio'), direccionRetiro: v('direccionRetiro'), bodega: st.bodega, plazo: st.plazo, retiro: st.retiro, items: st.items };
}
function validarFase(n, d) {
  const e = {};
  if (n === 3) {
    if (!d.inicio || d.inicio < $('#inicio').min || d.inicio > $('#inicio').max) e.inicio = 'Elige una fecha dentro de los próximos 4 meses';
    if (st.retiro && d.direccionRetiro.length < 5) e.direccionRetiro = 'Indica dónde retiramos tus cosas';
  }
  if (n === 4) {
    if (d.nombre.length < 3) e.nombre = 'Escribe tu nombre y apellido';
    if (!/^(\+?56)?9\d{8}$/.test(d.telefono)) e.telefono = 'Usa un celular chileno: 9 1234 5678';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.email = 'Revisa el correo';
    if (d.rut && !rutOk(d.rut)) e.rut = 'El RUT no es válido';
  }
  ['inicio', 'direccionRetiro', 'nombre', 'telefono', 'email', 'rut'].forEach((k) => err(k, e[k]));
  const k = Object.keys(e)[0]; if (k) $('#' + k)?.focus();
  return !k;
}
$('#form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const d = datos();
  if (!validarFase(st.fase, d)) return;
  if (st.fase < FASES - 1) { irFase(st.fase + 1); return; }
  const eg = $('#error-general');
  if (!$('#acepto').checked) { eg.textContent = 'Marca la casilla para que podamos contactarte.'; $('#acepto').focus(); return; }
  const bt = $('#seguir'); bt.disabled = true; bt.textContent = 'Enviando…';
  try {
    const r = await fetch('/api/solicitud', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) { const e2 = j.errores || {}; Object.entries(e2).forEach(([k, m]) => err(k, m)); eg.textContent = e2.general || 'Revisa los datos marcados.'; return; }
    $('#arr').hidden = true; $('#total').hidden = true; $('#listo').hidden = false;
    $('#codigo').textContent = j.codigo;
    $('#listo-titulo').textContent = `Listo, ${d.nombre.split(' ')[0]}.`;
    $('#listo-texto').textContent = `Tu bodega de ${st.bodega} m² está en buenas manos. Te escribimos por WhatsApp ${NEGOCIO.respuesta} para confirmar.`;
    $('#listo-wa').href = `https://wa.me/${NEGOCIO.whatsapp.replace('+', '')}?text=${encodeURIComponent(`Hola, envié la solicitud ${j.codigo} para la bodega de ${st.bodega} m².`)}`;
    scrollTo({ top: 0 });
  } catch { eg.textContent = 'No pudimos enviar tu solicitud. Revisa tu conexión o escríbenos por WhatsApp.'; }
  finally { bt.disabled = false; barraTotal(); }
});

// arranque: si viene con tamaño elegido desde el inicio, igual parte preguntando qué guardas
cambioObjetos(); irFase(0);
