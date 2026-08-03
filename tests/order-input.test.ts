import assert from "node:assert/strict";
import test from "node:test";
import { parseOrderItems } from "../lib/order-input.ts";

test("aggregates duplicate products without trusting client totals", () => {
  const result = parseOrderItems([{ productId: "p1", quantity: 2 }, { productId: "p1", quantity: 3 }]);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.quantities.get("p1"), 5);
});

test("rejects invalid, excessive and duplicated quantities over the limit", () => {
  assert.deepEqual(parseOrderItems([]), { ok: false, reason: "empty" });
  assert.deepEqual(parseOrderItems([{ productId: "p1", quantity: 1.5 }]), { ok: false, reason: "invalid_item" });
  assert.deepEqual(parseOrderItems([{ productId: "p1", quantity: 30 }, { productId: "p1", quantity: 21 }]), { ok: false, reason: "quantity_limit" });
  assert.deepEqual(parseOrderItems(Array.from({ length: 51 }, (_, index) => ({ productId: `p${index}`, quantity: 1 }))), { ok: false, reason: "too_many_items" });
});
