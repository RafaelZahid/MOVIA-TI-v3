// 🚀 MOVIA TI - Service Worker mejorado (versión lista para producción)
// Usa Workbox y agrega manejo de caché dinámico, actualización automática y soporte offline.

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE_NAME = "movia-ti-cache-v1";
const OFFLINE_URL = "offline.html"; // Crea este archivo en tu carpeta raíz

// 💡 Forzar actualización cuando haya una nueva versión del SW
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 📦 Archivos que se precachean al instalar el SW
self.addEventListener("install", async (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([
        OFFLINE_URL,
        "/index.html",
        "/manifest.json",
        "/styles.css",
        "/script.js",
        "/icons/icon-192x192.png",
        "/icons/icon-512x512.png",
      ]))
  );
  self.skipWaiting();
});

// ♻️ Activar y limpiar versiones antiguas del caché
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🧹 Eliminando caché viejo:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 🚦 Habilitar navegación previa si es compatible
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// ⚡ Estrategia de recuperación: primero red, luego caché y fallback offline
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;
        if (preloadResp) return preloadResp;

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResp = await cache.match(OFFLINE_URL);
        return cachedResp;
      }
    })());
  } else {
    // 🧠 Estrategia para archivos estáticos (CSS, JS, imágenes)
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((resp) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resp.clone());
            return resp;
          });
        }).catch(() => caches.match(OFFLINE_URL));
      })
    );
  }
});
