// Piezas compartidas: plano técnico SVG, cabecera, revelado al hacer scroll.
export function cabecera() {
  const cab = document.getElementById('cab'); if (!cab) return;
  const f = () => cab.classList.toggle('borde', scrollY > 8); f(); addEventListener('scroll', f, { passive: true });
}

export function revelar(sel = '.entra') {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll(sel).forEach((el) => io.observe(el));
}

export function cuando(el, fn, margen = '200px') {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: margen });
  io.observe(el);
}
