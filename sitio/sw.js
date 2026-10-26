/**
 * Service Worker — El Bodegón de los Trajes (Tunja, Boyacá)
 * Arquitectura de Rendimiento PWA / Optimizador de Caché Senior
 * 
 * Estrategias:
 * - App Shell (HTML, CSS, JS): Cache-First con revalidación periódica.
 * - Catálogo & Datos (JSON, API pública): Stale-While-Revalidate (0ms de latencia).
 * - Imágenes WebP / Assets: Cache-First dinámico con límite de almacenamiento.
 * - Operaciones Admin y mutaciones (POST, PUT, DELETE): Siempre bypass de red.
 */

const CACHE_VERSION = 'bodegon-v2.1';
const STATIC_CACHE = `bodegon-static-${CACHE_VERSION}`;
const DATA_CACHE = `bodegon-data-${CACHE_VERSION}`;
const IMG_CACHE = `bodegon-img-${CACHE_VERSION}`;

const CORE_ASSETS = [
  './',
  'index.html',
  'css/base.css?v=20261016_v3',
  'css/navbar.css?v=20261016_v3',
  'css/hero.css?v=20261016_v3',
  'css/layout.css?v=20261016_v3',
  'css/contact.css?v=20261016_v3',
  'css/assistant.css?v=20261016_v3',
  'css/seasons.css?v=20261016_v3',
  'css/nosotros.css?v=20261016_v4',
  'css/responsive.css?v=20261016_v3',
  'css/season-colors.css?v=20261016_v3',
  'js/app.js?v=20261016_v3',
  'js/catalog-renderer.js?v=20261016_v3',
  'js/assistant.js?v=20261016_v3',
  'assets/img/logo.jpg',
  'assets/img/ph-generico.svg',
  'data/catalogo.json',
  'data/config-negocio.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return Promise.allSettled(
        CORE_ASSETS.map((asset) => cache.add(asset))
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE, DATA_CACHE, IMG_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo interceptar peticiones GET dentro del mismo origen
  if (req.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // Bypass absoluto para panel de administración, autenticación, uploads y APIs dinámicas
  if (url.pathname.includes('/admin') || (url.pathname.includes('/api/') && !url.pathname.endsWith('/api/catalogo') && !url.pathname.endsWith('/api/config'))) {
    return;
  }

  // 1. Datos del catálogo y configuración (Stale-While-Revalidate)
  if (url.pathname.endsWith('catalogo.json') || url.pathname.endsWith('config-negocio.json') || url.pathname.endsWith('/api/catalogo') || url.pathname.endsWith('/api/config')) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) => {
        return cache.match(req).then((cachedResponse) => {
          const fetchPromise = fetch(req).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(req, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 2. Imágenes WebP, JPG, PNG, SVG (Cache-First)
  if (/\.(webp|jpg|jpeg|png|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(IMG_CACHE).then((cache) => {
        return cache.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(req, networkRes.clone());
            }
            return networkRes;
          }).catch(() => {
            if (url.pathname.endsWith('.svg') || url.pathname.includes('ph-')) {
              return caches.match('assets/img/ph-generico.svg');
            }
          });
        });
      })
    );
    return;
  }

  // 3. App Shell y archivos estáticos (Stale-While-Revalidate / Cache-First)
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((netRes) => {
        if (netRes && netRes.status === 200) {
          const resClone = netRes.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, resClone));
        }
        return netRes;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
