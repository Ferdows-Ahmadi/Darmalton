export type StaffRole = "STAFF" | "PHARMACIST" | "ADMIN";
export type StaffNavigationItem = readonly [
  href: string,
  label: string,
  icon: string,
  roles?: readonly StaffRole[]
];

const reviewRoles = ["PHARMACIST", "ADMIN"] as const;
const adminRoles = ["ADMIN"] as const;

export const staffNavigationGroups: readonly {
  label: string;
  items: readonly StaffNavigationItem[];
}[] = [
  { label: "داشبورد", items: [["/staff", "نیازمند توجه", "⌂"]] },
  {
    label: "عملیات",
    items: [
      ["/staff/prescriptions", "نسخه‌ها", "Rx", reviewRoles],
      ["/staff/orders", "سفارش‌ها", "▤"],
      ["/staff/customers", "مشتریان", "◎"]
    ]
  },
  {
    label: "کاتالوگ",
    items: [
      ["/staff/medicines", "داروها", "✚"],
      ["/staff/medicines/import", "ورود گروهی", "⇧", adminRoles],
      ["/staff/categories", "دسته‌بندی‌ها", "▦"],
      ["/staff/inventory", "موجودی", "◫"],
      ["/staff/warehouses", "انبارها", "⌑"]
    ]
  },
  {
    label: "تدارکات",
    items: [
      ["/staff/suppliers", "تأمین‌کنندگان", "◇"],
      ["/staff/purchase-orders", "خریدها", "↙"],
      ["/staff/returns", "مرجوعی‌ها", "↺"]
    ]
  },
  {
    label: "محتوا",
    items: [
      ["/staff/cms", "مرکز محتوا", "◈"],
      ["/staff/cms/banners", "بنرها", "▣"],
      ["/staff/cms/announcements", "اطلاعیه‌ها", "◉"],
      ["/staff/cms/pages", "صفحه‌ها", "▤"],
      ["/staff/cms/health-articles", "مقاله‌های سلامت", "✚"],
      ["/staff/cms/featured-medicines", "داروهای ویژه", "✦"]
    ]
  },
  {
    label: "مدیریت",
    items: [
      ["/staff/users", "کاربران و کارکنان", "♙", adminRoles],
      ["/staff/reports", "گزارش‌ها", "▥"],
      ["/staff/settings", "تنظیمات", "⚙"]
    ]
  }
] as const;

export const staffNavigation = staffNavigationGroups.flatMap((group) => group.items);

export function staffNavigationForRole(role: string) {
  return staffNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(([, , , roles]) => !roles || roles.includes(role as StaffRole))
    }))
    .filter((group) => group.items.length > 0);
}
