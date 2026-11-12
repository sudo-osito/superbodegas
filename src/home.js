import { BODEGAS, NEGOCIO, clp } from './config.js';
import { PRESETS } from './items.js';
import { revelar, cuando } from './ui.js';

revelar();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const lim = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
// avance de una sección alta con escena fija: 0 al entrar, 1 al salir
const avanceDe = (el) => { const r = el.getBoundingClientRect(); return lim(-r.top / (r.height - innerHeight)); };

// precios desde una sola fuente
$$('[data-precio]').forEach((el) => (el.textContent = clp(BODEGAS[el.dataset.precio].precio)));
$$('[data-desde]').forEach((el) => (el.textContent = clp(Math.min(...Object.values(BODEGAS).map((b) => b.precio)))));

// ---------- isla: línea de avance de la página ----------
const avance = $('#avance');

// ---------- héroe: palabra que se escribe y se borra ----------
const PALABRAS = ['mudanza.', 'emprendimiento.', 'casa entera.', 'herramientas.', 'remodelación.'];
const esc = $('#escribe');
if (!reduce) (async () => {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  let i = 0;
  for (;;) {
    await espera(2200);
    for (let t = esc.textContent; t.length; t = t.slice(0, -1)) { esc.textContent = t.slice(0, -1); await espera(38); }
    i = (i + 1) % PALABRAS.length;
    for (const ch of PALABRAS[i]) { esc.textContent += ch; await espera(70); }
  }
})();

function alBajar() { avance.style.transform = `scaleX(${lim(scrollY / (document.documentElement.scrollHeight - innerHeight))})`; }
addEventListener('scroll', alBajar, { passive: true }); alBajar();

// ---------- superfuerza: escena fija, la bodega se llena con el scroll ----------
const sec = $('#fuerza'); const host = $('#escena');
const estados = $$('#fuerza .estado-txt'); const marcas = $$('#fuerza .avance i');
const ETAPAS = [{ id: 7, preset: 'depto1' }, { id: 15, preset: 'casa3' }];
let b3 = null, etapa = -1;
function actualizar() {
  if (!b3) return;
  const p = avanceDe(sec) * ETAPAS.length; const e = Math.min(ETAPAS.length - 1, Math.floor(p)); const dentro = Math.min(1, (p - e) * 1.35);
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
const cartas = $$('[data-carta]');
cartas.forEach((c) => { const on = () => cartas.forEach((x) => x.classList.toggle('activa', x === c)); c.addEventListener('mouseenter', on); c.addEventListener('focus', on); });

// ---------- mapa ----------
cuando($('#mapa'), async () => {
  const L = (await import('leaflet')).default; await import('leaflet/dist/leaflet.css');
  const { lat, lng, zoom } = NEGOCIO.mapa; const chico = innerWidth < 760;
  const mapa = L.map('mapa', { scrollWheelZoom: false, zoomControl: false, attributionControl: true }).setView([lat - (chico ? 0.03 : 0), lng - (chico ? 0 : 0.09)], zoom);
  L.control.zoom({ position: 'bottomright' }).addTo(mapa);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(mapa);
  const icono = L.divIcon({ className: '', iconSize: [56, 56], iconAnchor: [28, 28], html: '<img class="pin" src="/marca/icono-180.png" alt="">' });
  L.marker([lat, lng], { icon: icono, title: 'Super Bodegas · Lampa' }).addTo(mapa);
}, '400px');
