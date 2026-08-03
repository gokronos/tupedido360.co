const sharedRootAssets = new Set(["/icon.svg", "/manifest.json", "/sw.js"]);

export function shouldRewriteTenantPath(pathname: string) {
  return !pathname.startsWith("/api/") && !sharedRootAssets.has(pathname);
}
