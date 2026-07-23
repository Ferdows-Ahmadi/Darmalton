import { NextRequest } from "next/server";

import { authRequest } from "../_shared";

export function POST(request: NextRequest) {
  return authRequest(request, "login");
}
