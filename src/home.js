import { BODEGAS, COMPARA, NEGOCIO, clp } from './config.js';
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
const lc = COMPARA.find((c) => c.m2 === 14);
$('[data-lc-precio]').textContent = clp(lc.precio) + ' al mes';
$('[data-sb-precio]').textContent = clp(BODEGAS[15].precio * 2) + ' al mes · 2 bodegas';

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

// ---------- desafío: los dolores aparecen alrededor de la pregunta y luego se revela la marca ----------
const desafio = $('#desafio'); const dolores = $$('.dolor'); const centros = $$('[data-c]');
function pintarDesafio() {
  const p = avanceDe(desafio);
  dolores.forEach((d, i) => { const en = 0.06 + i * 0.09; d.classList.toggle('on', p >= en && p < 0.62); d.classList.toggle('fuera', p >= 0.62); });
  const fase = p < 0.62 ? 0 : p < 0.8 ? 1 : 2;
  centros.forEach((c) => c.classList.toggle('oculto', Number(c.dataset.c) !== fase));
}

// ---------- sin / con: el nervio se enciende fila por fila ----------
const sincon = $('#sincon'); const nervios = $$('.sincon .nervio'); const conCeldas = $$('.sincon .celda.con');
function pintarSincon() {
  const r = sincon.getBoundingClientRect(); const k = lim((innerHeight * 0.82 - r.top) / (r.height * 0.9));
  nervios.forEach((n, i) => { const on = k > (i + 0.5) / nervios.length; n.classList.toggle('on', on); conCeldas[i].classList.toggle('on', on); });
}

// ---------- superpoderes: tarjetas que se apilan ----------
const tarjetas = $$('.tarjeta-pila');
function pintarPila() {
  tarjetas.forEach((t, i) => {
    const sig = tarjetas[i + 1]; if (!sig) { t.style.transform = ''; t.style.filter = ''; return; }
    const r = sig.getBoundingClientRect(); const k = lim(1 - (r.top - 90) / (innerHeight * 0.8));
    t.style.transform = `scale(${1 - k * 0.06})`; t.style.filter = `brightness(${1 - k * 0.12})`;
  });
}

// ---------- banda naranja: parallax del eco y la mascota ----------
const banda = $('#banda'); const eco = $('.banda .eco'); const masc = $('.mascota-banda');
function pintarBanda() {
  const r = banda.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
  const k = (innerHeight - r.top) / (innerHeight + r.height) - 0.5;
  eco.style.transform = `translateX(${k * -30}%)`; masc.style.transform = `translate(${k * -60}px, ${k * -160}px) rotate(${k * 10}deg)`;
}

function alBajar() {
  avance.style.transform = `scaleX(${lim(scrollY / (document.documentElement.scrollHeight - innerHeight))})`;
  pintarDesafio(); pintarSincon(); if (!reduce) { pintarPila(); pintarBanda(); }
}
addEventListener('scroll', alBajar, { passive: true }); addEventListener('resize', alBajar); alBajar();

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

// ---------- superprecio: los m² aparecen cuadro a cuadro ----------
$$('[data-celdas]').forEach((el) => {
  const n = +el.dataset.celdas, corte = +(el.dataset.corte || 0);
  el.innerHTML = Array.from({ length: n }, (_, i) => `<i${corte && i === corte ? ' class="corte"' : ''}></i>`).join('');
});
cuando($('#metros'), () => {
  $$('[data-celdas]').forEach((el, f) => [...el.children].forEach((c, i) => setTimeout(() => c.classList.add('on'), reduce ? 0 : 250 + f * 500 + i * 28)));
}, '-20% 0px');

// ---------- preguntas: chat que responde con las preguntas frecuentes ----------
const FAQ = $$('#faq details').map((d) => ({ q: d.querySelector('summary').textContent.trim(), a: d.querySelector('p').textContent.trim() }));
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ');
const VACIAS = new Set('que como cual cuanto donde cuando hay la el los las de del un una y o a en mi me se es para por con tu su lo puedo necesito'.split(' '));
const claves = (t) => norm(t).split(/\s+/).filter((w) => w.length > 2 && !VACIAS.has(w));
const SIN = { precio: ['cuesta', 'valor', 'vale', 'precio', 'cobran', 'pagar', 'plata'], garantia: ['garantia', 'deposito'], horario: ['horario', 'hora', 'ir', 'abren', 'domingo', 'sabado'], retiro: ['retiro', 'flete', 'buscar', 'traslado', 'mudanza', 'camion'], tamano: ['tamano', 'cabe', 'metros', 'grande', 'chica', 'necesito'], donde: ['donde', 'ubicacion', 'direccion', 'lampa', 'queda', 'llegar'], plazo: ['plazo', 'minimo', 'meses', 'contrato'], prohibido: ['guardar', 'prohibido', 'puedo', 'inflamable', 'comida', 'animales'] };
function responder(texto) {
  const exacta = FAQ.find((f) => norm(f.q).trim() === norm(texto).trim()); if (exacta) return exacta.a;
  const k = claves(texto); let mejor = null, punt = 0;
  for (const f of FAQ) {
    const base = claves(f.q + ' ' + f.a); let s = k.filter((w) => base.some((b) => b.startsWith(w.slice(0, 5)))).length;
    for (const lista of Object.values(SIN)) if (k.some((w) => lista.includes(w)) && lista.some((w) => norm(f.q).includes(w))) s += 2;
    if (s > punt) { punt = s; mejor = f; }
  }
  return punt >= Math.min(2, k.length) && punt > 0 ? mejor.a : null;
}
const msgs = $('#chat-msgs'); const sug = $('#chat-sug');
function burbuja(txt, quien, html) { const d = document.createElement('div'); d.className = 'msg ' + quien; if (html) d.innerHTML = txt; else d.textContent = txt; msgs.append(d); msgs.scrollTop = msgs.scrollHeight; return d; }
function preguntar(t) {
  if (!t.trim()) return; burbuja(t, 'yo');
  const r = responder(t);
  setTimeout(() => {
    if (r) burbuja(r, 'sb');
    else burbuja(`Esa te la respondemos mejor por WhatsApp. <a href="https://wa.me/${NEGOCIO.whatsapp.replace('+', '')}?text=${encodeURIComponent(t)}" target="_blank" rel="noopener">Escríbenos aquí</a>.`, 'sb', true);
  }, 420);
}
sug.innerHTML = FAQ.slice(0, 6).map((f) => `<button type="button">${f.q}</button>`).join('');
sug.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) preguntar(b.textContent); });
$('#chat-form').addEventListener('submit', (e) => { e.preventDefault(); const i = $('#chat-in'); preguntar(i.value); i.value = ''; });

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
