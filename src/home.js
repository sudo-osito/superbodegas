import { BODEGAS, COMPARA, NEGOCIO, clp } from './config.js';
import { PRESETS } from './items.js';
import { cabecera, revelar, cuando } from './ui.js';

cabecera();
revelar();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// precios desde una sola fuente
document.querySelectorAll('[data-precio]').forEach((el) => (el.textContent = clp(BODEGAS[el.dataset.precio].precio)));
document.querySelectorAll('[data-desde]').forEach((el) => (el.textContent = clp(Math.min(...Object.values(BODEGAS).map((b) => b.precio)))));
const lc = COMPARA.find((c) => c.m2 === 14);
document.querySelector('[data-lc-precio]').textContent = clp(lc.precio) + ' al mes';
document.querySelector('[data-sb-precio]').textContent = clp(BODEGAS[15].precio * 2) + ' al mes · 2 bodegas';

// hero: la foto se acerca apenas al bajar
const img = document.getElementById('hero-img');
if (!reduce) { const f = () => { const k = Math.min(1, scrollY / innerHeight); img.style.transform = `scale(${1.04 + k * 0.06}) translateY(${k * 4}%)`; }; f(); addEventListener('scroll', f, { passive: true }); }

// ---------- superfuerza: escena fija, la bodega se llena con el scroll ----------
const sec = document.getElementById('fuerza'); const host = document.getElementById('escena');
const estados = [...sec.querySelectorAll('.estado-txt')]; const marcas = [...sec.querySelectorAll('.avance i')];
const ETAPAS = [{ id: 7, preset: 'depto1' }, { id: 15, preset: 'casa3' }];
let b3 = null, etapa = -1;
function progreso() { const r = sec.getBoundingClientRect(); return Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); }
function actualizar() {
  if (!b3) return;
  const p = progreso() * ETAPAS.length; const e = Math.min(ETAPAS.length - 1, Math.floor(p)); const dentro = Math.min(1, (p - e) * 1.35);
  if (e !== etapa) {
    etapa = e; const E = ETAPAS[e];
    estados.forEach((x, i) => x.classList.toggle('activo', i === e)); marcas.forEach((x, i) => x.classList.toggle('on', i <= e));
    b3.setItems(PRESETS[E.preset].items); b3.setBodega(E.id, BODEGAS[E.id]); b3.mostrar(0);
  }
  b3.mostrar(Math.round(b3.total * dentro));
}
cuando(host, async () => {
  const { crearBodega } = await import('./bodega3d.js');
  b3 = crearBodega(host, { girar: false, distancia: innerWidth < 900 ? 1.08 : 1.02 });
  actualizar(); addEventListener('scroll', actualizar, { passive: true });
}, '800px');

// ---------- tamaños: la carta apuntada se agranda ----------
const cartas = [...document.querySelectorAll('[data-carta]')];
cartas.forEach((c) => { const on = () => cartas.forEach((x) => x.classList.toggle('activa', x === c)); c.addEventListener('mouseenter', on); c.addEventListener('focus', on); });

// ---------- superprecio: los m² aparecen cuadro a cuadro ----------
document.querySelectorAll('[data-celdas]').forEach((el) => {
  const n = +el.dataset.celdas, corte = +(el.dataset.corte || 0);
  el.innerHTML = Array.from({ length: n }, (_, i) => `<i${corte && i === corte ? ' class="corte"' : ''}></i>`).join('');
});
cuando(document.getElementById('metros'), () => {
  document.querySelectorAll('[data-celdas]').forEach((el, f) => [...el.children].forEach((c, i) => setTimeout(() => c.classList.add('on'), reduce ? 0 : 250 + f * 500 + i * 28)));
}, '-25% 0px');

// ---------- mapa ----------
cuando(document.getElementById('mapa'), async () => {
  const L = (await import('leaflet')).default; await import('leaflet/dist/leaflet.css');
  const { lat, lng, zoom } = NEGOCIO.mapa;
  const chico = innerWidth < 760;
  const mapa = L.map('mapa', { scrollWheelZoom: false, zoomControl: false, attributionControl: true }).setView([lat - (chico ? 0.03 : 0), lng - (chico ? 0 : 0.09)], zoom);
  L.control.zoom({ position: 'bottomright' }).addTo(mapa);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(mapa);
  const icono = L.divIcon({ className: '', iconSize: [56, 56], iconAnchor: [28, 28], html: '<img class="pin" src="/marca/icono-180.png" alt="">' });
  L.marker([lat, lng], { icon: icono, title: 'Super Bodegas · Lampa' }).addTo(mapa);
}, '400px');
