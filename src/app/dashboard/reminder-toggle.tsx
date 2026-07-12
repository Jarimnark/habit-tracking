"use client";

import { useEffect, useState } from "react";
import { deletePushSubscription, savePushSubscription } from "@/lib/actions";

type State = "loading" | "unsupported" | "unconfigured" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function ReminderToggle({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vapidPublicKey) return setState("unconfigured");
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return setState("unsupported");
    }
    if (Notification.permission === "denied") return setState("denied");
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("unsupported"));
  }, [vapidPublicKey]);

  async function enable() {
    try {
      setError(null);
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey!),
      });
      await savePushSubscription(JSON.parse(JSON.stringify(sub)));
      setState("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to enable notifications");
    }
  }

  async function disable() {
    try {
      setError(null);
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disable notifications");
    }
  }

  if (state === "loading") return <p className="text-sm text-stone-400">Checking…</p>;
  if (state === "unconfigured")
    return (
      <p className="text-sm text-stone-500">
        Not configured — set the VAPID keys in your environment (see README).
      </p>
    );
  if (state === "unsupported")
    return <p className="text-sm text-stone-500">This browser doesn&apos;t support web push.</p>;
  if (state === "denied")
    return (
      <p className="text-sm text-stone-500">
        Notifications are blocked for this site — allow them in your browser settings, then reload.
      </p>
    );

  return (
    <div>
      {state === "on" ? (
        <button onClick={disable} className="text-sm text-stone-500 hover:underline">
          Reminders are on for this device — turn off
        </button>
      ) : (
        <button
          onClick={enable}
          className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Enable reminders on this device
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
