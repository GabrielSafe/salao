// Service Worker — Rápido Beauty
// Recebe Web Push mesmo com o app completamente fechado

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

// ── Push recebido ─────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: '🔔 Nova solicitação!', body: 'Uma cliente está aguardando você!', url: '/funcionaria' };
  try { data = { ...data, ...event.data?.json() }; } catch {}

  const options = {
    body:             data.body,
    icon:             '/favicon.ico',
    badge:            '/favicon.ico',
    vibrate:          [400, 100, 400, 100, 400], // 3 vibrações
    requireInteraction: true,                    // não some sozinha
    tag:              'nova-proposta',
    renotify:         true,                      // toca mesmo se já tem uma
    silent:           false,
    data:             { url: data.url },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Clique na notificação ─────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/funcionaria';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Foca aba existente se já estiver aberta
      for (const client of windowClients) {
        if (client.url.includes('/funcionaria') && 'focus' in client) {
          return client.focus();
        }
      }
      // Senão abre nova aba
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
