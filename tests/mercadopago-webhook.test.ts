import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { validateMercadoPagoSignature } from "../lib/mercadopago-webhook.ts";

test("validates Mercado Pago's documented webhook manifest", () => {
  const secret = "webhook-secret";
  const manifest = "id:12345;request-id:request-abc;ts:1704908010;";
  const hash = createHmac("sha256", secret).update(manifest).digest("hex");
  assert.equal(validateMercadoPagoSignature({
    dataId: "12345",
    requestId: "request-abc",
    signature: `ts=1704908010,v1=${hash}`,
    secret,
  }), true);
});
test("rejects a modified Mercado Pago signature", () => {
  assert.equal(validateMercadoPagoSignature({
    dataId: "12345",
    requestId: "request-abc",
    signature: `ts=1704908010,v1=${"0".repeat(64)}`,
    secret: "webhook-secret",
  }), false);
});
