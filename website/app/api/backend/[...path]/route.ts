import { NextRequest, NextResponse } from "next/server";
import { normalizeBackendPayload } from "@/lib/normalize-backend-payload";

const apiBase = process.env.API_INTERNAL_URL || "http://localhost:8000/api/v1";

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const target = new URL(`${apiBase}/${path.join("/")}/`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value));
  const method = request.method;
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
  let access = request.cookies.get("pharmacy_access")?.value;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body?.byteLength) {
    headers["Content-Type"] =
      request.headers.get("content-type") || "application/json";
  }
  if (access) headers.Authorization = `Bearer ${access}`;

  let backend = await fetch(target, { method, headers, body, cache: "no-store" });
  let rotatedRefresh: string | undefined;

  if (backend.status === 401 && request.cookies.get("pharmacy_refresh")?.value) {
    const refresh = request.cookies.get("pharmacy_refresh")!.value;
    const refreshed = await fetch(`${apiBase}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
      cache: "no-store"
    });
    if (refreshed.ok) {
      const tokens = await refreshed.json();
      access = tokens.access;
      rotatedRefresh = tokens.refresh;
      headers.Authorization = `Bearer ${access}`;
      backend = await fetch(target, { method, headers, body, cache: "no-store" });
    }
  }

  const contentType = backend.headers.get("content-type") || "application/json";
  const rawPayload = await backend.arrayBuffer();
  let payload: BodyInit | null = rawPayload.byteLength ? rawPayload : null;
  if (rawPayload.byteLength && contentType.includes("application/json")) {
    const parsed = JSON.parse(new TextDecoder().decode(rawPayload));
    payload = JSON.stringify(normalizeBackendPayload(parsed));
  }
  const responseHeaders: Record<string, string> = {
    "Content-Type": contentType
  };
  const disposition = backend.headers.get("content-disposition");
  if (disposition) responseHeaders["Content-Disposition"] = disposition;
  const response = new NextResponse(payload, {
    status: backend.status,
    headers: responseHeaders
  });
  if (access && access !== request.cookies.get("pharmacy_access")?.value) {
    response.cookies.set("pharmacy_access", access, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 15 * 60
    });
  }
  if (rotatedRefresh) {
    response.cookies.set("pharmacy_refresh", rotatedRefresh, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });
  }
  return response;
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
