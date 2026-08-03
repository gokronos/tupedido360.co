import webpush from "web-push";
import { ensureSchema } from "@/db/client";

function vapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) throw new Error("VAPID_NOT_CONFIGURED");
  return { publicKey, privateKey };
}

let configured = false;
function setupWebPush() {
  if (configured) return;
  const { publicKey, privateKey } = vapidKeys();
  webpush.setVapidDetails("mailto:soporte@tupedido360.co", publicKey, privateKey);
  configured = true;
}

export function getVapidPublicKey() {
  return vapidKeys().publicKey;
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
      icon: "/icon.svg",
      tag: `order-${orderData.id}`,
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
      } catch (error: unknown) {
        const statusCode = typeof error === "object" && error && "statusCode" in error
          ? Number(error.statusCode)
          : null;
        if (statusCode === 404 || statusCode === 410) {
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
