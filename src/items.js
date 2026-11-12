// Catálogo de objetos a escala real (metros). w = ancho (x), d = fondo (z), h = alto (y).
// suelo: va directo al piso (no se apila sobre otras cosas). apilable: acepta cosas encima.
// repisa: cabe en la repisa de madera.
export const ITEMS = {
  caja_m:     { nombre: 'Caja mediana', grupo: 'Cajas', w: 0.4, d: 0.4, h: 0.4, apilable: true, repisa: true },
  caja_g:     { nombre: 'Caja grande', grupo: 'Cajas', w: 0.6, d: 0.4, h: 0.45, apilable: true, repisa: true },
  maleta:     { nombre: 'Maleta', grupo: 'Cajas', w: 0.45, d: 0.3, h: 0.7, apilable: false, repisa: true },
  cama2:      { nombre: 'Cama 2 plazas', grupo: 'Dormitorio', w: 1.45, d: 0.4, h: 1.95, suelo: true },
  cama1:      { nombre: 'Cama 1 plaza', grupo: 'Dormitorio', w: 0.95, d: 0.35, h: 1.95, suelo: true },
  ropero:     { nombre: 'Ropero', grupo: 'Dormitorio', w: 1.0, d: 0.55, h: 1.9, suelo: true },
  comoda:     { nombre: 'Cómoda', grupo: 'Dormitorio', w: 0.9, d: 0.45, h: 0.8, suelo: true, apilable: true },
  sofa3:      { nombre: 'Sofá 3 cuerpos', grupo: 'Living', w: 2.0, d: 0.9, h: 0.85, suelo: true },
  sillon:     { nombre: 'Sillón', grupo: 'Living', w: 0.9, d: 0.85, h: 0.85, suelo: true },
  tv:         { nombre: 'Televisor', grupo: 'Living', w: 1.25, d: 0.15, h: 0.8, apilable: false },
  mesa:       { nombre: 'Mesa de comedor', grupo: 'Comedor', w: 1.6, d: 0.9, h: 0.75, suelo: true, apilable: true },
  silla:      { nombre: 'Silla', grupo: 'Comedor', w: 0.45, d: 0.5, h: 0.9 },
  refri:      { nombre: 'Refrigerador', grupo: 'Cocina', w: 0.7, d: 0.7, h: 1.8, suelo: true },
  lavadora:   { nombre: 'Lavadora', grupo: 'Cocina', w: 0.6, d: 0.6, h: 0.85, suelo: true, apilable: true },
  cocina:     { nombre: 'Cocina', grupo: 'Cocina', w: 0.55, d: 0.6, h: 0.85, suelo: true, apilable: true },
  escritorio: { nombre: 'Escritorio', grupo: 'Trabajo', w: 1.2, d: 0.6, h: 0.75, suelo: true, apilable: true },
  bici:       { nombre: 'Bicicleta', grupo: 'Otros', w: 1.7, d: 0.6, h: 1.0, suelo: true },
  herramientas:{ nombre: 'Cajonera de herramientas', grupo: 'Trabajo', w: 0.7, d: 0.45, h: 0.9, suelo: true, apilable: true },
  pallet:     { nombre: 'Pallet con mercadería', grupo: 'Trabajo', w: 1.2, d: 1.0, h: 1.2, suelo: true, apilable: true },
  materiales: { nombre: 'Atado de perfiles', grupo: 'Trabajo', w: 3.0, d: 0.45, h: 0.3, apilable: true },
};

export const GRUPOS = ['Cajas', 'Dormitorio', 'Living', 'Comedor', 'Cocina', 'Trabajo', 'Otros'];

// Escenarios típicos (para «¿Qué cabe?» y atajos del cotizador).
export const PRESETS = {
  depto1: {
    nombre: 'Depto de 1 dormitorio', corto: 'Depto 1D',
    items: { cama2: 1, refri: 1, lavadora: 1, sillon: 1, tv: 1, comoda: 1, mesa: 1, silla: 2, caja_m: 10, caja_g: 4, maleta: 2 },
  },
  casa3: {
    nombre: 'Casa de 3 dormitorios', corto: 'Casa 3D',
    items: { cama2: 1, cama1: 2, ropero: 2, comoda: 2, sofa3: 1, sillon: 1, tv: 2, mesa: 1, silla: 6, refri: 1, lavadora: 1, cocina: 1, escritorio: 1, bici: 2, caja_m: 18, caja_g: 10, maleta: 3 },
  },
  emprende: {
    nombre: 'Stock de emprendimiento', corto: 'Emprendimiento',
    items: { caja_m: 30, caja_g: 18, pallet: 1, escritorio: 1 },
  },
  maestro: {
    nombre: 'Herramientas y materiales', corto: 'Maestro',
    items: { herramientas: 2, materiales: 4, pallet: 1, caja_g: 8, bici: 0, escritorio: 1 },
  },
};
