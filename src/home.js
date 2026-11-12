import { BODEGAS, COMPARA, NEGOCIO, PROMO, clp } from './config.js';
import { PRESETS, ITEMS } from './items.js';
import { plano, cabecera, revelar, cuando } from './ui.js';

cabecera();

// precios desde la configuración (una sola fuente)
document.querySelectorAll('[data-precio]').forEach((el) => { el.firstChild.textContent = clp(BODEGAS[el.dataset.precio].precio) + ' '; });
if (!PROMO.activa) document.querySelectorAll('[data-promo]').forEach((el) => el.remove());
document.querySelectorAll('[data-plano]').forEach((el) => { el.innerHTML = plano(Number(el.dataset.plano)); });

// ---------- ¿Qué cabe? ----------
const host = document.getElementById('escena-cabe');
const estado = { preset: 'depto1', size: 7 };
const total = (p) => Object.values(PRESETS[p].items).reduce((a, b) => a + b, 0);
document.querySelectorAll('.escenario').forEach((b) => { b.querySelector('.etiqueta').textContent = total(b.dataset.preset) + ' cosas'; });

const pct = document.getElementById('cabe-pct'), barra = document.getElementById('cabe-barra'), ver = document.getElementById('cabe-veredicto');
const cta = document.getElementById('cabe-cta'), meta = document.getElementById('cabe-meta');
let b3 = null;

function pintar(res) {
  const p = Math.round(res.ocupacion * 100);
  pct.textContent = p + ' %'; barra.style.width = p + '%';
  const b = BODEGAS[estado.size]; const n = res.afuera.length;
  ver.classList.toggle('no', n > 0);
  if (n > 0) {
    const otro = estado.size === 7 ? 15 : null;
    ver.innerHTML = `No cabe en ${b.m2} m²: quedan ${n} ${n === 1 ? 'cosa' : 'cosas'} afuera.` + (otro ? ` <button class="chip" data-a15 style="margin-top:8px">Probar con 15 m²</button>` : ' Escríbenos y te armamos una solución.');
    const bt = ver.querySelector('[data-a15]'); if (bt) bt.onclick = () => elegirSize(15);
  } else {
    ver.textContent = p < 45 ? `Cabe de sobra en ${b.m2} m². Te queda espacio para crecer.` : `Cabe todo en ${b.m2} m², ordenado de fondo a puerta.`;
  }
  cta.href = `/cotizar.html?bodega=${estado.size}&preset=${estado.preset}`;
  meta.innerHTML = `<span>${String(b.largo).replace('.', ',')} × ${String(b.ancho).replace('.', ',')} × ${String(b.alto).replace('.', ',')} m</span><span>${b.m3} m³</span><span>${clp(b.precio)} / mes</span>`;
}
function elegirSize(s) {
  estado.size = s;
  document.querySelectorAll('[data-size]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.size) === s)));
  if (b3) { b3.setSize(s, BODEGAS[s], BODEGAS[s].repisa); }
}
function elegirPreset(p) {
  estado.preset = p;
  document.querySelectorAll('.escenario').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === p)));
  if (b3) b3.setItems(PRESETS[p].items);
}
document.querySelectorAll('.escenario').forEach((b) => b.addEventListener('click', () => elegirPreset(b.dataset.preset)));
document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => elegirSize(Number(b.dataset.size))));

cuando(host, async () => {
  const { crearBodega } = await import('./bodega3d.js');
  b3 = crearBodega(host, { onPack: pintar });
  b3.setItems(PRESETS[estado.preset].items);
  b3.setSize(estado.size, BODEGAS[estado.size], BODEGAS[estado.size].repisa);
}, '300px');

// ---------- comparación de precio por m² ----------
const filas = [
  { nombre: 'Super Bodegas · 15 m²', v: BODEGAS[15].precio / 15, nuestra: true },
  { nombre: 'Super Bodegas · 7 m²', v: BODEGAS[7].precio / 7, nuestra: true },
  ...COMPARA.map((c) => ({ nombre: `${c.lugar} · ${String(c.m2).replace('.', ',')} m²`, v: c.precio / c.m2 })),
].sort((a, b) => a.v - b.v);
const max = Math.max(...filas.map((f) => f.v));
document.getElementById('barras').innerHTML = filas.map((f) => `
  <div class="barra${f.nuestra ? ' nuestra' : ''}" style="--k:${(f.v / max).toFixed(3)}">
    <span class="barra-nombre">${f.nombre}</span><span class="barra-valor">${clp(f.v)} / m²</span>
    <div class="barra-pista"><i></i></div>
  </div>`).join('');

// ---------- mapa ----------
cuando(document.getElementById('mapa'), async () => {
  const L = (await import('leaflet')).default; await import('leaflet/dist/leaflet.css');
  const { lat, lng, zoom } = NEGOCIO.mapa;
  const mapa = L.map('mapa', { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView([lat, lng], zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(mapa);
  const icono = L.divIcon({ className: '', iconSize: [46, 46], iconAnchor: [23, 23], html: '<div class="marca-mapa"><svg viewBox="0 0 40 40"><path d="M9 31V12.5L20 7l11 5.5V31" fill="none" stroke="#111" stroke-width="3.4" stroke-linejoin="round"/><path d="M14 31V18h12v13M20 18v13" fill="none" stroke="#111" stroke-width="3" stroke-linejoin="round"/></svg></div>' });
  L.marker([lat, lng], { icon: icono, title: 'Super Bodegas · Lampa' }).addTo(mapa).bindTooltip('Super Bodegas · Lampa', { direction: 'top', offset: [0, -26] });
}, '400px');

revelar();
