import { NextRequest, NextResponse } from "next/server";

function safeAdminPath(value: string | null) {
  return value?.startsWith("/admin/") && !value.startsWith("//")
    ? value
    : "/admin/";
}

export function GET(request: NextRequest) {
  const configuredOrigin = process.env.DJANGO_ADMIN_ORIGIN?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const requestHost = forwardedHost || request.headers.get("host")?.trim();
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const browserOrigin = requestHost
    ? `${forwardedProtocol || request.nextUrl.protocol.replace(":", "") || "http"}://${requestHost}`
    : request.url;
  const target = configuredOrigin
    ? new URL(safeAdminPath(request.nextUrl.searchParams.get("path")), configuredOrigin)
    : new URL(browserOrigin);

  if (!configuredOrigin) {
    target.port = process.env.DJANGO_ADMIN_PORT?.trim() || "8000";
    target.pathname = safeAdminPath(request.nextUrl.searchParams.get("path"));
  }
  target.search = "";
  return NextResponse.redirect(target);
}
