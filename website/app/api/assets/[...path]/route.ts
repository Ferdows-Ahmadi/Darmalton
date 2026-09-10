import { NextResponse } from "next/server";

const apiBase =
  process.env.API_INTERNAL_URL || "http://localhost:8000/api/v1";
const backendOrigin = new URL(apiBase).origin;
const forwardedProto = process.env.API_INTERNAL_FORWARDED_PROTO || "http";

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, context: RouteContext) {
  const { path } = await context.params;
  const isStoredAsset =
    path.length >= 2 && ["media", "static"].includes(path[0]);
  const isMedicineContent =
    path.length === 6 &&
    path[0] === "api" &&
    path[1] === "v1" &&
    path[2] === "medicine-images" &&
    path[4] === "content" &&
    path[5] === "";
  const normalizedPath =
    path.at(-1) === "" ? path.slice(0, -1) : path;
  const isNormalizedMedicineContent =
    normalizedPath.length === 5 &&
    normalizedPath[0] === "api" &&
    normalizedPath[1] === "v1" &&
    normalizedPath[2] === "medicine-images" &&
    normalizedPath[4] === "content";
  const isCmsImage =
    normalizedPath.length === 6 &&
    normalizedPath[0] === "api" &&
    normalizedPath[1] === "v1" &&
    normalizedPath[2] === "cms" &&
    ["banners", "pages", "health-articles"].includes(normalizedPath[3]) &&
    normalizedPath[5] === "image";

  if (
    path.some((segment) => segment === "..") ||
    (!isStoredAsset &&
      !isMedicineContent &&
      !isNormalizedMedicineContent &&
      !isCmsImage)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const backendPath = normalizedPath.join("/");
  const backend = await fetch(`${backendOrigin}/${backendPath}`, {
    headers: { "X-Forwarded-Proto": forwardedProto },
    // The backend response carries the public browser cache policy. Avoid
    // persisting a temporary fallback response in Next's server data cache,
    // because an image uploaded or restored at the same guarded URL must be
    // visible without rebuilding the storefront.
    cache: "no-store"
  });
  if (!backend.ok || !backend.body) {
    return new NextResponse(null, { status: backend.status });
  }
  return new NextResponse(backend.body, {
    status: backend.status,
    headers: {
      "Content-Type":
        backend.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      ETag: backend.headers.get("etag") || ""
    }
  });
}
