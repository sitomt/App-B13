/* Service worker de Baktun 13 · Equipo.
   Recibe los Web Push y muestra la notificación tipo banner en el dispositivo,
   incluso con la app cerrada. */

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = {} }

  const title = data.title || 'Baktun 13'
  const options = {
    body: data.body || '',
    icon: '/brand/icon-192.png',
    badge: '/brand/icon-192.png',
    tag: data.tag || undefined,        // agrupa/colapsa avisos del mismo tipo
    renotify: !!data.tag,
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(target); return c.focus() }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target)
    }),
  )
})

// Activa el SW nuevo sin esperar.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
