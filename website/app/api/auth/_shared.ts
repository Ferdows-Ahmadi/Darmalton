import { NextRequest, NextResponse } from "next/server";

const apiBase = process.env.API_INTERNAL_URL || "http://localhost:8000/api/v1";
const forwardedProto = process.env.API_INTERNAL_FORWARDED_PROTO || "http";

export async function authRequest(request: NextRequest, endpoint: string) {
  const body = await request.text();
  const backend = await fetch(`${apiBase}/auth/${endpoint}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-Proto": forwardedProto
    },
    body,
    cache: "no-store"
  });
  const payload = await backend.json().catch(() => ({}));
  const response = NextResponse.json(
    backend.ok ? { user: payload.user } : payload,
    { status: backend.status }
  );
  if (backend.ok) {
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set("pharmacy_access", payload.access, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 15 * 60
    });
    response.cookies.set("pharmacy_refresh", payload.refresh, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });
  }
  return response;
}
