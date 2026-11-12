// La bodega en 3D: módulo con medidas reales, repisa de madera, objetos que caen como Tetris.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { ITEMS } from './items.js';
import { empacar, expandir } from './pack.js';

const C = {
  panel: 0xf4f4f1, frame: 0x45494d, piso: 0xc9cac5, suelo: 0xefefea,
  pino: 0xd9b98c, pinoOsc: 0xc39f6c, carton: 0xc79f74, carton2: 0xb58c62, cinta: 0xe2c79c,
  film: 0xdfe4e8, blanco: 0xf3f3f1, grafito: 0x3a3d40, negro: 0x1b1c1e, naranja: 0xff5f15, tela: 0x8b95a1,
};
export const REPISA = { fondo: 0.45, largo: 4.2, niveles: [{ y: 0.12, libre: 0.76 }, { y: 0.96, libre: 0.76 }, { y: 1.8, libre: 0.55 }] };
const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const mats = {};
function mat(color, extra = {}) {
  const k = color + JSON.stringify(extra);
  if (!mats[k]) mats[k] = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...extra });
  return mats[k];
}
function caja(w, h, d, color, x = 0, y = 0, z = 0, r = 0.012) {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3)) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, typeof color === 'number' ? mat(color) : color);
  m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; return m;
}

// ---------- objetos ----------
function modelo(tipo) {
  const it = ITEMS[tipo]; const { w, d, h } = it; const g = new THREE.Group();
  const add = (...a) => { const m = caja(...a); g.add(m); return m; };
  switch (tipo) {
    case 'caja_m': case 'caja_g': {
      add(w, h, d, tipo === 'caja_m' ? C.carton : C.carton2);
      add(w * 0.18, 0.004, d + 0.002, C.cinta, 0, h - 0.002, 0, 0);
      break;
    }
    case 'maleta': add(w, h, d, C.grafito, 0, 0, 0, 0.05); add(0.16, 0.05, 0.03, C.negro, 0, h, 0, 0.01); break;
    case 'cama2': case 'cama1':
      add(w, h, d * 0.55, C.film, 0, 0, -d * 0.22, 0.05); add(w, h * 0.96, d * 0.42, C.tela, 0, 0, d * 0.28, 0.02); break;
    case 'ropero':
      add(w, h, d, C.pino); add(0.006, h * 0.9, 0.004, C.pinoOsc, 0, h * 0.05, d / 2, 0);
      add(0.02, 0.18, 0.02, C.grafito, -0.05, h * 0.5, d / 2 + 0.01, 0); add(0.02, 0.18, 0.02, C.grafito, 0.05, h * 0.5, d / 2 + 0.01, 0); break;
    case 'comoda':
      add(w, h, d, C.pino); for (let i = 1; i < 3; i++) add(w * 0.92, 0.006, 0.004, C.pinoOsc, 0, (h / 3) * i, d / 2, 0); break;
    case 'sofa3': case 'sillon': {
      const f = mat(C.film, { roughness: 0.35, transparent: true, opacity: 0.93 });
      add(w, h * 0.45, d, f, 0, 0, 0, 0.06); add(w, h * 0.55, d * 0.28, f, 0, h * 0.45, -d * 0.36, 0.06);
      add(w * 0.12, h * 0.25, d, f, -w * 0.44, h * 0.45, 0, 0.05); add(w * 0.12, h * 0.25, d, f, w * 0.44, h * 0.45, 0, 0.05); break;
    }
    case 'tv': add(w, h, d, C.carton2); add(w * 0.7, h * 0.5, 0.002, C.cinta, 0, h * 0.25, d / 2, 0); break;
    case 'mesa': case 'escritorio':
      add(w, 0.04, d, C.pino, 0, h - 0.04, 0, 0.01);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(0.05, h - 0.04, 0.05, C.pinoOsc, sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06), 0);
      break;
    case 'silla':
      add(w, 0.04, d * 0.9, C.pino, 0, 0.45, 0.02, 0.01); add(w, 0.42, 0.04, C.pino, 0, 0.48, -d / 2 + 0.03, 0.01);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(0.035, 0.45, 0.035, C.pinoOsc, sx * (w / 2 - 0.04), 0, sz * (d / 2 - 0.06), 0);
      break;
    case 'refri':
      add(w, h, d, C.blanco, 0, 0, 0, 0.04); add(w * 0.96, 0.006, 0.004, 0xd5d5d2, 0, h * 0.62, d / 2, 0);
      add(0.025, 0.3, 0.03, C.grafito, w * 0.38, h * 0.68, d / 2 + 0.015, 0.008); break;
    case 'lavadora': case 'cocina': {
      add(w, h, d, C.blanco, 0, 0, 0, 0.03);
      const o = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.3, w * 0.3, 0.02, 32), mat(tipo === 'lavadora' ? C.grafito : C.negro));
      o.rotation.x = Math.PI / 2; o.position.set(0, h * 0.45, d / 2 + 0.005); g.add(o);
      break;
    }
    case 'bici': {
      const r = 0.34, tm = mat(C.negro);
      for (const sx of [-1, 1]) {
        const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 10, 32), tm); t.position.set(sx * 0.55, r + 0.02, 0); t.castShadow = true; g.add(t);
      }
      const fr = mat(C.naranja, { roughness: 0.4 });
      const tubo = (x1, y1, x2, y2) => {
        const len = Math.hypot(x2 - x1, y2 - y1); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 8), fr);
        m.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0); m.rotation.z = Math.atan2(y2 - y1, x2 - x1) - Math.PI / 2; m.castShadow = true; g.add(m);
      };
      tubo(-0.55, r, -0.05, r); tubo(-0.05, r, 0.3, 0.78); tubo(-0.55, r, -0.15, 0.75); tubo(-0.15, 0.75, 0.3, 0.78); tubo(0.3, 0.78, 0.55, r); tubo(-0.15, 0.75, -0.05, r);
      add(0.22, 0.04, 0.08, C.negro, -0.17, 0.78, 0, 0.01); add(0.04, 0.04, 0.5, C.negro, 0.32, 0.86, 0, 0.01);
      break;
    }
    case 'herramientas':
      add(w, h, d, C.grafito, 0, 0, 0, 0.02); for (let i = 1; i < 5; i++) add(w * 0.9, 0.006, 0.004, C.negro, 0, (h / 5) * i, d / 2, 0);
      add(w * 0.5, 0.03, 0.03, C.naranja, 0, h * 0.85, d / 2 + 0.015, 0.008); break;
    case 'pallet': {
      add(w, 0.14, d, C.pinoOsc, 0, 0, 0, 0.005);
      const cols = 3, rows = 2, bw = w / cols, bd = d / rows;
      for (let l = 0; l < 3; l++) for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++)
        add(bw - 0.02, 0.33, bd - 0.02, (i + j + l) % 2 ? C.carton : C.carton2, -w / 2 + bw * (i + 0.5), 0.14 + l * 0.35, -d / 2 + bd * (j + 0.5), 0.01);
      break;
    }
    case 'materiales':
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, w, 12), mat(0xa9adb1, { metalness: 0.6, roughness: 0.35 }));
        m.rotation.z = Math.PI / 2; m.position.set(0, 0.07 + j * 0.13, -d / 2 + 0.08 + i * 0.145); m.castShadow = true; g.add(m);
      }
      break;
    default: add(w, h, d, C.carton);
  }
  return g;
}

// ---------- vehículos y escala ----------
function persona() {
  const g = new THREE.Group(); const m = mat(0x2b2d30);
  const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.95, 6, 16), m); cuerpo.position.y = 0.19 + 0.475 + 0.08; cuerpo.castShadow = true;
  const cab = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), m); cab.position.y = 1.63; cab.castShadow = true;
  g.add(cuerpo, cab); return g;
}
function camioneta() {
  const g = new THREE.Group(); const add = (...a) => { const m = caja(...a); g.add(m); return m; };
  add(1.85, 0.75, 5.2, C.blanco, 0, 0.35, 0, 0.12); add(1.75, 0.65, 2.3, C.blanco, 0, 1.08, 1.0, 0.18);
  add(1.65, 0.5, 2.1, mat(0x2a3138, { roughness: 0.2, metalness: 0.4 }), 0, 1.15, 1.0, 0.12);
  for (const sx of [-1, 1]) for (const sz of [-1.6, 1.6]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 24), mat(C.negro)); r.rotation.z = Math.PI / 2; r.position.set(sx * 0.86, 0.38, sz); r.castShadow = true; g.add(r);
  }
  add(1.5, 0.45, 0.45, C.carton, 0, 1.1, -1.7, 0.02); add(0.6, 0.4, 0.4, C.carton2, 0.4, 1.55, -1.75, 0.02);
  return g;
}
function camion() {
  const g = new THREE.Group(); const add = (...a) => { const m = caja(...a); g.add(m); return m; };
  add(2.2, 2.3, 4.2, C.blanco, 0, 0.6, -0.6, 0.05); add(0.04, 0.5, 4.0, C.naranja, 1.12, 1.4, -0.6, 0);
  add(2.1, 1.7, 1.6, 0xd9dcdf, 0, 0.55, 2.3, 0.15); add(1.9, 0.6, 0.05, mat(0x2a3138, { roughness: 0.2, metalness: 0.4 }), 0, 1.55, 3.12, 0.02);
  for (const sx of [-1, 1]) for (const sz of [-2, 2.1]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 24), mat(C.negro)); r.rotation.z = Math.PI / 2; r.position.set(sx * 1.0, 0.45, sz); r.castShadow = true; g.add(r);
  }
  return g;
}

// ---------- módulo ----------
function modulo(ancho, largo, alto, conRepisa) {
  const g = new THREE.Group(); const W = ancho, L = largo, H = alto;
  const add = (...a) => { const m = caja(...a); g.add(m); return m; };
  add(W + 0.1, 0.08, L + 0.1, C.piso, 0, -0.08, 0, 0);
  // muro del fondo y muro izquierdo con nervaduras
  add(W, H, 0.05, C.panel, 0, 0, -L / 2 - 0.025, 0);
  add(0.05, H, L, C.panel, -W / 2 - 0.025, 0, 0, 0);
  for (let z = -L / 2 + 0.25; z < L / 2; z += 0.25) add(0.012, H * 0.96, 0.03, 0xe6e6e2, -W / 2 + 0.002, H * 0.02, z, 0);
  add(0.02, 0.07, L, C.frame, -W / 2 + 0.005, H * 0.5, 0, 0);
  // marco de acero (aristas)
  const v = 0.07;
  for (const [x, z] of [[-W / 2, -L / 2], [W / 2, -L / 2], [-W / 2, L / 2], [W / 2, L / 2]]) add(v, H, v, C.frame, x, 0, z, 0);
  for (const z of [-L / 2, L / 2]) add(W + v, v, v, C.frame, 0, H - v, z, 0);
  for (const x of [-W / 2, W / 2]) add(v, v, L, C.frame, x, H - v, 0, 0);
  add(v, v, L, C.frame, W / 2, 0, 0, 0);
  // muro derecho en vidrio muy tenue para leer que es cerrado
  const vid = new THREE.Mesh(new THREE.PlaneGeometry(L, H), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide }));
  vid.rotation.y = Math.PI / 2; vid.position.set(W / 2, H / 2, 0); g.add(vid);
  // puertas dobles abiertas
  const pw = W / 2 - 0.02;
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * (W / 2 - 0.02), 0, L / 2 + 0.03);
    const p = caja(pw, H - 0.12, 0.05, C.panel, -s * pw / 2, 0.04, 0, 0.01); piv.add(p);
    const t = caja(0.025, 0.2, 0.04, C.grafito, -s * (pw - 0.12), 1.05, 0.04, 0.006); piv.add(t);
    const pl = caja(0.16, 0.09, 0.01, C.naranja, -s * pw / 2, H - 0.3, 0.03, 0); if (s === 1) piv.add(pl);
    piv.rotation.y = s * 1.95; piv.userData.puerta = s; g.add(piv);
  }
  if (conRepisa) {
    const rp = new THREE.Group(); const x0 = -W / 2 + REPISA.fondo / 2, z0 = -L / 2 + REPISA.largo / 2;
    for (const n of REPISA.niveles) rp.add(caja(REPISA.fondo, 0.03, REPISA.largo, C.pino, x0, n.y - 0.03, z0, 0.005));
    for (let z = -L / 2 + 0.04; z <= -L / 2 + REPISA.largo; z += REPISA.largo / 4)
      for (const dx of [0.03, REPISA.fondo - 0.03]) rp.add(caja(0.045, 1.95, 0.045, C.pinoOsc, -W / 2 + dx, 0, Math.min(z, -L / 2 + REPISA.largo - 0.03), 0));
    g.add(rp);
  }
  return g;
}

// ---------- escena ----------
export function crearBodega(host, opts = {}) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);

  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d6cf, 1.35));
  const sol = new THREE.DirectionalLight(0xffffff, 2.2); sol.position.set(-6, 11, 7); sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sol.shadow.bias = -0.0004; sol.shadow.radius = 4;
  scene.add(sol);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.16 }));
  suelo.rotation.x = -Math.PI / 2; suelo.position.y = -0.081; suelo.receiveShadow = true; scene.add(suelo);
  const losa = new THREE.Mesh(new THREE.PlaneGeometry(9, 14), mat(0xe9e9e4)); losa.rotation.x = -Math.PI / 2; losa.position.set(0.5, -0.082, 3); losa.receiveShadow = true; scene.add(losa);

  const controls = new OrbitControls(cam, renderer.domElement);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enableZoom: false, enablePan: false, minPolarAngle: 0.5, maxPolarAngle: 1.25, rotateSpeed: 0.6 });
  controls.minAzimuthAngle = -0.35; controls.maxAzimuthAngle = 1.35;

  const estado = { size: null, bodega: null, conRepisa: false, cuenta: {}, vehiculo: null, ultimo: null };
  let mod = null, figura = persona(), veh = null; scene.add(figura);
  const objetos = new Map(); // id -> {g, tipo}
  const tweens = []; let corriendo = false, visible = true, hastaT = 0;

  function resize() {
    const r = host.getBoundingClientRect(); const w = Math.max(10, r.width), h = Math.max(10, r.height);
    renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
    cam.aspect = w / h; cam.updateProjectionMatrix(); encuadrar(false); pedir(200);
  }
  function encuadrar(animar = true) {
    if (!estado.bodega) return;
    const W = estado.bodega.ancho; const lejos = cam.aspect < 0.9 ? 1.5 : 1;
    const target = new THREE.Vector3(-0.3, 0.8, 1.3);
    const pos = new THREE.Vector3(8.5 + W * 1.2, 7.2 + W * 0.6, 9.5 + W * 0.8).multiplyScalar((opts.lejos || 0.95) * lejos);
    if (animar && !reduce) tween(cam.position.clone(), pos, 900, (v) => cam.position.copy(v)); else cam.position.copy(pos);
    controls.target.copy(target);
  }
  function tween(a, b, ms, set, delay = 0, ease = easeOut, fin) {
    tweens.push({ a, b, ms, set, t0: performance.now() + delay, ease, fin }); pedir(ms + delay + 50);
  }
  function pedir(ms) { hastaT = Math.max(hastaT, performance.now() + ms); if (!corriendo) { corriendo = true; requestAnimationFrame(loop); } }
  function loop(now) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const t = tweens[i]; const k = Math.min(1, Math.max(0, (now - t.t0) / t.ms)); if (now < t.t0) continue;
      const e = t.ease(k);
      if (typeof t.a === 'number') t.set(t.a + (t.b - t.a) * e); else t.set(t.a.clone().lerp(t.b, e), e);
      if (k >= 1) { tweens.splice(i, 1); t.fin && t.fin(); }
    }
    const mov = controls.update();
    if (visible) renderer.render(scene, cam);
    if (tweens.length || mov || now < hastaT) requestAnimationFrame(loop); else corriendo = false;
  }
  controls.addEventListener('change', () => pedir(300));

  function setSize(size, bodega, conRepisa) {
    estado.size = size; estado.bodega = bodega; estado.conRepisa = conRepisa;
    if (mod) scene.remove(mod);
    mod = modulo(bodega.ancho, bodega.largo, bodega.alto, conRepisa); scene.add(mod);
    if (!reduce) { mod.scale.set(1, 0.01, 1); tween(0.01, 1, 650, (v) => mod.scale.set(1, v, 1)); }
    figura.position.set(bodega.ancho / 2 + 0.45, 0, bodega.largo / 2 + 0.55);
    posVehiculo(); encuadrar(); repack(true);
  }
  function posVehiculo() {
    if (!veh || !estado.bodega) return;
    const W = estado.bodega.ancho, L = estado.bodega.largo; const cam = estado.vehiculo === 'camion';
    veh.position.set(-W / 2 - (cam ? 1.75 : 1.55), 0, L / 2 + (cam ? 2.9 : 2.5));
  }
  function setVehiculo(tipo) {
    if (estado.vehiculo === tipo) return; estado.vehiculo = tipo;
    if (veh) { const v = veh; tween(v.position.z, v.position.z + 6, 500, (z) => (v.position.z = z), 0, easeIn, () => scene.remove(v)); veh = null; }
    if (!tipo) return;
    veh = tipo === 'camion' ? camion() : camioneta(); scene.add(veh); posVehiculo();
    const zf = veh.position.z; if (!reduce) tween(zf + 7, zf, 900, (z) => (veh.position.z = z), 150);
  }

  function setItems(cuenta) { estado.cuenta = { ...cuenta }; return repack(false); }
  function repack(rehacer) {
    if (!estado.bodega) return null;
    const lista = expandir(estado.cuenta);
    const res = empacar(lista, estado.bodega, estado.conRepisa ? REPISA : null);
    const W = estado.bodega.ancho, L = estado.bodega.largo;
    const vivos = new Set();
    // afuera: en fila frente a la puerta, sobre la losa
    let ax = -W / 2 - 1.2, az = L / 2 + 1.6, fila = 0;
    const dest = [...res.puestos.map((p) => ({ ...p, x: p.x - W / 2, z: p.z - L / 2, afuera: false }))];
    for (const a of res.afuera) {
      const it = ITEMS[a.tipo]; if (ax + it.w > W / 2 + 3.2) { ax = -W / 2 - 1.2; az += 1.0; fila++; }
      dest.push({ ...a, x: ax + it.w / 2, z: az, y: 0, rot: 0, afuera: true }); ax += it.w + 0.15;
    }
    let i = 0;
    for (const p of dest) {
      vivos.add(p.id); let o = objetos.get(p.id); const it = ITEMS[p.tipo];
      const rotY = p.rot ? Math.PI / 2 : 0;
      const target = new THREE.Vector3(p.x, p.y, p.z);
      if (!o || rehacer) {
        if (o) scene.remove(o.g);
        const g = modelo(p.tipo); g.rotation.y = rotY; scene.add(g); o = { g, tipo: p.tipo }; objetos.set(p.id, o);
        const delay = reduce ? 0 : i * 45; i++;
        g.position.set(p.x, p.y + 3.2 + Math.random() * 0.6, p.z); g.visible = reduce;
        if (reduce) g.position.copy(target);
        else tween(g.position.clone(), target, 520, (v) => { g.visible = true; g.position.copy(v); }, delay, easeOutBounce);
      } else {
        const g = o.g; const from = g.position.clone();
        if (from.distanceTo(target) > 0.01 || Math.abs(g.rotation.y - rotY) > 0.01) {
          const r0 = g.rotation.y;
          tween(from, target, 480, (v, e) => { g.position.copy(v); g.position.y += Math.sin(Math.PI * e) * 0.6; g.rotation.y = r0 + (rotY - r0) * e; }, i++ * 12, easeInOut);
        }
      }
      o.afuera = p.afuera;
    }
    for (const [id, o] of objetos) if (!vivos.has(id)) {
      objetos.delete(id); const g = o.g; const y0 = g.position.y;
      tween(y0, y0 + 3, 380, (y) => { g.position.y = y; g.scale.setScalar(Math.max(0.01, 1 - (y - y0) / 3)); }, 0, easeIn, () => scene.remove(g));
    }
    pedir(1200);
    estado.ultimo = res; opts.onPack && opts.onPack(res);
    return res;
  }

  const ro = new ResizeObserver(resize); ro.observe(host);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) pedir(100); }); io.observe(host);
  resize();

  return {
    setSize, setItems, setVehiculo,
    girar(a) { if (reduce) return; const az = controls.getAzimuthalAngle(); tween(az, a, 900, (v) => { const r = cam.position.clone().sub(controls.target); const s = new THREE.Spherical().setFromVector3(r); s.theta = v; cam.position.copy(controls.target.clone().add(new THREE.Vector3().setFromSpherical(s))); }); },
    get estado() { return estado; },
    dispose() { ro.disconnect(); io.disconnect(); controls.dispose(); renderer.dispose(); host.removeChild(renderer.domElement); },
  };
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function easeIn(t) { return t * t * t; }
function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeOutBounce(x) {
  const n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x; if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375; return n1 * (x -= 2.625 / d1) * x + 0.984375;
}
