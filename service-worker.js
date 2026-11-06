const CACHE_NAME = 'shetos-store-v8-login';
const CORE_ASSETS = [
    './',
    './index.html',
    './style.css?v=6',
    './effects.css?v=7',
    './glass.css?v=1',
    './script.js?v=10',
    './effects.js?v=8',
    './manifest.json',
    './icon.svg',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable-512.png'
];

// Cache each asset on its own so one missing file can never block the whole install.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            Promise.allSettled(CORE_ASSETS.map((asset) => cache.add(asset)))
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Only handle GET requests; orders (POST) always go straight to the network.
    if (req.method !== 'GET') return;

    // Only cache OUR OWN files. Firebase (accounts, users), Workers, Telegram and
    // external images always go to the network so data is never stale or stored.
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    // Pages: network-first so users always get the newest layout, cache as offline fallback.
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put('./index.html', copy)).catch(() => {});
                    return res;
                })
                .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
        );
        return;
    }

    // Static assets: stale-while-revalidate (fast + self-updating).
    event.respondWith(
        caches.match(req).then((cached) => {
            const network = fetch(req)
                .then((res) => {
                    if (res && res.ok && res.type === 'basic') {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
                    }
                    return res;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});