import { NextRequest, NextResponse } from "next/server";

import { staffLoginPath } from "@/lib/auth-navigation";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/staff/login") return NextResponse.next();
  if (request.cookies.has("pharmacy_refresh")) return NextResponse.next();

  return NextResponse.redirect(
    new URL(staffLoginPath(`${pathname}${search}`), request.url)
  );
}

export const config = {
  matcher: ["/staff/:path*"]
};
