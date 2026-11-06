/**
 * Shetos Store - Telegram relay (Cloudflare Worker)
 * The bot token never reaches the browser.
 *
 * Deploy:
 *   1. Cloudflare dashboard -> Workers -> Create -> paste this file.
 *   2. Settings -> Variables and Secrets, add:
 *        BOT_TOKEN       (secret)  the NEW token from @BotFather
 *        CHAT_ID         (secret)  your chat id
 *        ALLOWED_ORIGIN  (text)    https://your-site-domain.com   (no trailing slash)
 *   3. Copy the Worker URL into NOTIFY_URL in script.js.
 */
const MAX_TEXT = 3500;
const MAX_PHOTO = 5 * 1024 * 1024;
const LIMIT = 15;          // requests per IP per minute (per Worker instance)
const hits = new Map();

function cors(env, req) {
  const origin = req.headers.get('Origin') || '';
  const ok = origin === env.ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': ok ? origin : env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}
const json = (obj, status, h) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...h } });

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > LIMIT;
}

export default {
  async fetch(req, env) {
    const h = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405, h);
    if ((req.headers.get('Origin') || '') !== env.ALLOWED_ORIGIN) return json({ ok: false, error: 'origin' }, 403, h);

    const ip = req.headers.get('CF-Connecting-IP') || 'x';
    if (limited(ip)) return json({ ok: false, error: 'rate' }, 429, h);

    const path = new URL(req.url).pathname;
    const api = `https://api.telegram.org/bot${env.BOT_TOKEN}`;

    try {
      if (path === '/message') {
        const body = await req.json();
        const text = String(body.text || '').slice(0, MAX_TEXT);
        if (!text.trim()) return json({ ok: false, error: 'empty' }, 400, h);
        const r = await fetch(`${api}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: env.CHAT_ID, text })
        });
        const d = await r.json();
        return json({ ok: !!d.ok }, d.ok ? 200 : 502, h);
      }

      if (path === '/photo') {
        const form = await req.formData();
        const photo = form.get('photo');
        if (!photo || typeof photo === 'string' || photo.size > MAX_PHOTO) return json({ ok: false, error: 'photo' }, 400, h);
        const fd = new FormData();
        fd.append('chat_id', env.CHAT_ID);
        fd.append('caption', String(form.get('caption') || '').slice(0, 1000));
        fd.append('photo', photo, 'account.jpg');
        const r = await fetch(`${api}/sendPhoto`, { method: 'POST', body: fd });
        const d = await r.json();
        return json({ ok: !!d.ok }, d.ok ? 200 : 502, h);
      }

      return json({ ok: false, error: 'not found' }, 404, h);
    } catch (e) {
      return json({ ok: false, error: 'server' }, 500, h);
    }
  }
};