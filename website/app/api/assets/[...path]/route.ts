import { NextResponse } from "next/server";

const apiBase =
  process.env.API_INTERNAL_URL || "http://localhost:8000/api/v1";
const backendOrigin = new URL(apiBase).origin;

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, context: RouteContext) {
  const { path } = await context.params;
  if (
    path.length < 2 ||
    !["media", "static"].includes(path[0]) ||
    path.some((segment) => segment === "..")
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const backend = await fetch(`${backendOrigin}/${path.join("/")}`, {
    cache: "force-cache"
  });
  if (!backend.ok || !backend.body) {
    return new NextResponse(null, { status: backend.status });
  }
  return new NextResponse(backend.body, {
    status: backend.status,
    headers: {
      "Content-Type":
        backend.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
