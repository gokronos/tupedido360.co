const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isUnsafeApiMutation(method: string, pathname: string) {
  return MUTATION_METHODS.has(method.toUpperCase())
    && pathname.startsWith("/api/")
    && pathname !== "/api/webhooks/mercadopago"
    && pathname !== "/api/csp-report";
}

export function isAllowedRequestOrigin(origin: string | null, requestHost: string) {
  if (!origin) return true;
  try {
    return new URL(origin).host === requestHost;
  } catch {
    return false;
  }
}
