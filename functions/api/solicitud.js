// Cloudflare Pages Function: POST /api/solicitud → Telegram.
// Variables (Pages → Settings → Environment variables, como secretos): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
import { procesar } from '../_lib/solicitud.js';

const cab = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

export async function onRequestPost({ request, env }) {
  const origen = request.headers.get('origin');
  if (origen && new URL(origen).host !== new URL(request.url).host) return new Response('{"ok":false}', { status: 403, headers: cab });
  const largo = Number(request.headers.get('content-length') || 0);
  if (largo > 8000) return new Response('{"ok":false}', { status: 413, headers: cab });
  let body; try { body = await request.json(); } catch { return new Response('{"ok":false}', { status: 400, headers: cab }); }
  const r = await procesar(body, env);
  return new Response(JSON.stringify(r.body), { status: r.status, headers: cab });
}
