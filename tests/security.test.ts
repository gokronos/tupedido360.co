import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedRequestOrigin, isUnsafeApiMutation } from "../lib/request-security.ts";
import { createSessionToken, readSessionToken } from "../lib/session.ts";
import { shouldRewriteTenantPath } from "../lib/tenant-routing.ts";
import { loginDestination } from "../lib/play-app.ts";

process.env.SESSION_SECRET = "test-secret-that-is-at-least-thirty-two-characters";

test("accepts same-origin mutations and rejects foreign or malformed origins", () => {
  assert.equal(isAllowedRequestOrigin("https://tupedido360.co", "tupedido360.co"), true);
  assert.equal(isAllowedRequestOrigin("https://evil.example", "tupedido360.co"), false);
  assert.equal(isAllowedRequestOrigin("not-a-url", "tupedido360.co"), false);
  assert.equal(isAllowedRequestOrigin(null, "tupedido360.co"), true);
});

test("protects API mutations while allowing signed external reports", () => {
  assert.equal(isUnsafeApiMutation("POST", "/api/orders"), true);
  assert.equal(isUnsafeApiMutation("GET", "/api/orders"), false);
  assert.equal(isUnsafeApiMutation("POST", "/api/webhooks/mercadopago"), false);
  assert.equal(isUnsafeApiMutation("POST", "/api/csp-report"), false);
});

test("keeps shared APIs and app assets at the root on tenant subdomains", () => {
  assert.equal(shouldRewriteTenantPath("/admin"), true);
  assert.equal(shouldRewriteTenantPath("/"), true);
  assert.equal(shouldRewriteTenantPath("/api/auth/login"), false);
  assert.equal(shouldRewriteTenantPath("/api/orders"), false);
  assert.equal(shouldRewriteTenantPath("/manifest.json"), false);
  assert.equal(shouldRewriteTenantPath("/icon.svg"), false);
});

test("keeps Play app sessions inside the app host", () => {
  assert.equal(loginDestination({ businessSlug: "antojos", isLocal: false, isPlayApp: true }), "/panel");
  assert.equal(loginDestination({ businessSlug: "antojos", isLocal: false, isPlayApp: false }), "https://antojos.tupedido360.co/admin");
  assert.equal(loginDestination({ platformRole: "superadmin", businessSlug: "", isLocal: false, isPlayApp: true }), "/admin");
});

test("session tokens reject tampering and expiration", () => {
  const session = { email: "a@example.com", name: "A", businessName: "B", businessSlug: "b", expiresAt: Date.now() + 60_000 };
  const token = createSessionToken(session);
  assert.deepEqual(readSessionToken(token), session);
  assert.equal(readSessionToken(`${token.slice(0, -1)}x`), null);
  assert.equal(readSessionToken(createSessionToken({ ...session, expiresAt: Date.now() - 1 })), null);
});
