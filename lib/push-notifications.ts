import webpush from "web-push";
import { ensureSchema } from "@/db/client";

const DEFAULT_VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BI6wbC7hl3zPf71T60AHPyqwCQu4z8nxnDAY29OTGhZfAYirkD6F8S7cDtXcyJBx2aNQeN9lpC1g5mOlBZiKWfY";
const DEFAULT_VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "gKTHSATfeWEkr_Rau4A1StHUQZOactUabrcSTW14ErE";

let configured = false;
function setupWebPush() {
  if (configured) return;
  try {
    webpush.setVapidDetails(
      "mailto:soporte@tupedido360.co",
      DEFAULT_VAPID_PUBLIC,
      DEFAULT_VAPID_PRIVATE
    );
    configured = true;
  } catch (err) {
    console.error("[WebPush Setup Error]", err);
  }
}

export function getVapidPublicKey() {
  return DEFAULT_VAPID_PUBLIC;
}

export async function broadcastNewOrderNotification(businessId: string, orderData: {
  id: string;
  orderNumber: string;
  customerName: string;
  totalCop: number;
  orderType: string;
  tableNumber?: string | null;
}) {
  try {
    setupWebPush();
    const sql = await ensureSchema();

    const subscriptions = await sql`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE business_id = ${businessId}
    `;

    if (!subscriptions.length) return;

    const payload = JSON.stringify({
      title: `🔔 NUEVO PEDIDO #${orderData.orderNumber}`,
      body: `${orderData.customerName} - $${orderData.totalCop.toLocaleString("es-CO")} COP (${orderData.orderType === "table" ? `Mesa ${orderData.tableNumber || ""}` : orderData.orderType === "pickup" ? "Para Llevar" : "Domicilio"})`,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `order-${orderData.id}`,
      sound: "/sounds/new-order.mp3",
      vibrate: [300, 100, 300, 100, 500, 100, 500],
      data: {
        url: `/panel`,
        orderId: orderData.id,
        timestamp: Date.now(),
      },
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          // Clean up invalid or expired subscription
          await sql`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`;
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error("[Broadcast Push Notification Error]", error);
  }
}
