// Guanghe OMS — Simple Service Worker
// Strategy: Network-first with offline fallback for navigation

const CACHE_NAME = 'guanghe-oms-v1'
const OFFLINE_URL = '/offline.html'

// Install: cache the offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/offline.html', '/favicon.svg', '/icon-192.svg', '/icon-512.svg', '/manifest.json'])
    )
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first, fallback to cache, fallback to offline page for navigations
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return
  if (!request.url.startsWith(self.location.origin)) return

  // Skip API requests (always fresh)
  if (request.url.includes('/api/')) return

  // Skip auth callback
  if (request.url.includes('/auth/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME)
        return (await cache.match(OFFLINE_URL)) || new Response('Offline', { status: 503 })
      })
    )
    return
  }

  // For assets: cache-then-network
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
    )
  )
})
