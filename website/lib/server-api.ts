import { normalizeBackendPayload } from "./normalize-backend-payload";

const apiBase = process.env.API_INTERNAL_URL || "http://localhost:8000/api/v1";
const forwardedProto = process.env.API_INTERNAL_FORWARDED_PROTO || "http";

export async function publicApi<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}/${path.replace(/^\/+/, "")}`, {
    headers: { "X-Forwarded-Proto": forwardedProto },
    next: { revalidate: 30 }
  });
  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }
  return normalizeBackendPayload((await response.json()) as T);
}
