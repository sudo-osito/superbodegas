# Super Bodegas · sitio v1 — plan (12-nov-2026)

## Brief
Super Bodegas arrienda minibodegas de 7 y 15 m² en Lampa, al norte de Santiago. Audiencia: familias del norte que se
cambian o remodelan, emprendedores con stock, maestros con herramientas y gente que guarda por meses. Único trabajo de
la página: que la persona cotice y deje su **solicitud de arriendo en línea** (llega a Telegram y el equipo la contacta
por WhatsApp para coordinar, firmar y pagar).

## Marca (provisional hasta el logo definitivo)
- Fondo blanco. Negro `#111111` (texto, footer). Naranja `#FF5F15` (bloques, botones con texto negro, acentos grandes;
  nunca texto chico naranja sobre blanco: no pasa AA). Hormigón `#F3F3EF`, línea `#E2E2DC`, gris texto `#5D5D57`.
- Tipografía: Archivo (ancho variable): títulos en ancho expandido tipo señalética; cuerpo en ancho normal.
  JetBrains Mono para medidas y datos (6 × 2,5 × 2,4 m).
- Forma: esquinas casi rectas (4 px) como paneles de acero; botones 8 px.
- **Firma visual:** la bodega en 3D que se llena como Tetris con objetos a escala real. Es la única animación compleja.

## Páginas
1. `index.html` — hero con foto + franja de precios · datos · «¿Qué cabe?» (3D) · tamaños con plano · «Lejos vale la pena»
   (comparación de precio por m²) · cómo funciona (4 pasos reales) · seguridad · llegar en auto · ubicación · preguntas · cierre.
2. `cotizar.html` — 5 pasos (qué guardas → tamaño → plazo y fecha → datos → revisar y enviar) con el 3D al lado que
   cambia con cada opción y precio en vivo. Patrón tomado de Aki KB (tamaño → seguro/fecha → datos → firma → pago),
   reemplazando firma y pago por «te contactamos».
3. `functions/api/solicitud.js` — valida y manda la solicitud a Telegram (Cloudflare Pages Function). En local la
   atiende Vite; sin token se guarda en `data/solicitudes-dev.jsonl`.

## Datos por confirmar con el cliente (todos en `src/config.js`)
Precios ($69.990 / $119.990 son propuesta), promoción de apertura, retiro gratis y su radio, horario de Lampa,
dirección exacta, seguridad real, IVA, seguro.
