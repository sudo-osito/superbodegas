// La bodega en 3D, estilo maqueta blanca (arcilla): solo piso y las dos murallas largas, puertas abiertas hacia afuera,
// objetos a escala real que caen en orden de fondo a puerta. Render a pedido (solo cuando algo se mueve).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ITEMS } from './items.js';
import { empacar, expandir } from './pack.js';

export const REPISA = { fondo: 0.45, largo: 4.2, niveles: [{ y: 0.12, libre: 0.76 }, { y: 0.96, libre: 0.76 }, { y: 1.8, libre: 0.55 }] };
const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tres blancos y un gris: la forma se lee por luz y sombra, no por color.
let T = { muro: 0xefefec, piso: 0xd9d9d4, a: 0xf6f6f4, b: 0xe7e7e3, c: 0xd6d6d1, d: 0xb8b8b2, marco: 0xb5b5af, acento: 0xff5b14 };
const TA = { a: 0xffe6da, b: 0xffd9c7, c: 0xffc9b0, d: 0xf2a888, muro: 0xffe6da, marco: 0xf2a888, piso: 0xffd9c7, acento: 0xff5b14 };
const cacheMat = new Map();
function mat(c, o = {}) {
  const k = c + JSON.stringify(o);
  if (!cacheMat.has(k)) cacheMat.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.78, metalness: 0, envMapIntensity: 0.9, ...o }));
  return cacheMat.get(k);
}
const cacheGeo = new Map();
function rbox(w, h, d, r) {
  r = Math.min(r, w / 2.01, h / 2.01, d / 2.01);
  const k = [w, h, d, r].map((v) => v.toFixed(3)).join('|');
  if (!cacheGeo.has(k)) cacheGeo.set(k, r > 0.002 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d));
  return cacheGeo.get(k);
}
function pieza(g, w, h, d, color, x = 0, y = 0, z = 0, r = 0.02) {
  const m = new THREE.Mesh(rbox(w, h, d, r), mat(color));
  m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function cilindro(g, r, len, color, eje, x, y, z, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat(color));
  if (eje === 'x') m.rotation.z = Math.PI / 2; if (eje === 'z') m.rotation.x = Math.PI / 2;
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function aro(g, r, t, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 12, 40), mat(color)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m;
}

// ---------- objetos (origen: centro de la base) ----------
export function modelo(tipo, afuera = false) {
  const prev = T; if (afuera) T = { ...T, ...TA };
  try { return modeloBase(tipo); } finally { T = prev; }
}
function modeloBase(tipo) {
  const { w, d, h } = ITEMS[tipo]; const g = new THREE.Group(); const P = (...a) => pieza(g, ...a);
  switch (tipo) {
    case 'caja_m': case 'caja_g': {
      P(w, h, d, tipo === 'caja_m' ? T.b : T.a, 0, 0, 0, 0.012);
      P(w + 0.002, 0.003, 0.004, T.d, 0, h - 0.002, 0, 0);
      P(w * 0.22, 0.004, d + 0.004, T.c, 0, h - 0.003, 0, 0);
      break;
    }
    case 'maleta':
      P(w, h * 0.94, d, T.c, 0, 0, 0, 0.06);
      P(0.03, 0.08, 0.03, T.d, -0.08, h * 0.94, 0, 0.01); P(0.03, 0.08, 0.03, T.d, 0.08, h * 0.94, 0, 0.01); P(0.2, 0.025, 0.03, T.d, 0, h, 0, 0.012);
      break;
    case 'cama2': case 'cama1':
      P(w, h, d * 0.55, T.a, 0, 0, -d * 0.2, 0.07);
      P(w * 0.98, h * 0.94, d * 0.32, T.c, 0, 0, d * 0.3, 0.02);
      break;
    case 'ropero':
      P(w, h, d, T.a, 0, 0, 0, 0.012);
      P(0.004, h * 0.92, 0.006, T.d, 0, h * 0.04, d / 2, 0);
      P(0.018, 0.22, 0.02, T.d, -0.045, h * 0.5, d / 2 + 0.01, 0.008); P(0.018, 0.22, 0.02, T.d, 0.045, h * 0.5, d / 2 + 0.01, 0.008);
      P(w, 0.06, d * 0.96, T.c, 0, 0, 0, 0.01);
      break;
    case 'comoda':
      P(w, h, d, T.a, 0, 0, 0, 0.012);
      for (let i = 0; i < 3; i++) { P(w * 0.9, h / 3 - 0.04, 0.01, T.b, 0, 0.03 + i * (h / 3), d / 2, 0.008); P(0.12, 0.016, 0.02, T.d, 0, 0.03 + i * (h / 3) + h / 6 - 0.03, d / 2 + 0.01, 0.006); }
      break;
    case 'sofa3': case 'sillon': {
      const n = tipo === 'sofa3' ? 3 : 1, brazo = 0.16, cw = (w - brazo * 2) / n;
      P(w, 0.22, d, T.c, 0, 0.04, 0, 0.05);
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + brazo + cw * (i + 0.5);
        P(cw - 0.015, 0.16, d - 0.24, T.a, x, 0.26, 0.08, 0.06);
        P(cw - 0.015, 0.42, 0.2, T.a, x, 0.36, -d / 2 + 0.2, 0.08);
      }
      P(w, 0.62, 0.16, T.b, 0, 0.18, -d / 2 + 0.08, 0.06);
      P(brazo, 0.42, d, T.b, -w / 2 + brazo / 2, 0.18, 0, 0.07); P(brazo, 0.42, d, T.b, w / 2 - brazo / 2, 0.18, 0, 0.07);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) P(0.04, 0.05, 0.04, T.d, sx * (w / 2 - 0.08), 0, sz * (d / 2 - 0.08), 0.01);
      break;
    }
    case 'tv':
      P(w, h, d, T.b, 0, 0, 0, 0.012); P(w * 0.7, h * 0.55, 0.004, T.a, 0, h * 0.22, d / 2, 0.004);
      break;
    case 'mesa': case 'escritorio':
      P(w, 0.035, d, T.a, 0, h - 0.035, 0, 0.012);
      P(w - 0.12, 0.08, d - 0.12, T.b, 0, h - 0.115, 0, 0.005);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) P(0.045, h - 0.035, 0.045, T.b, sx * (w / 2 - 0.07), 0, sz * (d / 2 - 0.07), 0.012);
      break;
    case 'silla':
      P(w, 0.04, d * 0.92, T.a, 0, 0.44, 0.02, 0.015);
      P(w, 0.36, 0.035, T.a, 0, 0.52, -d / 2 + 0.03, 0.015);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) P(0.032, 0.44, 0.032, T.b, sx * (w / 2 - 0.035), 0, sz * (d / 2 - 0.05), 0.01);
      for (const sx of [-1, 1]) P(0.032, 0.5, 0.032, T.b, sx * (w / 2 - 0.035), 0.44, -d / 2 + 0.03, 0.01);
      break;
    case 'refri':
      P(w, h, d, T.a, 0, 0, 0, 0.05);
      P(w * 0.98, 0.006, 0.006, T.d, 0, h * 0.64, d / 2, 0);
      P(0.022, 0.32, 0.03, T.d, w * 0.36, h * 0.7, d / 2 + 0.015, 0.01); P(0.022, 0.42, 0.03, T.d, w * 0.36, h * 0.24, d / 2 + 0.015, 0.01);
      break;
    case 'lavadora': case 'cocina':
      P(w, h, d, T.a, 0, 0, 0, 0.035);
      P(w * 0.98, 0.1, 0.01, T.b, 0, h - 0.13, d / 2, 0.006);
      if (tipo === 'lavadora') { aro(g, w * 0.27, 0.025, T.c, 0, h * 0.44, d / 2 + 0.01); cilindro(g, w * 0.24, 0.01, T.d, 'z', 0, h * 0.44, d / 2 + 0.002, 32); }
      else { P(w * 0.8, h * 0.45, 0.01, T.c, 0, h * 0.12, d / 2, 0.01); for (let i = 0; i < 4; i++) cilindro(g, 0.07, 0.012, T.c, 'y', (i % 2 ? 0.13 : -0.13), h + 0.006, (i < 2 ? -0.13 : 0.13), 20); }
      break;
    case 'bici': {
      const r = 0.34, tubo = (x1, y1, x2, y2, t = 0.017) => { const len = Math.hypot(x2 - x1, y2 - y1); const m = new THREE.Mesh(new THREE.CylinderGeometry(t, t, len, 10), mat(T.c)); m.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0); m.rotation.z = Math.atan2(y2 - y1, x2 - x1) - Math.PI / 2; m.castShadow = true; g.add(m); };
      for (const sx of [-0.55, 0.55]) { aro(g, r, 0.022, T.d, sx, r + 0.02, 0); cilindro(g, 0.03, 0.06, T.d, 'z', sx, r + 0.02, 0, 12); }
      tubo(-0.55, r, -0.05, r); tubo(-0.05, r, 0.3, 0.8); tubo(-0.55, r, -0.15, 0.76); tubo(-0.15, 0.76, 0.3, 0.8); tubo(0.3, 0.8, 0.55, r); tubo(-0.15, 0.76, -0.05, r);
      pieza(g, 0.22, 0.04, 0.08, T.d, -0.18, 0.8, 0, 0.02); pieza(g, 0.04, 0.03, 0.5, T.d, 0.33, 0.9, 0, 0.012);
      break;
    }
    case 'herramientas':
      P(w, h - 0.06, d, T.b, 0, 0.06, 0, 0.02);
      for (let i = 0; i < 5; i++) { P(w * 0.92, (h - 0.1) / 5 - 0.02, 0.01, T.a, 0, 0.08 + i * ((h - 0.1) / 5), d / 2, 0.006); P(w * 0.5, 0.014, 0.02, T.d, 0, 0.08 + i * ((h - 0.1) / 5) + 0.07, d / 2 + 0.01, 0.006); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cilindro(g, 0.03, 0.03, T.d, 'x', sx * (w / 2 - 0.06), 0.03, sz * (d / 2 - 0.06), 14);
      break;
    case 'pallet':
      P(w, 0.03, d, T.c, 0, 0.11, 0, 0.004);
      for (const sx of [-1, 0, 1]) P(0.1, 0.1, d, T.d, sx * (w / 2 - 0.06), 0.0, 0, 0.004);
      P(w - 0.02, h - 0.16, d - 0.02, T.a, 0, 0.14, 0, 0.03);
      for (let i = 1; i < 3; i++) P(w + 0.002, 0.004, d + 0.002, T.c, 0, 0.14 + i * (h - 0.16) / 3, 0, 0);
      break;
    case 'materiales':
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) cilindro(g, 0.055, w, j ? T.b : T.c, 'x', 0, 0.06 + j * 0.12, -d / 2 + 0.08 + i * 0.145, 16);
      P(0.05, 0.27, d * 0.9, T.d, -w / 2 + 0.3, 0, 0, 0.01); P(0.05, 0.27, d * 0.9, T.d, w / 2 - 0.3, 0, 0, 0.01);
      break;
    default: P(w, h, d, T.a);
  }
  return g;
}

// ---------- el módulo: piso + solo las dos paredes de atrás (vista 3/4 desde el lado de la puerta) ----------
function modulo(W, L, H, conRepisa) {
  const g = new THREE.Group(); const P = (...a) => pieza(g, ...a); const e = 0.06;
  P(W + 0.14, 0.1, L + 0.14, T.piso, 0, -0.1, 0, 0.012);
  P(e, H, L + e, T.muro, -W / 2 - e / 2, 0, -e / 2, 0.004);          // muro largo del fondo
  P(W + e, H, e, T.muro, -e / 2, 0, -L / 2 - e / 2, 0.004);          // muro del extremo
  P(e + 0.04, 0.08, L + e + 0.04, T.marco, -W / 2 - e / 2, H - 0.08, -e / 2, 0.01);
  P(W + e + 0.04, 0.08, e + 0.04, T.marco, -e / 2, H - 0.08, -L / 2 - e / 2, 0.01);
  P(0.09, H, 0.09, T.marco, -W / 2 - e / 2, 0, -L / 2 - e / 2, 0.01);
  // borde de la puerta: una línea naranja en el piso marca dónde termina la bodega
  P(W, 0.012, 0.05, T.acento, 0, 0.0, L / 2 - 0.03, 0.004);
  if (conRepisa) {
    const x0 = -W / 2 + REPISA.fondo / 2, z0 = -L / 2 + REPISA.largo / 2;
    for (const n of REPISA.niveles) P(REPISA.fondo, 0.028, REPISA.largo, T.b, x0, n.y - 0.028, z0, 0.006);
    const postes = 5;
    for (let i = 0; i < postes; i++) {
      const z = -L / 2 + 0.03 + (REPISA.largo - 0.06) * (i / (postes - 1));
      for (const dx of [0.025, REPISA.fondo - 0.025]) P(0.04, 1.86, 0.04, T.c, -W / 2 + dx, 0, z, 0.008);
    }
  }
  return g;
}

// ---------- escena ----------
export function crearBodega(host, opts = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(opts.fondo ?? 0xffffff);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  const pr = Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2); renderer.setPixelRatio(pr);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
  host.appendChild(renderer.domElement);
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.42;

  const cam = new THREE.PerspectiveCamera(24, 1, 0.1, 200);
  const sol = new THREE.DirectionalLight(0xffffff, 2.3); sol.position.set(-6, 11, 3); sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
  sol.shadow.radius = 9; sol.shadow.blurSamples = 16; sol.shadow.bias = -0.0005; scene.add(sol);
  const relleno = new THREE.DirectionalLight(0xffffff, 0.5); relleno.position.set(6, 5, 8); scene.add(relleno);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.16 }));
  suelo.rotation.x = -Math.PI / 2; suelo.position.y = -0.101; suelo.receiveShadow = true; scene.add(suelo);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, cam));
  const ao = new GTAOPass(scene, cam, 10, 10); ao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.4, thickness: 1.2, scale: 1.25, samples: 16 }); ao.blendIntensity = 1.0;
  composer.addPass(ao); composer.addPass(new OutputPass());

  const controls = new OrbitControls(cam, renderer.domElement);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enableZoom: false, enablePan: false, rotateSpeed: 0.55, minPolarAngle: 0.45, maxPolarAngle: 1.2 });
  controls.enabled = opts.girar !== false;

  const st = { id: null, bodega: null, conRepisa: false, cuenta: {}, res: null, orden: [], visibles: 0 };
  let mod = null; const objetos = new Map(); const tweens = []; let corriendo = false, hasta = 0, visible = true;

  function resize() {
    const r = host.getBoundingClientRect(); const w = Math.max(10, r.width), h = Math.max(10, r.height);
    renderer.setSize(w, h, false); composer.setSize(w, h);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
    cam.aspect = w / h; cam.updateProjectionMatrix(); encuadrar(false); pedir(150);
  }
  // Cámara alta frente a la puerta, mirando el fondo: las dos murallas encuadran la bodega.
  function encuadrar(animar = true) {
    if (!st.bodega) return;
    const W = st.bodega.ancho, L = st.bodega.largo, H = st.bodega.alto;
    const extra = st.afuera ? 2.6 : 0;
    const target = new THREE.Vector3(0, H * 0.3, extra * 0.55);
    const dir = new THREE.Vector3(1.0, 0.82, 0.62).normalize();
    // radio que envuelve piso, murallas y puertas abiertas
    const r = Math.hypot(Math.max(W, 2.5) / 2 + 0.3, L / 2 + 0.3 + extra, H / 2);
    const fovV = THREE.MathUtils.degToRad(cam.fov) / 2, fovH = Math.atan(Math.tan(fovV) * cam.aspect);
    const dist = (r / Math.sin(Math.min(fovV, fovH))) * (opts.distancia || 0.95);
    const pos = target.clone().add(dir.multiplyScalar(dist));
    if (animar && !reduce) { const a = cam.position.clone(); tween(0, 1, 900, (e) => cam.position.lerpVectors(a, pos, e)); } else cam.position.copy(pos);
    controls.target.copy(target); controls.update();
  }
  function tween(a, b, ms, set, delay = 0, ease = easeOut, fin) { tweens.push({ a, b, ms, set, t0: performance.now() + delay, ease, fin }); pedir(ms + delay + 60); }
  function pedir(ms) { hasta = Math.max(hasta, performance.now() + ms); if (!corriendo) { corriendo = true; requestAnimationFrame(loop); } }
  function loop(now) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const t = tweens[i]; if (now < t.t0) continue; const k = Math.min(1, (now - t.t0) / t.ms);
      t.set(t.a + (t.b - t.a) * t.ease(k)); if (k >= 1) { tweens.splice(i, 1); t.fin && t.fin(); }
    }
    const mov = controls.update();
    if (visible) composer.render();
    if (tweens.length || mov || now < hasta) requestAnimationFrame(loop); else corriendo = false;
  }
  controls.addEventListener('change', () => pedir(250));

  function setBodega(id, bodega, conRepisa = bodega.repisa) {
    const cambia = st.id !== id || st.conRepisa !== conRepisa;
    st.id = id; st.bodega = bodega; st.conRepisa = conRepisa;
    if (cambia) {
      if (mod) scene.remove(mod);
      mod = modulo(bodega.ancho, bodega.largo, bodega.alto, conRepisa); scene.add(mod);
      if (!reduce) { mod.scale.set(1, 0.001, 1); tween(0.001, 1, 700, (v) => mod.scale.set(1, v, 1), 0, easeOut); }
      for (const o of objetos.values()) { scene.remove(o.g); } objetos.clear();
      encuadrar();
    }
    return empacarYPoner();
  }
  function setItems(cuenta) { st.cuenta = { ...cuenta }; return empacarYPoner(); }
  function empacarYPoner() {
    if (!st.bodega) return null;
    const W = st.bodega.ancho, L = st.bodega.largo;
    const res = empacar(expandir(st.cuenta), st.bodega, st.conRepisa ? REPISA : null);
    const dentro = [...res.puestos].sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x).map((p) => ({ ...p, x: p.x - W / 2, z: p.z - L / 2, afuera: false }));
    // lo que no cabe se apila frente a la puerta, en naranja suave
    let fuera = [];
    if (res.afuera.length) {
      const patio = { ancho: Math.max(3.2, W + 1.2), largo: 3.6, alto: 2.0 };
      const r2 = empacar(res.afuera, patio, null);
      fuera = r2.puestos.sort((a, b) => b.z - a.z || a.y - b.y).map((p) => ({ ...p, x: p.x - patio.ancho / 2 + 0.2, z: L / 2 + 0.35 + p.z, afuera: true }));
    }
    st.afuera = res.afuera.length;
    const orden = [...dentro, ...fuera];
    const vivos = new Set(orden.map((p) => p.id + (p.afuera ? '!' : '')));
    for (const [id, o] of objetos) if (!vivos.has(id)) { if (o.dentro) quitar(o); else scene.remove(o.g); objetos.delete(id); }
    for (const p of orden) {
      const key = p.id + (p.afuera ? '!' : '');
      const pos = new THREE.Vector3(p.x, p.y, p.z); const rot = p.rot ? Math.PI / 2 : 0;
      let o = objetos.get(key);
      if (!o) { const g = modelo(p.tipo, p.afuera); g.visible = false; scene.add(g); o = { g, dentro: false }; objetos.set(key, o); }
      const antes = o.dest; o.dest = pos; o.rot = rot; p.key = key;
      if (o.dentro && antes && antes.distanceTo(pos) > 0.005) {
        const a = o.g.position.clone(), r0 = o.g.rotation.y;
        tween(0, 1, 480, (e) => { o.g.position.lerpVectors(a, pos, e); o.g.position.y += Math.sin(Math.PI * e) * 0.35; o.g.rotation.y = r0 + (rot - r0) * e; }, 0, easeInOut);
      }
    }
    const cambioEncuadre = (st._afueraAntes > 0) !== (st.afuera > 0); st._afueraAntes = st.afuera;
    st.res = res; st.orden = orden; if (cambioEncuadre) encuadrar(); opts.onPack && opts.onPack(res); pedir(200);
    return res;
  }
  function quitar(o) { const g = o.g; const y0 = g.position.y; tween(0, 1, 320, (e) => { g.position.y = y0 + e * 2; g.scale.setScalar(Math.max(0.001, 1 - e)); }, 0, easeIn, () => scene.remove(g)); }
  // Muestra los primeros n objetos (de fondo a puerta). Los que entran caen; los que salen suben.
  function mostrar(n = Infinity) {
    n = Math.min(n, st.orden.length); let k = 0;
    st.orden.forEach((p, i) => {
      const o = objetos.get(p.key); if (!o) return;
      if (i < n && !o.dentro) {
        o.dentro = true; const g = o.g; g.visible = true; g.scale.setScalar(1); g.rotation.y = o.rot;
        if (reduce) { g.position.copy(o.dest); return; }
        const alto = 2.6, d = o.dest; g.position.set(d.x, d.y + alto, d.z);
        tween(0, 1, 560, (e) => { if (o.dentro) g.position.set(d.x, d.y + alto * (1 - e), d.z); }, k++ * 38, easeOutBounce);
      } else if (i >= n && o.dentro) {
        o.dentro = false; const g = o.g; const y0 = g.position.y;
        tween(0, 1, 260, (e) => { if (!o.dentro) g.position.y = y0 + e * 2.4; }, 0, easeIn, () => { if (!o.dentro) g.visible = false; });
      }
    });
    st.visibles = n; pedir(200);
  }

  const ro = new ResizeObserver(resize); ro.observe(host);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) pedir(80); }); io.observe(host);
  resize();
  return { setBodega, setItems, mostrar, get estado() { return st; }, get total() { return st.orden.length; },
    dispose() { ro.disconnect(); io.disconnect(); controls.dispose(); composer.dispose(); renderer.dispose(); host.removeChild(renderer.domElement); } };
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function easeIn(t) { return t * t * t; }
function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeOutBounce(x) { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; }
