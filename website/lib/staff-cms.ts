export const cmsResources = [
  "banners",
  "announcements",
  "pages",
  "featured-medicines"
] as const;

export type CmsResource = (typeof cmsResources)[number];
export type CmsPublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type CmsRecord = {
  id: string;
  status: CmsPublicationStatus;
  is_active: boolean;
  display_order: number;
  publish_from: string | null;
  publish_until: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by_email?: string | null;
  updated_by_email?: string | null;
  published_by_email?: string | null;
  code?: string;
  slug?: string;
  placement?: string;
  level?: string;
  title?: string;
  title_dari?: string;
  body?: string;
  body_dari?: string;
  summary?: string;
  summary_dari?: string;
  image_url?: string | null;
  alt_text?: string;
  alt_text_dari?: string;
  action_label?: string;
  action_label_dari?: string;
  action_url?: string;
  medicine_id?: string;
  medicine_name?: string;
  medicine_name_dari?: string;
  label?: string;
  label_dari?: string;
};

export type CmsResourceConfig = {
  resource: CmsResource;
  title: string;
  singular: string;
  description: string;
  icon: string;
  endpoint: string;
  hasImage: boolean;
  imageRequired: boolean;
  placements: readonly (readonly [string, string])[];
};

export const cmsResourceConfigs: Record<CmsResource, CmsResourceConfig> = {
  banners: {
    resource: "banners",
    title: "بنرهای تبلیغاتی",
    singular: "بنر",
    description: "بنرهای صفحه خانه و کاتالوگ را زمان‌بندی و منتشر کنید.",
    icon: "▣",
    endpoint: "cms/banners/",
    hasImage: true,
    imageRequired: true,
    placements: [
      ["HOME_HERO", "بنر اصلی خانه"],
      ["HOME_SECONDARY", "بنر دوم خانه"],
      ["CATALOGUE", "کاتالوگ"]
    ]
  },
  announcements: {
    resource: "announcements",
    title: "اطلاعیه‌ها",
    singular: "اطلاعیه",
    description: "پیام‌های عمومی، خانه و پرداخت را مدیریت کنید.",
    icon: "◉",
    endpoint: "cms/announcements/",
    hasImage: false,
    imageRequired: false,
    placements: [
      ["GLOBAL", "عمومی"],
      ["HOME", "خانه"],
      ["CHECKOUT", "پرداخت"]
    ]
  },
  pages: {
    resource: "pages",
    title: "صفحه‌های معلوماتی",
    singular: "صفحه",
    description: "محتوای درباره ما، راهنما، محرمیت و صفحه‌های مشابه را نگهداری کنید.",
    icon: "▤",
    endpoint: "cms/pages/",
    hasImage: true,
    imageRequired: false,
    placements: []
  },
  "featured-medicines": {
    resource: "featured-medicines",
    title: "داروهای ویژه",
    singular: "داروی ویژه",
    description: "محصولات ویژه و پیشنهادی را برای جایگاه‌های مشخص انتخاب کنید.",
    icon: "✦",
    endpoint: "cms/featured-medicines/",
    hasImage: false,
    imageRequired: false,
    placements: [
      ["HOME_FEATURED", "ویژه خانه"],
      ["HOME_RECOMMENDED", "پیشنهادی خانه"],
      ["CATALOGUE_FEATURED", "ویژه کاتالوگ"]
    ]
  }
};

export function isCmsResource(value: string): value is CmsResource {
  return cmsResources.includes(value as CmsResource);
}

export function cmsRecordTitle(record: CmsRecord) {
  return (
    record.title_dari ||
    record.title ||
    record.medicine_name_dari ||
    record.medicine_name ||
    record.code ||
    record.slug ||
    "بدون عنوان"
  );
}

export type CmsVisibility =
  | "DRAFT"
  | "ARCHIVED"
  | "INACTIVE"
  | "SCHEDULED"
  | "EXPIRED"
  | "PUBLISHED";

export function cmsVisibility(record: CmsRecord, now = new Date()): CmsVisibility {
  if (record.status === "DRAFT") return "DRAFT";
  if (record.status === "ARCHIVED") return "ARCHIVED";
  if (!record.is_active) return "INACTIVE";
  if (record.publish_from && new Date(record.publish_from) > now) return "SCHEDULED";
  if (record.publish_until && new Date(record.publish_until) <= now) return "EXPIRED";
  return "PUBLISHED";
}

export const cmsVisibilityLabels: Record<CmsVisibility, string> = {
  DRAFT: "پیش‌نویس",
  ARCHIVED: "آرشیف‌شده",
  INACTIVE: "غیرفعال",
  SCHEDULED: "زمان‌بندی‌شده",
  EXPIRED: "منقضی",
  PUBLISHED: "منتشرشده"
};

export function validateCmsSchedule(fromValue: string, untilValue: string) {
  if (!fromValue || !untilValue) return "";
  const from = new Date(fromValue);
  const until = new Date(untilValue);
  if (Number.isNaN(from.valueOf()) || Number.isNaN(until.valueOf())) {
    return "زمان نشر معتبر نیست.";
  }
  return until <= from ? "زمان پایان باید بعد از زمان آغاز باشد." : "";
}

export function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function toApiDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}
