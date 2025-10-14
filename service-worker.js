// --- Service Worker para Movia TI ---

const CACHE_NAME = 'movia-ti-cache-v1';
const OFFLINE_URL = 'offline.html';

// Instalar y cachear archivos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([
        '/',
        '/index.html',
        '/offline.html',
        '/manifest.json',
        '/css/styles.css',
        '/js/main.js',
        '/images/logo.png'
      ]))
  );
});

// Activar y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
});

// Estrategia de red: usa red y si falla, el caché
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
  }
});
