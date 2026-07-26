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
    super(body.error?.message || "درخواست انجام نشد. دوباره کوشش کنید.");
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
  if (value === null) return "ناموجود";
  const label = currency === "AFN" ? "افغانی" : currency;
  return `${Number(value).toLocaleString("fa-AF")} ${label}`;
}

export function readableStatus(status: string) {
  const labels: Record<string, string> = {
    PENDING: "در انتظار بررسی",
    CONFIRMED: "تأیید شده",
    PREPARING: "در حال آماده‌سازی",
    READY: "آماده تحویل",
    OUT_FOR_DELIVERY: "در حال ارسال",
    DELIVERED: "تحویل شده",
    CANCELLED: "لغو شده"
  };
  return labels[status] || status.replaceAll("_", " ");
}
