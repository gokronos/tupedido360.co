"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Volume2 } from "lucide-react";

export function PushNotificationRegistrar({
  enabled = true,
}: {
  enabled?: boolean;
}) {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (
      !enabled ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }

    // Register Service Worker
    navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        setPermission(Notification.permission);
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          setSubscribed(true);
        }
      })
      .catch((err) => console.error("[SW Register Error]", err));
  }, [enabled]);

  async function enableNotifications() {
    if (permission === "unsupported") return;
    setLoading(true);

    try {
      const res = await Notification.requestPermission();
      setPermission(res);

      if (res !== "granted") {
        alert(
          "Para recibir avisos de nuevos pedidos, debes permitir las notificaciones.",
        );
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const keyRes = await fetch("/api/push/subscribe");
        const { publicKey } = await keyRes.json();

        if (!publicKey) throw new Error("Falta clave VAPID");

        const convertedKey = urlBase64ToUint8Array(publicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      const subObj = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subObj),
      });

      setSubscribed(true);

      // Confirma la activación con vibración cuando el dispositivo la admite.
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (err) {
      console.error("[Subscribe Error]", err);
      alert("No se pudo completar la suscripción a notificaciones.");
    } finally {
      setLoading(false);
    }
  }

  if (!enabled || permission === "unsupported") return null;

  return (
    <div
      style={{
        padding: "0.6rem 1rem",
        background: subscribed
          ? "rgba(16, 185, 129, 0.12)"
          : "rgba(245, 158, 11, 0.15)",
        border: `1px solid ${subscribed ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.4)"}`,
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        margin: "0.8rem 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
        {subscribed ? (
          <Volume2 size={20} color="#10b981" />
        ) : (
          <BellOff size={20} color="#f59e0b" />
        )}
        <div>
          <strong
            style={{
              fontSize: "0.88rem",
              display: "block",
              color: subscribed ? "#10b981" : "#f59e0b",
            }}
          >
            {subscribed
              ? "Notificaciones de pedidos activas"
              : "Alertas en celular desactivadas"}
          </strong>
          <small style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
            {subscribed
              ? "Recibirás un aviso del sistema cuando llegue un pedido, incluso con la app cerrada."
              : "Actívalas para recibir avisos de nuevos pedidos."}
          </small>
        </div>
      </div>
      {!subscribed && (
        <button
          onClick={enableNotifications}
          disabled={loading}
          style={{
            background: "#176b4d",
            color: "#fff",
            border: "none",
            padding: "0.45rem 0.85rem",
            borderRadius: "7px",
            fontWeight: 600,
            fontSize: "0.82rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            whiteSpace: "nowrap",
          }}
        >
          <Bell size={15} />
          {loading ? "Activando..." : "Activar Alertas"}
        </button>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
