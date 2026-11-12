// Piezas compartidas: plano técnico SVG, cabecera, revelado al hacer scroll.
import { BODEGAS } from './config.js';

const m = (n) => n.toFixed(2).replace('.', ',') + ' m';

// Plano en planta con cotas, puertas abatibles y repisa. Misma escala para ambos tamaños.
export function plano(size, conRepisa = BODEGAS[size].repisa) {
  const b = BODEGAS[size]; const S = 52; const L = b.largo * S, W = b.ancho * S;
  const vw = 420, vh = 230; const x0 = 40, y0 = (vh - W) / 2 - 6;
  const puerta = W / 2 - 2;
  const rep = conRepisa ? `<rect x="${x0 + 2}" y="${y0 + 2}" width="${4.2 * S}" height="${0.45 * S}" fill="url(#rayas)" stroke="#c39f6c" stroke-width="1.2"/>
    <text x="${x0 + 8}" y="${y0 + 0.45 * S / 2 + 5}" class="pl-t" fill="#8a6a3c">REPISA</text>` : '';
  return `<svg viewBox="0 0 ${vw} ${vh}" role="img" aria-label="Plano en planta de la ${b.nombre}: ${m(b.largo)} de largo por ${m(b.ancho)} de ancho">
  <defs><pattern id="rayas" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#f4ead9"/><line x1="0" y1="0" x2="0" y2="6" stroke="#d9b98c" stroke-width="2"/></pattern>
  <style>.pl-t{font:500 10px 'JetBrains Mono',monospace;letter-spacing:.06em}.pl-c{font:600 12px 'JetBrains Mono',monospace}</style></defs>
  <rect x="${x0}" y="${y0}" width="${L}" height="${W}" fill="#fff" stroke="#111" stroke-width="3"/>
  ${rep}
  <g stroke="#111" stroke-width="1.2" fill="none">
    <path d="M${x0 + L} ${y0} l${puerta * 0.94} ${-puerta * 0.34}"/><path d="M${x0 + L} ${y0 + W} l${puerta * 0.94} ${puerta * 0.34}"/>
    <path d="M${x0 + L} ${y0 + puerta} A ${puerta} ${puerta} 0 0 0 ${x0 + L + puerta * 0.94} ${y0 - puerta * 0.34}" stroke-dasharray="3 3" stroke="#8a8a83"/>
    <path d="M${x0 + L} ${y0 + W - puerta} A ${puerta} ${puerta} 0 0 1 ${x0 + L + puerta * 0.94} ${y0 + W + puerta * 0.34}" stroke-dasharray="3 3" stroke="#8a8a83"/>
  </g>
  <rect x="${x0 + L - 3}" y="${y0 + 1}" width="6" height="${W - 2}" fill="#FF5F15"/>
  <g stroke="#111" stroke-width="1">
    <line x1="${x0}" y1="${y0 + W + 26}" x2="${x0 + L}" y2="${y0 + W + 26}"/>
    <line x1="${x0}" y1="${y0 + W + 20}" x2="${x0}" y2="${y0 + W + 32}"/><line x1="${x0 + L}" y1="${y0 + W + 20}" x2="${x0 + L}" y2="${y0 + W + 32}"/>
    <line x1="${x0 - 18}" y1="${y0}" x2="${x0 - 18}" y2="${y0 + W}"/>
    <line x1="${x0 - 24}" y1="${y0}" x2="${x0 - 12}" y2="${y0}"/><line x1="${x0 - 24}" y1="${y0 + W}" x2="${x0 - 12}" y2="${y0 + W}"/>
  </g>
  <rect x="${x0 + L / 2 - 30}" y="${y0 + W + 18}" width="60" height="16" fill="#f3f3ef"/>
  <text x="${x0 + L / 2}" y="${y0 + W + 30}" text-anchor="middle" class="pl-c">${m(b.largo)}</text>
  <text x="${x0 - 22}" y="${y0 + W / 2}" text-anchor="middle" class="pl-c" transform="rotate(-90 ${x0 - 22} ${y0 + W / 2})" style="paint-order:stroke;stroke:#f3f3ef;stroke-width:6px">${m(b.ancho)}</text>
  <text x="${x0 + L + 14}" y="${y0 + W / 2 + 4}" class="pl-t" fill="#5d5d57">PUERTA</text>
  <text x="${x0}" y="${vh - 10}" class="pl-t" fill="#5d5d57">PLANTA · ${b.m2} m² · ALTO ${m(b.alto)}</text>
</svg>`;
}

export function cabecera() {
  const cab = document.getElementById('cab'); if (!cab) return;
  const f = () => cab.classList.toggle('con-borde', scrollY > 8); f(); addEventListener('scroll', f, { passive: true });
}

export function revelar(sel = '.revela, .compara') {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('en-vista'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll(sel).forEach((el) => io.observe(el));
}

export function cuando(el, fn, margen = '200px') {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: margen });
  io.observe(el);
}
