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
