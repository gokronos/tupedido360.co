import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../next.config.ts";

test("ships the expected browser security policy", async () => {
  assert.equal(typeof nextConfig.headers, "function");
  const rules = await nextConfig.headers!();
  const headers = new Map(rules[0].headers.map((header) => [header.key, header.value]));
  const csp = headers.get("Content-Security-Policy") ?? "";
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /script-src-attr 'none'/);
  assert.match(csp, /report-uri \/api\/csp-report/);
  assert.equal(headers.get("X-Content-Type-Options"), "nosniff");
});
