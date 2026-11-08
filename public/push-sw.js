// Loaded into the generated service worker (vite.config.ts, importScripts).
// Reminders arrive as FCM data messages: title, body and url.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    const payload = event.data ? event.data.json() : {}
    data = payload.data ?? payload
  } catch {
    return
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? '24', {
      body: data.body ?? '',
      icon: '/pwa-192x192.png',
      tag: 'reminder',
      data: { url: data.url ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => client.url.startsWith(self.registration.scope))
      return open ? open.focus().then(() => open.navigate(url)) : self.clients.openWindow(url)
    }),
  )
})
