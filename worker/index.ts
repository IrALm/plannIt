/// <reference lib="webworker" />
export {};

declare const self: ServiceWorkerGlobalScope;

type PushPayload = {
  title?: string;
  body?: string;
  tag?: string;
  eventId?: string;
};

// Injecté dans le service worker généré par @ducanh2912/next-pwa via
// importScripts (customWorkerSrc = "worker/", cf. next.config.ts) — ce
// fichier tourne dans le même scope `self` que le sw Workbox, en plus de lui.

self.addEventListener("push", (event: PushEvent) => {
  let data: PushPayload = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: "PlannIt", body: event.data?.text() };
  }

  const title = data.title || "PlannIt";
  const options: NotificationOptions = {
    body: data.body,
    tag: data.tag,
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    // Reste affichée jusqu'à ce que l'utilisateur clique/balaie, plutôt que
    // de disparaître seule après quelques secondes.
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { eventId: data.eventId },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const eventId = (event.notification.data as { eventId?: string } | undefined)?.eventId;
  const targetUrl = eventId ? `/dashboard?event=${eventId}` : "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        const existing = clientsArr[0] as WindowClient | undefined;
        if (existing) return existing.navigate(targetUrl).then((c) => c?.focus());
        return self.clients.openWindow(targetUrl);
      })
  );
});
