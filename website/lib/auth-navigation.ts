export function safeReturnPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/shop";
  try {
    const url = new URL(value, "https://darmalton.invalid");
    if (
      url.origin !== "https://darmalton.invalid" ||
      ["/login", "/register"].includes(url.pathname)
    ) {
      return "/shop";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/shop";
  }
}

export function loginPath(returnTo: string) {
  return `/login?${new URLSearchParams({
    returnTo: safeReturnPath(returnTo)
  }).toString()}`;
}

export const staffRoles = ["STAFF", "ADMIN", "PHARMACIST"] as const;

export function isStaffRole(role?: string | null) {
  return staffRoles.includes(role as (typeof staffRoles)[number]);
}

export function safeStaffReturnPath(value?: string | null) {
  const path = safeReturnPath(value);
  if (path === "/staff" || path.startsWith("/staff/")) {
    return path === "/staff/login" ? "/staff" : path;
  }
  return "/staff";
}

export function staffLoginPath(returnTo: string, reason?: "forbidden") {
  const query = new URLSearchParams({
    returnTo: safeStaffReturnPath(returnTo)
  });
  if (reason) query.set("reason", reason);
  return `/staff/login?${query.toString()}`;
}

export function postLoginPath(
  role: string | undefined,
  audience: "customer" | "staff",
  returnTo?: string | null
) {
  if (audience === "staff") {
    return isStaffRole(role) ? safeStaffReturnPath(returnTo) : null;
  }
  return isStaffRole(role) ? "/staff" : safeReturnPath(returnTo);
}
