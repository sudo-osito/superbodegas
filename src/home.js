import { BODEGAS, COMPARA, NEGOCIO, clp } from './config.js';
import { PRESETS } from './items.js';
import { cabecera, revelar, cuando } from './ui.js';

cabecera();
revelar();

// precios desde una sola fuente
document.querySelectorAll('[data-precio]').forEach((el) => (el.textContent = clp(BODEGAS[el.dataset.precio].precio)));
document.querySelectorAll('[data-desde]').forEach((el) => (el.textContent = clp(Math.min(...Object.values(BODEGAS).map((b) => b.precio)))));
const lc = COMPARA.find((c) => c.m2 === 14);
if (lc) document.querySelectorAll('[data-ahorro]').forEach((el) => (el.textContent = Math.round((1 - BODEGAS[15].precio / lc.precio) * 100) + ' % menos'));

// la foto del inicio se acerca apenas al bajar
const img = document.getElementById('hero-img');
if (img && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const f = () => { const r = img.parentElement.getBoundingClientRect(); const k = Math.min(1, Math.max(0, -r.top / r.height)); img.style.transform = `scale(${1.06 - 0.06 * Math.min(1, (innerHeight - r.top) / (innerHeight + r.height))})`; };
  f(); addEventListener('scroll', f, { passive: true });
}

// ---------- la bodega que se llena con el scroll ----------
const host = document.getElementById('escena');
const pasos = [...document.querySelectorAll('.paso')];
const medidas = document.getElementById('medidas');
let b3 = null, actual = -1;

function ponerMedidas(id) {
  const b = BODEGAS[id];
  medidas.innerHTML = `<span><b>${String(b.largo).replace('.', ',')} m</b> de fondo</span><span><b>${String(b.ancho).replace('.', ',')} m</b> de ancho</span><span><b>${String(b.alto).replace('.', ',')} m</b> de alto</span>`;
}
function irPaso(i) {
  if (i === actual || !b3) return; actual = i;
  pasos.forEach((p, k) => p.classList.toggle('activo', k === i));
  const p = pasos[i]; const id = Number(p.dataset.bodega);
  b3.setItems(p.dataset.preset ? PRESETS[p.dataset.preset].items : {});
  b3.setBodega(id, BODEGAS[id]);
  b3.mostrar(0); ponerMedidas(id);
  avance();
}
// dentro de cada paso, los objetos entran a medida que bajas
function avance() {
  if (!b3 || actual < 0) return;
  const p = pasos[actual]; const r = p.getBoundingClientRect();
  const ref = innerWidth < 900 ? innerHeight * 0.95 : innerHeight * 0.75;
  const k = Math.min(1, Math.max(0, (ref - r.top) / (r.height * 0.75)));
  b3.mostrar(Math.round(b3.total * k));
}
function cual() {
  const medio = innerWidth < 900 ? innerHeight * 0.8 : innerHeight * 0.5; let mejor = 0, dist = Infinity;
  pasos.forEach((p, i) => { const r = p.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - medio); if (d < dist) { dist = d; mejor = i; } });
  return mejor;
}
cuando(host, async () => {
  const { crearBodega } = await import('./bodega3d.js');
  b3 = crearBodega(host, { girar: true, distancia: innerWidth < 900 ? 0.98 : 0.74 });
  irPaso(cual());
  addEventListener('scroll', () => { const i = cual(); if (i !== actual) irPaso(i); else avance(); }, { passive: true });
}, '600px');

// ---------- mapa ----------
cuando(document.getElementById('mapa'), async () => {
  const L = (await import('leaflet')).default; await import('leaflet/dist/leaflet.css');
  const { lat, lng, zoom } = NEGOCIO.mapa;
  const mapa = L.map('mapa', { scrollWheelZoom: false, zoomControl: false, attributionControl: true }).setView([lat, lng], zoom);
  L.control.zoom({ position: 'bottomright' }).addTo(mapa);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(mapa);
  const icono = L.divIcon({ className: '', iconSize: [52, 52], iconAnchor: [26, 26], html: '<img class="pin" src="/marca/marca-abierta.svg" alt="">' });
  L.marker([lat, lng], { icon: icono, title: 'Super Bodegas · Lampa' }).addTo(mapa);
}, '400px');
