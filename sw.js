/**
 * Ultimate Draft - Service Worker (PWA)
 * Soporte offline y aceleración de carga para dispositivos móviles y escritorio.
 */

const CACHE_NAME = 'ultimate-draft-v2.2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/privacy.html',
    '/terms.html',
    '/cookies.html',
    '/css/style.css',
    '/js/app.js',
    '/js/simulation.js',
    '/js/audio.js',
    '/js/spatial-nav.js',
    '/js/consent.js',
    '/js/data/players.js',
    '/favicon.svg',
    '/manifest.webmanifest',
    '/icons/basketball.svg',
    '/icons/trophy.svg',
    '/icons/star.svg',
    '/icons/chart.svg',
    '/icons/search.svg',
    '/icons/volume-up.svg',
    '/icons/volume-mute.svg',
    '/icons/fullscreen.svg',
    '/icons/fullscreen-exit.svg',
    '/icons/stop.svg',
    '/icons/warning.svg'
];

// Instalación: Precachear recursos estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] Algunos recursos no pudieron precachearse:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activación: Limpieza de versiones obsoletas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Estrategia de Fetch: Network-first para documentos HTML, Stale-while-revalidate para recursos estáticos
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Solo gestionar solicitudes HTTP/HTTPS del mismo origen o CDNs permitidas
    if (request.method !== 'GET') return;

    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    const clonedResponse = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clonedResponse);
                    });
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || caches.match('/index.html');
                    });
                })
        );
        return;
    }

    // Para estáticos locales: Cache First con Network Fallback
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    // Actualizar en segundo plano si está disponible
                    fetch(request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, networkResponse);
                            });
                        }
                    }).catch(() => {});
                    return cachedResponse;
                }
                return fetch(request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                    return networkResponse;
                });
            })
        );
    }
});
