export type OrderItemInput = { productId?: string; quantity?: number };

export type ParsedOrderItems =
  | { ok: true; quantities: Map<string, number> }
  | { ok: false; reason: "empty" | "too_many_items" | "invalid_item" | "quantity_limit" };

export function parseOrderItems(items: OrderItemInput[] | undefined, maxItems = 50, maxQuantity = 50): ParsedOrderItems {
  if (!items?.length) return { ok: false, reason: "empty" };
  if (items.length > maxItems) return { ok: false, reason: "too_many_items" };

  const quantities = new Map<string, number>();
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!item.productId || !Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) {
      return { ok: false, reason: "invalid_item" };
    }
    const total = (quantities.get(item.productId) ?? 0) + quantity;
    if (total > maxQuantity) return { ok: false, reason: "quantity_limit" };
    quantities.set(item.productId, total);
  }
  return { ok: true, quantities };
}
