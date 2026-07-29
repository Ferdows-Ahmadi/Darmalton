import { StaffResourcePage } from "@/components/staff/StaffResourcePage";

export default function StaffWarehousesPage() {
  return (
    <StaffResourcePage
      title="انبارها"
      description="انبارهای هر شعبه و وضعیت فعال‌بودن محل‌های نگهداری را مدیریت کنید."
      endpoint="operations/warehouses/"
      columns={[
        { key: "code", label: "کد" },
        { key: "name", label: "نام انبار" },
        { key: "address", label: "آدرس" },
        { key: "is_active", label: "فعال", kind: "boolean" },
        { key: "updated_at", label: "آخرین تغییر", kind: "date" }
      ]}
      actionLabel="محل‌های قفسه"
      actionHref="/staff/warehouses/locations"
    />
  );
}
