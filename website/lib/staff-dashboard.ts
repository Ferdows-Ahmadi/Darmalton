import type { StaffRole } from "@/lib/staff-navigation";

export type DashboardMetric = readonly [
  key: string,
  label: string,
  icon: string,
  href: string,
  endpoint: string,
  roles?: readonly StaffRole[]
];

const reviewRoles = ["PHARMACIST", "ADMIN"] as const;

export const dashboardMetrics: readonly DashboardMetric[] = [
  ["new_prescriptions", "نسخه‌های تازه", "Rx", "/staff/prescriptions?status=SUBMITTED", "staff/prescriptions/?status=SUBMITTED", reviewRoles],
  ["reviewing_prescriptions", "نسخه‌های زیر بررسی", "◴", "/staff/prescriptions?status=UNDER_REVIEW", "staff/prescriptions/?status=UNDER_REVIEW", reviewRoles],
  ["pending_orders", "سفارش‌های منتظر", "▤", "/staff/orders?status=PENDING", "staff/orders/?status=PENDING"],
  ["quarantined_stock", "موجودی قرنطین", "!", "/staff/inventory?status=QUARANTINED", "operations/inventory-batches/?quality_status=QUARANTINED"],
  ["pending_purchases", "خریدهای منتظر تأیید", "↙", "/staff/purchase-orders?status=SUBMITTED", "operations/purchase-orders/?status=SUBMITTED"],
  ["pending_returns", "مرجوعی‌های تازه", "↺", "/staff/returns?status=REQUESTED", "operations/returns/?status=REQUESTED"],
  ["draft_content", "بنرهای پیش‌نویس", "◈", "/staff/cms/banners?status=DRAFT", "cms/banners/?status=DRAFT"]
] as const;

export function dashboardMetricsForRole(role: string) {
  return dashboardMetrics.filter(([, , , , , roles]) => !roles || roles.includes(role as StaffRole));
}
