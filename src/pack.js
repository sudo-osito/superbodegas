// Empaquetado 3D simple tipo «mapa de alturas»: llena desde el fondo hacia la puerta, de abajo hacia arriba.
// Coordenadas en metros con origen en la esquina fondo-izquierda del piso: x = ancho, z = largo (0 = fondo), y = alto.
import { ITEMS } from './items.js';

const CELL = 0.1;
const EPS = 0.051;

function grid(nx, nz) {
  return { nx, nz, h: new Float32Array(nx * nz), ok: new Uint8Array(nx * nz).fill(1) };
}

// Busca la mejor posición en un mapa de alturas. Devuelve {ix, iz, base, cw, cd, rot} o null.
function buscar(g, it, techo, soloSuelo) {
  const orient = [[it.w, it.d, 0], [it.d, it.w, 1]];
  let best = null;
  for (let iz = 0; iz < g.nz; iz++) {
    for (const [w, d, rot] of orient) {
      const cw = Math.ceil(w / CELL - 1e-6), cd = Math.ceil(d / CELL - 1e-6);
      if (cw > g.nx || iz + cd > g.nz) continue;
      for (let ix = 0; ix + cw <= g.nx; ix++) {
        let base = 0;
        for (let z = iz; z < iz + cd; z++) for (let x = ix; x < ix + cw; x++) {
          const v = g.h[z * g.nx + x]; if (v > base) base = v;
        }
        if (base + it.h > techo + 1e-6) continue;
        if (base > 0) {
          if (soloSuelo) continue;
          let sop = 0, malo = false;
          for (let z = iz; z < iz + cd; z++) for (let x = ix; x < ix + cw; x++) {
            const k = z * g.nx + x;
            if (g.h[k] >= base - EPS) { sop++; if (!g.ok[k]) malo = true; }
          }
          if (malo || sop < cw * cd * 0.7) continue;
        }
        if (!best || base < best.base - 1e-6) best = { ix, iz, base, cw, cd, rot, w, d };
      }
    }
    if (best) return best; // la primera fila (más al fondo) con lugar gana
  }
  return null;
}

function marcar(g, p, it, alto) {
  for (let z = p.iz; z < p.iz + p.cd; z++) for (let x = p.ix; x < p.ix + p.cw; x++) {
    const k = z * g.nx + x; g.h[k] = alto; g.ok[k] = it.apilable ? 1 : 0;
  }
}

// lista: [{id, tipo}] · bodega: {ancho, largo, alto} · repisa: {fondo, largo, niveles:[{y, libre}]} | null
export function empacar(lista, bodega, repisa) {
  const nx = Math.floor(bodega.ancho / CELL + 1e-6), nz = Math.floor(bodega.largo / CELL + 1e-6);
  const piso = grid(nx, nz);
  const niveles = [];
  if (repisa) {
    const rx = Math.ceil(repisa.fondo / CELL), rz = Math.ceil(repisa.largo / CELL);
    for (let z = 0; z < rz; z++) for (let x = 0; x < rx; x++) { piso.h[z * nx + x] = bodega.alto; piso.ok[z * nx + x] = 0; }
    for (const n of repisa.niveles) niveles.push({ ...n, g: grid(rx, rz) });
  }
  const orden = [...lista].sort((a, b) => {
    const A = ITEMS[a.tipo], B = ITEMS[b.tipo];
    if (!!A.suelo !== !!B.suelo) return A.suelo ? -1 : 1;
    return B.w * B.d * B.h - A.w * A.d * A.h;
  });
  const puestos = [], afuera = [];
  for (const el of orden) {
    const it = ITEMS[el.tipo];
    let hecho = false;
    if (it.repisa) {
      for (const n of niveles) {
        const p = buscar(n.g, it, n.libre, false);
        if (p) {
          marcar(n.g, p, it, p.base + it.h);
          puestos.push({ ...el, x: (p.ix * CELL) + p.w / 2, z: (p.iz * CELL) + p.d / 2, y: n.y + p.base, rot: p.rot, enRepisa: true });
          hecho = true; break;
        }
      }
    }
    if (!hecho) {
      const p = buscar(piso, it, bodega.alto, !!it.suelo);
      if (p) {
        marcar(piso, p, it, p.base + it.h);
        puestos.push({ ...el, x: p.ix * CELL + p.w / 2, z: p.iz * CELL + p.d / 2, y: p.base, rot: p.rot });
        hecho = true;
      }
    }
    if (!hecho) afuera.push(el);
  }
  const vol = (arr) => arr.reduce((s, e) => { const it = ITEMS[e.tipo]; return s + it.w * it.d * it.h; }, 0);
  const capacidad = bodega.ancho * bodega.largo * bodega.alto;
  return { puestos, afuera, volumen: vol(lista), ocupacion: Math.min(1, vol(puestos) / (capacidad * 0.72)) };
}

// Convierte {tipo: cantidad} en una lista con identidad estable (tipo#n).
export function expandir(cuenta) {
  const out = [];
  for (const [tipo, n] of Object.entries(cuenta)) for (let i = 0; i < n; i++) out.push({ id: `${tipo}#${i}`, tipo });
  return out;
}
