// Datos del negocio. Todo lo marcado «confirmar» es propuesta hasta que el cliente lo valide.
export const NEGOCIO = {
  marca: 'Super Bodegas',
  sede: 'Lampa',
  zona: 'Lampa, al norte de Santiago',
  direccion: null, // confirmar: dirección exacta de la sede
  mapa: { lat: -33.2857, lng: -70.8775, zoom: 12 }, // centro de Lampa; mover al punto real
  whatsapp: '+56964138832', // tomado del aviso «RentaBodegasStgo»; confirmar
  whatsappTexto: '+56 9 6413 8832',
  horario: 'Lunes a sábado, 8:00 a 20:00', // confirmar: es el horario de Pudahuel
  respuesta: 'el mismo día hábil', // promesa de contacto tras la solicitud
};

// Bodegas disponibles. Medidas reales de las cotizaciones (largo × ancho × alto, metros).
export const BODEGAS = {
  7: {
    id: 7, nombre: 'Bodega 7 m²', m2: 7, m3: 17, largo: 6, ancho: 1.17, alto: 2.4,
    precio: 69990, // confirmar (propuesta: −26 % vs Pudahuel)
    alcanza: 'Depto de 1 a 2 dormitorios, o el stock de un emprendimiento',
    repisa: false, // confirmar en qué bodegas vienen las repisas
  },
  15: {
    id: 15, nombre: 'Bodega 15 m²', m2: 15, m3: 36, largo: 6, ancho: 2.5, alto: 2.4,
    precio: 119990, // confirmar (propuesta: −27 % vs Pudahuel)
    alcanza: 'Casa completa de 3 dormitorios, o herramientas y materiales de obra',
    repisa: true,
  },
};

// Plazos. «paga» = meses que se cobran del total (6 por 5, 12 por 10).
export const PLAZOS = [
  { id: 1, nombre: 'Mes a mes', meses: 1, paga: 1, nota: 'Te vas cuando quieras, avisando con 15 días' },
  { id: 3, nombre: '3 meses', meses: 3, paga: 3, nota: 'Incluye retiro gratis a domicilio' },
  { id: 6, nombre: '6 meses', meses: 6, paga: 5, nota: 'Pagas 5, guardas 6' },
  { id: 12, nombre: '12 meses', meses: 12, paga: 9, nota: 'Pagas 9, guardas 12' }, // confirmar
];

export const PROMO = {
  activa: true, // confirmar
  nombre: 'Apertura Lampa',
  primerMesDescuento: 0.5, // 50 % el primer mes
  retiroGratisDesdeMeses: 3, // confirmar radio y condiciones
  retiroRadio: 'Lampa, Colina, Chicureo, Quilicura, Batuco y Pudahuel', // confirmar
};

// Precios urbanos publicados (para la comparación «Lejos vale la pena»). Fuente: sitio de contratación de una
// cadena de minibodegas, sucursal Las Condes, consultado el 12-nov-2026.
export const COMPARA = [
  { lugar: 'Las Condes', m2: 7.5, precio: 125000 },
  { lugar: 'Las Condes', m2: 14, precio: 319000 },
];

export const clp = (n) => '$' + Math.round(n).toLocaleString('es-CL');
