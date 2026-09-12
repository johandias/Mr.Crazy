const CACHE_NAME = 'mr-crazy-pwa-v' + Date.now();
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/app-icon-192.png',
  '/app-icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  // Ativa imediatamente a nova versão baixada sem esperar o usuário fechar as abas
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  // Assume controle de todas as abas e clientes abertos instantaneamente
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Não intercepta chamadas de API, autenticação, OpenAI ou websockets
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('openai.com') ||
    url.hostname.includes('supabase.co')
  ) {
    return;
  }

  // Network-first com fallback para cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
