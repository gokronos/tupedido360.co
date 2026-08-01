// Service Worker for TuPedido360 Background Push Notifications & Sound/Vibration Alerts

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {
    title: "🔔 NUEVO PEDIDO RECIBIDO",
    body: "¡Tienes un nuevo pedido en TuPedido360!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "new-order",
    url: "/panel",
    vibrate: [300, 100, 300, 100, 500, 100, 500],
  };

  try {
    payload = { ...payload, ...event.data.json() };
  } catch (e) {
    payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    tag: payload.tag || "new-order",
    renotify: true,
    requireInteraction: true, // Keep notification visible until clicked/opened
    vibrate: payload.vibrate || [300, 100, 300, 100, 500, 100, 500],
    data: payload.data || { url: "/panel" },
    actions: [
      { action: "open", title: "👀 Ver Pedidos" },
      { action: "dismiss", title: "Cerrar" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/panel";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/panel") || client.url.includes("/admin")) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
