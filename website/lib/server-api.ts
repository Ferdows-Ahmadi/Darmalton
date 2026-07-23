const apiBase = process.env.API_INTERNAL_URL || "http://localhost:8000/api/v1";

export async function publicApi<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}/${path.replace(/^\/+/, "")}`, {
    next: { revalidate: 30 }
  });
  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }
  return response.json() as Promise<T>;
}
