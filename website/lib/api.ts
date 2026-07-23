type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[] | string>;
  };
};

export class ApiError extends Error {
  status: number;
  fields: Record<string, string[] | string>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error?.message || "The request could not be completed.");
    this.status = status;
    this.fields = body.error?.fields || {};
  }
}
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`/api/backend/${path.replace(/^\/+/, "")}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    cache: "no-store"
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(response.status, body);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function money(value: string | null, currency = "AFN") {
  if (value === null) return "Unavailable";
  return `${Number(value).toLocaleString()} ${currency}`;
}

export function readableStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
