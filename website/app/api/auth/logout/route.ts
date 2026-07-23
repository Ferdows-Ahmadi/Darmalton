import { NextResponse } from "next/server";

export function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("pharmacy_access");
  response.cookies.delete("pharmacy_refresh");
  return response;
}
