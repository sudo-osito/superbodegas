import { defineConfig, loadEnv } from 'vite';
import { readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const parcial = (n) => readFileSync(resolve(__dirname, 'src/partials', n + '.html'), 'utf8');

// Inserta cabecera y pie compartidos: <!-- @cabecera --> y <!-- @pie -->
const parciales = () => ({
  name: 'parciales',
  transformIndexHtml: (html) => html.replace(/<!-- @(\w+) -->/g, (_, n) => parcial(n)),
});

// En local, /api/solicitud se atiende acá con el mismo código de Cloudflare.
const api = (env) => ({
  name: 'api-local',
  configureServer(server) {
    server.middlewares.use('/api/solicitud', async (req, res) => {
      if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
      let raw = ''; for await (const c of req) { raw += c; if (raw.length > 8000) break; }
      let body = null; try { body = JSON.parse(raw); } catch {}
      const { procesar } = await server.ssrLoadModule('/functions/_lib/solicitud.js');
      const guardar = async (o) => { mkdirSync(resolve(__dirname, 'data'), { recursive: true }); appendFileSync(resolve(__dirname, 'data/solicitudes-dev.jsonl'), JSON.stringify(o) + '\n'); };
      const r = await procesar(body, env, guardar);
      res.statusCode = r.status; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(r.body));
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, 'TELEGRAM_');
  return {
    plugins: [parciales(), api(env)],
    build: { rollupOptions: { input: { index: resolve(__dirname, 'index.html'), arrienda: resolve(__dirname, 'arrienda.html') } } },
  };
});
