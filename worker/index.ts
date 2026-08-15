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

// Chrome impose qu'un push aboutisse TOUJOURS à une notification affichée
// (politique "no silent push") : si showNotification() n'est jamais appelée
// avec succès avant la fin de waitUntil(), le navigateur affiche à la place
// sa propre notification générique ("Ce site a été mis à jour en arrière-
// plan"). D'où le try/catch imbriqué ci-dessous : même si les options
// avancées (icon/badge/vibrate) posent problème sur un appareil donné, on
// retente en minimal plutôt que de laisser passer une notif vide.
self.addEventListener("push", (event: PushEvent) => {
  event.waitUntil(handlePush(event));
});

async function handlePush(event: PushEvent) {
  let data: PushPayload = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: "PlannIt", body: event.data?.text() };
  }

  const title = data.title || "PlannIt";

  try {
    await self.registration.showNotification(title, {
      body: data.body,
      tag: data.tag,
      icon: "/icons/icon.svg",
      // PNG dédié, pas le SVG couleur : Android masque le badge à sa seule
      // couche alpha (silhouette) et rend le SVG de façon peu fiable pour ce
      // champ précis, d'où le carré générique observé sans ce fichier.
      badge: "/icons/badge.png",
      // Reste affichée jusqu'à ce que l'utilisateur clique/balaie, plutôt
      // que de disparaître seule après quelques secondes.
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { eventId: data.eventId },
    });
  } catch {
    await self.registration.showNotification(title, { body: data.body });
  }
}

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
