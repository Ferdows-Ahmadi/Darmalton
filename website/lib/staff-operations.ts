export type OperationsResource = "suppliers" | "warehouses" | "locations";

export type OperationsField = {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "textarea" | "checkbox" | "select";
  required?: boolean;
  optionSource?: "branches" | "warehouses";
};

export const operationsConfigs = {
  suppliers: {
    endpoint: "operations/suppliers/",
    title: "تأمین‌کنندگان",
    singular: "تأمین‌کننده",
    description: "مجوز، اعتبار، شرایط پرداخت و راه‌های تماس تأمین‌کنندگان را مدیریت کنید.",
    search: "کد، شرکت، مسئول تماس یا شماره تلفن…",
    columns: [
      ["code", "کد"], ["company_name", "شرکت"], ["contact_name", "مسئول تماس"],
      ["primary_phone", "تلفن"], ["payment_terms_days", "مهلت پرداخت"],
      ["rating", "امتیاز"], ["is_verified", "تأیید"], ["is_active", "فعال"]
    ],
    fields: [
      { key: "code", label: "کد تأمین‌کننده", required: true },
      { key: "company_name", label: "نام شرکت", required: true },
      { key: "contact_name", label: "مسئول تماس", required: true },
      { key: "email", label: "ایمیل", type: "email" },
      { key: "primary_phone", label: "تلفن اصلی", type: "tel", required: true },
      { key: "secondary_phone", label: "تلفن دوم", type: "tel" },
      { key: "address", label: "آدرس", type: "textarea", required: true },
      { key: "pharmacy_license_number", label: "شماره جواز دارویی" },
      { key: "pharmacy_license_expires_on", label: "تاریخ ختم جواز", type: "date" },
      { key: "payment_terms_days", label: "مهلت پرداخت (روز)", type: "number", required: true },
      { key: "payment_terms_notes", label: "یادداشت شرایط پرداخت", type: "textarea" },
      { key: "rating", label: "امتیاز از ۵", type: "number", required: true },
      { key: "is_verified", label: "تأمین‌کننده تأیید شده", type: "checkbox" },
      { key: "is_active", label: "فعال", type: "checkbox" }
    ] satisfies OperationsField[]
  },
  warehouses: {
    endpoint: "operations/warehouses/",
    title: "انبارها",
    singular: "انبار",
    description: "انبار هر شعبه و ظرفیت فعلی محل‌های نگهداری آن را مدیریت کنید.",
    search: "کد، نام، شعبه یا آدرس…",
    columns: [["code", "کد"], ["name", "نام"], ["branch_name", "شعبه"], ["location_count", "محل‌ها"], ["stock_quantity", "موجودی"], ["is_active", "فعال"]],
    fields: [
      { key: "branch", label: "شعبه", type: "select", required: true, optionSource: "branches" },
      { key: "code", label: "کد انبار", required: true },
      { key: "name", label: "نام انبار", required: true },
      { key: "address", label: "آدرس", type: "textarea" },
      { key: "is_active", label: "فعال", type: "checkbox" }
    ] satisfies OperationsField[]
  },
  locations: {
    endpoint: "operations/storage-locations/",
    title: "محل‌های نگهداری",
    singular: "محل نگهداری",
    description: "راک، قفسه، محدوده دمایی و موجودی هر محل فیزیکی را مدیریت کنید.",
    search: "کد محل، راک، قفسه یا انبار…",
    columns: [["warehouse_code", "انبار"], ["code", "کد محل"], ["rack", "راک"], ["shelf", "قفسه"], ["temperature_zone", "دما"], ["batch_count", "بچ‌ها"], ["stock_quantity", "موجودی"], ["is_active", "فعال"]],
    fields: [
      { key: "warehouse", label: "انبار", type: "select", required: true, optionSource: "warehouses" },
      { key: "code", label: "کد محل", required: true },
      { key: "name", label: "نام توضیحی" },
      { key: "rack", label: "راک", required: true },
      { key: "shelf", label: "قفسه", required: true },
      { key: "temperature_zone", label: "محدوده دمایی" },
      { key: "is_active", label: "فعال", type: "checkbox" }
    ] satisfies OperationsField[]
  }
} as const;

export function operationsStatusLabel(value: unknown) {
  if (typeof value === "boolean") return value ? "بلی" : "نخیر";
  return value === null || value === undefined || value === "" ? "—" : String(value);
}
