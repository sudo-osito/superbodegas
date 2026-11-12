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
  bodega: BODEGAS[q.get('bodega')] ? Number(q.get('bodega')) : 7,
  manual: !!BODEGAS[q.get('bodega')],
  items: PRESETS[q.get('preset')] ? { ...PRESETS[q.get('preset')].items } : {},
  preset: PRESETS[q.get('preset')] ? q.get('preset') : null,
  plazo: 3, retiro: false,
};
const coma = (n) => String(n).replace('.', ',');

// ---------- 3D ----------
const b3 = crearBodega($('#escena'), { fondo: 0xf5f5f7, distancia: 1.02, onPack: estado3d });
function estado3d(res) {
  const n = Object.values(st.items).reduce((a, b) => a + b, 0); const p = Math.round(res.ocupacion * 100);
  const i = $('#barra'); i.style.width = (n ? p : 0) + '%'; i.classList.toggle('lleno', res.afuera.length > 0);
  $('#estado-txt').textContent = !n ? `Bodega de ${st.bodega} m² · ${coma(BODEGAS[st.bodega].largo)} × ${coma(BODEGAS[st.bodega].ancho)} × ${coma(BODEGAS[st.bodega].alto)} m`
    : res.afuera.length ? `No cabe todo: quedan ${res.afuera.length} ${res.afuera.length === 1 ? 'cosa' : 'cosas'} afuera` : `Cabe todo en ${st.bodega} m²`;
  $('#estado-pct').textContent = n ? p + ' %' : '';
}
function pintar3d() { b3.setItems(st.items); b3.setBodega(st.bodega, BODEGAS[st.bodega]); b3.mostrar(); }

// ---------- tamaño ----------
function recomendada() {
  const lista = expandir(st.items); if (!lista.length) return null;
  for (const id of [7, 15]) { const b = BODEGAS[id]; if (!empacar(lista, b, b.repisa ? REPISA : null).afuera.length) return id; }
  return 0;
}
function pintarBodegas() {
  const rec = recomendada();
  $('#op-bodega').innerHTML = Object.values(BODEGAS).map((b) => `
    <label class="op">${rec === b.id ? '<span class="marca">Recomendada</span>' : ''}
      <input type="radio" name="bodega" value="${b.id}" ${st.bodega === b.id ? 'checked' : ''}>
      <span class="izq"><span class="nom">${b.m2} m²</span><span class="det">${coma(b.largo)} × ${coma(b.ancho)} × ${coma(b.alto)} m · ${b.alcanza.split(',')[0]}</span></span>
      <span class="der">${clp(b.precio)}<small>al mes</small></span>
    </label>`).join('');
  $('#rec').textContent = rec === null ? 'Elige una opción y te decimos qué tamaño te sirve.'
    : rec === 0 ? 'No cabe ni en 15 m². Elige 15 m² y te escribimos con una solución, por ejemplo dos bodegas.'
    : `Te sirve la de ${rec} m².`;
}
$('#op-bodega').addEventListener('change', (e) => { st.bodega = Number(e.target.value); st.manual = true; pintar3d(); pintarPlazos(); total(); });

// ---------- qué guardas ----------
$('#atajos').innerHTML = Object.entries(PRESETS).map(([k, p]) => `<button type="button" class="atajo" data-preset="${k}" aria-pressed="${st.preset === k}">${p.nombre}</button>`).join('');
$('#objetos').innerHTML = GRUPOS.map((g) => Object.entries(ITEMS).filter(([, it]) => it.grupo === g).map(([k, it]) => `
  <div class="fila"><span>${it.nombre}</span><span class="cont" data-item="${k}"><button type="button" data-d="-1" aria-label="Quitar ${it.nombre}">−</button><output>0</output><button type="button" data-d="1" aria-label="Agregar ${it.nombre}">+</button></span></div>`).join('')).join('');
$('#atajos').addEventListener('click', (e) => {
  const b = e.target.closest('[data-preset]'); if (!b) return;
  if (st.preset === b.dataset.preset) { st.preset = null; st.items = {}; } else { st.preset = b.dataset.preset; st.items = { ...PRESETS[st.preset].items }; }
  cambioObjetos();
});
$('#ver-objetos').addEventListener('click', (e) => { const o = $('#objetos'); const ab = !o.classList.contains('abierto'); o.classList.toggle('abierto', ab); e.target.setAttribute('aria-expanded', ab); e.target.textContent = ab ? 'Ocultar la lista' : 'Elegir objeto por objeto'; });
$('#objetos').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-d]'); if (!b) return;
  const k = b.closest('[data-item]').dataset.item; const n = Math.max(0, Math.min(60, (st.items[k] || 0) + Number(b.dataset.d)));
  if (n) st.items[k] = n; else delete st.items[k]; st.preset = null; cambioObjetos();
});
function cambioObjetos() {
  $$('.atajo').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === st.preset)));
  $$('[data-item]').forEach((c) => (c.querySelector('output').textContent = st.items[c.dataset.item] || 0));
  const rec = recomendada(); if (!st.manual && rec !== null) st.bodega = rec || 15;
  pintarBodegas(); pintar3d(); pintarPlazos(); total();
}

// ---------- plazo, fecha, traslado ----------
function pintarPlazos() {
  $('#op-plazo').innerHTML = PLAZOS.map((p) => { const c = calcular(st.bodega, p.id, st.retiro); return `
    <label class="op">${p.id === 12 ? '<span class="marca">Mejor precio</span>' : ''}
      <input type="radio" name="plazo" value="${p.id}" ${st.plazo === p.id ? 'checked' : ''}>
      <span class="izq"><span class="nom">${p.nombre}</span><span class="det">${p.nota}</span></span>
      <span class="der">${clp(p.meses > 1 ? c.efectivo : c.mensual)}<small>${p.meses > 1 ? 'promedio al mes' : 'al mes'}</small></span>
    </label>`; }).join('');
  const c = calcular(st.bodega, st.plazo, true);
  $('#det-retiro').textContent = c.retiroGratis ? 'Gratis con este plazo' : `Gratis desde ${PROMO.retiroGratisDesdeMeses} meses`;
}
$('#op-plazo').addEventListener('change', (e) => { st.plazo = Number(e.target.value); pintarPlazos(); total(); });
$('#op-traslado').addEventListener('change', (e) => { st.retiro = e.target.value === 'retiro'; $('#c-direccionRetiro').hidden = !st.retiro; pintarPlazos(); total(); });
const hoy = new Date(); const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const man = new Date(hoy); man.setDate(hoy.getDate() + 1); const tope = new Date(hoy); tope.setDate(hoy.getDate() + 120);
Object.assign($('#inicio'), { min: iso(man), max: iso(tope), value: iso(man) });
$('#inicio').addEventListener('change', total);

// ---------- total ----------
function total() {
  const c = calcular(st.bodega, st.plazo, st.retiro); const p = PLAZOS.find((x) => x.id === st.plazo);
  const fecha = new Date($('#inicio').value + 'T12:00:00');
  $('#t-nom').textContent = `Bodega ${st.bodega} m² · ${p.nombre}`;
  $('#t-det').textContent = `Desde el ${isNaN(fecha) ? '—' : fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })} · ${clp(c.mensual)} al mes${p.meses > 1 ? ` · ${clp(c.total)} en ${p.meses} meses` : ''}`;
  $('#t-monto').textContent = clp(c.primerMes);
  $('#t-sub').textContent = c.promo ? `primer mes, 50 % de apertura` : 'pagas al empezar';
}

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
function validar(d) {
  const e = {};
  if (!d.inicio || d.inicio < $('#inicio').min || d.inicio > $('#inicio').max) e.inicio = 'Elige una fecha dentro de los próximos 4 meses';
  if (st.retiro && d.direccionRetiro.length < 5) e.direccionRetiro = 'Indica dónde retiramos tus cosas';
  if (d.nombre.length < 3) e.nombre = 'Escribe tu nombre y apellido';
  if (!/^(\+?56)?9\d{8}$/.test(d.telefono)) e.telefono = 'Usa un celular chileno: 9 1234 5678';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.email = 'Revisa el correo';
  if (d.rut && !rutOk(d.rut)) e.rut = 'El RUT no es válido';
  return e;
}
$('#form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const d = datos(); const e = validar(d); const eg = $('#error-general');
  ['inicio', 'direccionRetiro', 'nombre', 'telefono', 'email', 'rut'].forEach((k) => err(k, e[k]));
  eg.textContent = '';
  if (Object.keys(e).length) { const k = Object.keys(e)[0]; const el = $('#' + k); el && el.focus(); el && el.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
  if (!$('#acepto').checked) { eg.textContent = 'Marca la casilla para que podamos contactarte.'; $('#acepto').focus(); return; }
  const bt = $('#enviar'); bt.disabled = true; bt.textContent = 'Enviando…';
  try {
    const r = await fetch('/api/solicitud', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) { const e2 = j.errores || {}; Object.entries(e2).forEach(([k, m]) => err(k, m)); eg.textContent = e2.general || 'Revisa los datos marcados.'; return; }
    $('#arr').hidden = true; $('#total').hidden = true; $('#listo').hidden = false;
    $('#codigo').textContent = j.codigo;
    $('#listo-titulo').textContent = `Listo, ${d.nombre.split(' ')[0]}.`;
    $('#listo-texto').textContent = `Recibimos tu solicitud de la bodega de ${st.bodega} m². Te escribimos por WhatsApp ${NEGOCIO.respuesta} para confirmar.`;
    $('#listo-wa').href = `https://wa.me/${NEGOCIO.whatsapp.replace('+', '')}?text=${encodeURIComponent(`Hola, envié la solicitud ${j.codigo} para la bodega de ${st.bodega} m².`)}`;
    scrollTo({ top: 0 });
  } catch { eg.textContent = 'No pudimos enviar tu solicitud. Revisa tu conexión o escríbenos por WhatsApp.'; }
  finally { bt.disabled = false; bt.textContent = 'Arrienda'; }
});

// arranque
cambioObjetos();
