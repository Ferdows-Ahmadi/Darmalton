export type CatalogueResource = "medicines" | "categories";

export const catalogueResources = ["medicines", "categories"] as const;

export const catalogueConfigs = {
  medicines: {
    endpoint: "staff/medicines/",
    title: "مدیریت داروها",
    singular: "دارو"
  },
  categories: {
    endpoint: "staff/categories/",
    title: "مدیریت دسته‌بندی‌ها",
    singular: "دسته‌بندی"
  }
} as const;

export function apiAssetUrl(value?: string | null) {
  if (!value) return "/api/assets/static/medicine-fallback.svg";
  try {
    const url = new URL(value, "http://darmalton.local");
    const marker = "/api/v1/";
    const index = url.pathname.indexOf(marker);
    if (index >= 0) return `/api/backend/${url.pathname.slice(index + marker.length)}`;
    if (url.pathname.startsWith("/static/")) return `/api/assets${url.pathname}`;
    return url.pathname;
  } catch {
    return value;
  }
}

export function validateCatalogueImage(file: File | null) {
  if (!file) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "تصویر باید JPEG، PNG یا WebP باشد.";
  }
  if (file.size > 5 * 1024 * 1024) return "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.";
  return "";
}

export function catalogueStatusLabel(status?: string) {
  return ({
    DRAFT: "پیش‌نویس",
    ACTIVE: "فعال",
    INACTIVE: "غیرفعال",
    RECALLED: "جمع‌آوری‌شده"
  } as Record<string, string>)[status || ""] || status || "—";
}
