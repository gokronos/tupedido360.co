import { createHmac, timingSafeEqual } from "node:crypto";

export function validateMercadoPagoSignature(input: {
  dataId: string;
  requestId: string | null;
  signature: string | null;
  secret: string;
}) {
  const parts = new Map(
    (input.signature ?? "").split(",").map((part) => {
      const separator = part.indexOf("=");
      return separator === -1 ? [part.trim(), ""] : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
    }),
  );
  const timestamp = parts.get("ts");
  const providedHash = parts.get("v1");
  if (!timestamp || !providedHash || !/^[a-f0-9]{64}$/i.test(providedHash)) return false;

  const normalizedDataId = input.dataId.toLowerCase();
  const manifest = `id:${normalizedDataId};${input.requestId ? `request-id:${input.requestId};` : ""}ts:${timestamp};`;
  const expectedHash = createHmac("sha256", input.secret).update(manifest).digest("hex");
  return timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(providedHash, "hex"));
}
