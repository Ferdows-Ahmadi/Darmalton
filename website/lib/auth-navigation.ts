export function safeReturnPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://darmalton.invalid");
    if (
      url.origin !== "https://darmalton.invalid" ||
      ["/login", "/register"].includes(url.pathname)
    ) {
      return "/";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function loginPath(returnTo: string) {
  return `/login?${new URLSearchParams({
    returnTo: safeReturnPath(returnTo)
  }).toString()}`;
}
