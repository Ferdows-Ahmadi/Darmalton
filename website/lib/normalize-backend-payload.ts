const guardedAssetPath =
  /^\/api\/v1\/(?:medicine-images\/[^/]+\/content|cms\/(?:banners|pages|health-articles)\/[^/]+\/image)\/?$/;

export function proxiedAssetUrl(value: string) {
  try {
    const url = new URL(value);
    if (guardedAssetPath.test(url.pathname)) {
      return `/api/assets${url.pathname.replace(/\/$/, "")}`;
    }
    if (
      url.pathname.startsWith("/media/") ||
      url.pathname.startsWith("/static/")
    ) {
      return `/api/assets${url.pathname}`;
    }
  } catch {
    if (guardedAssetPath.test(value)) {
      return `/api/assets${value.replace(/\/$/, "")}`;
    }
    if (value.startsWith("/media/") || value.startsWith("/static/")) {
      return `/api/assets${value}`;
    }
  }
  return value;
}

export function normalizeBackendPayload<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(normalizeBackendPayload) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        key === "image_url" && typeof item === "string"
          ? proxiedAssetUrl(item)
          : normalizeBackendPayload(item)
      ])
    ) as T;
  }
  return value;
}
