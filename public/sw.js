const CACHE_NAME = 'ssc-v.0.1.8'

// Hanya asset statis, BUKAN halaman dinamis
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/ssc.png',
  '/icon-192x192.png',
  '/icon-512x512.png'
]

// INSTALL
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

// FETCH
self.addEventListener('fetch', (event) => {
  const { request } = event

  // ❌ Jangan cache halaman HTML dinamis (dashboard, ujian, login, dll)
  if (request.destination === 'document') {
    event.respondWith(fetch(request))
    return
  }

  // ❌ Jangan ganggu API (auth, submit, hasil, dll)
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request))
    return
  }

  // ✔ Cache hanya static assets (CSS, JS, gambar, font, dll)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request).then((response) => {
        if (
          !response ||
          response.status !== 200 ||
          response.type !== 'basic'
        ) {
          return response
        }

        const clone = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clone)
        })

        return response
      })
    })
  )
})

// ACTIVATE — hapus cache lama
self.addEventListener('activate', (event) => {
  const whitelist = [CACHE_NAME]

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (!whitelist.includes(key)) {
            return caches.delete(key)
          }
        })
      )
    )
  )

  self.clients.claim()
})