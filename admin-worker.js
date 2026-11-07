/**
 * Shetos Store - Admin API (Cloudflare Worker)
 * The admin password lives ONLY here (as a secret), never in the website files.
 *
 * Deploy:
 *   1. Cloudflare dashboard -> Workers -> Create -> paste this file (name it e.g. shetos-admin).
 *   2. Settings -> Variables and Secrets, add:
 *        ADMIN_PASSWORD   (secret)  the admin password
 *        ALLOWED_ORIGIN   (text)    https://your-site-domain.com   (no trailing slash)
 *        TOKEN_SECRET     (secret)  optional, any long random text (signs login tokens)
 *        FIREBASE_SECRET  (secret)  optional, Firebase "database secret" (only needed once you lock your DB rules)
 *        FIREBASE_URL     (text)    optional, defaults to your Realtime Database URL below
 *   3. Copy the Worker URL into API at the top of admin.js.
 */
const DEFAULT_DB = 'https://shetosstore-90413-default-rtdb.europe-west1.firebasedatabase.app';
const ADMIN_PHONE = '01227395613';
const ADMIN_NAME = 'adam sameh';
const ADMIN_KEY = 'p_' + ADMIN_PHONE;
const TOKEN_TTL = 12 * 3600 * 1000;

const enc = new TextEncoder();
const norm = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
const clip = (s, n) => String(s == null ? '' : s).slice(0, n);
const SAFE_KEY = /^[A-Za-z0-9_-]{1,80}$/;

/* ---------- crypto helpers ---------- */
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function sign(env, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode((env.TOKEN_SECRET || env.ADMIN_PASSWORD || 'x') + '|shetos-admin'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
function safeEq(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
async function passwordOk(env, pw) {
  if (!env.ADMIN_PASSWORD) return false;
  return safeEq(await sign(env, 'pw:' + String(pw)), await sign(env, 'pw:' + env.ADMIN_PASSWORD));
}
async function makeToken(env) {
  const exp = Date.now() + TOKEN_TTL;
  return { token: exp + '.' + await sign(env, 'tok:' + exp), exp };
}
async function tokenOk(env, req) {
  const h = req.headers.get('Authorization') || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [exp, sig] = t.split('.');
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  return safeEq(sig, await sign(env, 'tok:' + exp));
}

/* ---------- rate limiting (per Worker instance) ---------- */
const failed = new Map(), pub = new Map();
function hit(map, ip, windowMs, max) {
  const now = Date.now();
  const arr = (map.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  map.set(ip, arr);
  if (map.size > 5000) map.clear();
  return arr.length > max;
}
const blocked = (ip) => (failed.get(ip) || []).filter((t) => Date.now() - t < 15 * 60000).length >= 5;

/* ---------- http helpers ---------- */
function cors(env, req) {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': origin === env.ALLOWED_ORIGIN ? origin : env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
  };
}
const json = (obj, status, h) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...h } });

/* ---------- Firebase Realtime Database (REST) ---------- */
async function fb(env, method, path, body) {
  const base = (env.FIREBASE_URL || DEFAULT_DB).replace(/\/+$/, '');
  const url = `${base}/${path}.json` + (env.FIREBASE_SECRET ? `?auth=${encodeURIComponent(env.FIREBASE_SECRET)}` : '');
  const r = await fetch(url, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!r.ok) throw new Error('db ' + r.status);
  return r.json();
}

const cairoDay = (t) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });

export default {
  async fetch(req, env) {
    const h = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if ((req.headers.get('Origin') || '') !== env.ALLOWED_ORIGIN) return json({ ok: false, error: 'origin' }, 403, h);

    const ip = req.headers.get('CF-Connecting-IP') || 'x';
    const parts = new URL(req.url).pathname.split('/').filter(Boolean);
    const route = parts.join('/');

    try {
      /* ===== admin login ===== */
      if (req.method === 'POST' && route === 'login') {
        if (blocked(ip)) return json({ ok: false, error: 'rate' }, 429, h);
        const b = await req.json();
        const good = String(b.phone) === ADMIN_PHONE && norm(b.name) === ADMIN_NAME && await passwordOk(env, b.password);
        if (!good) {
          const arr = failed.get(ip) || []; arr.push(Date.now()); failed.set(ip, arr);
          await new Promise((r) => setTimeout(r, 600));
          return json({ ok: false, error: 'wrong' }, 401, h);
        }
        failed.delete(ip);
        const t = await makeToken(env);
        return json({ ok: true, token: t.token, exp: t.exp }, 200, h);
      }

      /* ===== public tracking (visitors / orders) ===== */
      if (req.method === 'POST' && route === 'track/visit') {
        if (hit(pub, ip, 60000, 30)) return json({ ok: false, error: 'rate' }, 429, h);
        const b = await req.json();
        const vid = String(b.vid || '');
        if (!/^[A-Za-z0-9-]{8,64}$/.test(vid)) return json({ ok: false }, 400, h);
        const now = Date.now();
        if (b.kind === 'identify') {
          const contact = clip(b.contact, 80);
          if (contact === ADMIN_PHONE) return json({ ok: true }, 200, h); // never list the admin as a visitor
          await fb(env, 'PATCH', 'visits/' + vid, { name: clip(b.name, 60), contact, last: now });
        } else {
          const old = (await fb(env, 'GET', 'visits/' + vid)) || {};
          await fb(env, 'PATCH', 'visits/' + vid, {
            first: old.first || now, last: now, count: (old.count || 0) + 1,
            lang: clip(b.lang, 20), ref: clip(b.ref, 120),
            country: (req.cf && req.cf.country) || old.country || ''
          });
        }
        return json({ ok: true }, 200, h);
      }

      if (req.method === 'POST' && route === 'track/order') {
        if (hit(pub, ip, 60000, 30)) return json({ ok: false, error: 'rate' }, 429, h);
        const b = await req.json();
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        await fb(env, 'PUT', 'orders/' + id, {
          ts: Date.now(), customer: clip(b.customer, 60), contact: clip(b.contact, 80),
          game: clip(b.game, 60), item: clip(b.item, 120),
          price: Math.max(0, Number(b.price) || 0), playerId: clip(b.playerId, 60)
        });
        return json({ ok: true }, 200, h);
      }

      /* ===== everything below needs the admin token ===== */
      if (parts[0] !== 'admin') return json({ ok: false, error: 'not found' }, 404, h);
      if (!(await tokenOk(env, req))) return json({ ok: false, error: 'auth' }, 401, h);

      if (req.method === 'GET' && parts[1] === 'overview') {
        const [users, accs, visits, orders] = await Promise.all([
          fb(env, 'GET', 'users'), fb(env, 'GET', 'accounts_meta'), fb(env, 'GET', 'visits'), fb(env, 'GET', 'orders')
        ]);
        const U = Object.entries(users || {}).map(([key, v]) => ({ key, ...v }));
        const A = Object.values(accs || {}).filter((a) => a && a.id);
        const V = Object.entries(visits || {}).map(([vid, v]) => ({ vid, ...v }));
        const O = Object.entries(orders || {}).map(([id, v]) => ({ id, ...v }));
        const today = cairoDay(Date.now());
        const stats = {
          visitors: V.length,
          visitorsToday: V.filter((v) => v.last && cairoDay(v.last) === today).length,
          totalVisits: V.reduce((s, v) => s + (v.count || 0), 0),
          users: U.length,
          accounts: A.length,
          orders: O.length,
          revenue: O.reduce((s, o) => s + (Number(o.price) || 0), 0)
        };
        V.sort((a, b) => (b.last || 0) - (a.last || 0));
        O.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        U.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        A.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return json({ ok: true, stats, users: U, accounts: A, visitors: V.slice(0, 1000), orders: O.slice(0, 1000) }, 200, h);
      }

      const id = parts[2];
      if (!id || !SAFE_KEY.test(id)) return json({ ok: false, error: 'id' }, 400, h);

      if (req.method === 'DELETE' && parts[1] === 'users') {
        if (id === ADMIN_KEY) return json({ ok: false, error: 'protected' }, 403, h);
        if (new URL(req.url).searchParams.get('accounts') === '1') {
          const accs = (await fb(env, 'GET', 'accounts_meta')) || {};
          for (const a of Object.values(accs)) {
            if (a && a.owner === id && SAFE_KEY.test(a.id || '')) {
              await fb(env, 'DELETE', 'accounts_meta/' + a.id);
              await fb(env, 'DELETE', 'account_photos/' + a.id);
            }
          }
        }
        await fb(env, 'DELETE', 'users/' + id);
        return json({ ok: true }, 200, h);
      }

      if (req.method === 'DELETE' && parts[1] === 'accounts') {
        await fb(env, 'DELETE', 'accounts_meta/' + id);
        await fb(env, 'DELETE', 'account_photos/' + id);
        return json({ ok: true }, 200, h);
      }

      if (req.method === 'PATCH' && parts[1] === 'accounts') {
        const cur = await fb(env, 'GET', 'accounts_meta/' + id);
        if (!cur) return json({ ok: false, error: 'missing' }, 404, h);
        const b = await req.json();
        const f = {};
        if (b.game !== undefined) f.game = clip(b.game, 60);
        if (b.price !== undefined) f.price = Math.max(0, Number(b.price) || 0);
        if (b.info !== undefined) f.info = clip(b.info, 1000);
        if (b.phone !== undefined) {
          if (!/^01[0-9]{9}$/.test(String(b.phone))) return json({ ok: false, error: 'phone' }, 400, h);
          f.phone = String(b.phone);
        }
        await fb(env, 'PATCH', 'accounts_meta/' + id, f);
        return json({ ok: true }, 200, h);
      }

      if (req.method === 'DELETE' && parts[1] === 'visitors') {
        await fb(env, 'DELETE', 'visits/' + id);
        return json({ ok: true }, 200, h);
      }

      if (req.method === 'DELETE' && parts[1] === 'orders') {
        await fb(env, 'DELETE', 'orders/' + id);
        return json({ ok: true }, 200, h);
      }

      return json({ ok: false, error: 'not found' }, 404, h);
    } catch (e) {
      return json({ ok: false, error: 'server' }, 500, h);
    }
  }
};
