"use client";

import { useEffect, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { subscribeToPush, unsubscribeFromPush } from "@/features/notifications/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Vraies push notifications serveur (fonctionnent même app fermée, écran
 * verrouillé) — pas de simple notification locale. Nécessite
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY côté client et la brique planifiée
 * send-push-reminders côté Supabase (cf. migration 00011).
 */
export function PushNotificationsToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [denied, setDenied] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    setDenied(Notification.permission === "denied");

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setEnabled(!!sub);
    });
  }, []);

  async function enable() {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setDenied(permission === "denied");
      return;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) return;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

    await subscribeToPush({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
    setEnabled(true);
  }

  async function disable() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await unsubscribeFromPush(sub.endpoint);
      await sub.unsubscribe();
    }
    setEnabled(false);
  }

  async function toggle() {
    if (busy.current) return;
    busy.current = true;
    try {
      if (enabled) await disable();
      else await enable();
    } finally {
      busy.current = false;
    }
  }

  if (!supported) return null;

  return (
    <div className="flex items-center justify-between py-[11px]">
      <div>
        <span className="text-sm">Notifications push</span>
        {denied && !enabled && (
          <div className="text-[11.5px] text-muted mt-0.5">
            Bloquées par le navigateur — autorise-les dans les réglages du site.
          </div>
        )}
      </div>
      <Switch checked={enabled} onCheckedChange={toggle} />
    </div>
  );
}
