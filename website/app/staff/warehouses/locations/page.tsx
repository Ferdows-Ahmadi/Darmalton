import { StaffResourcePage } from "@/components/staff/StaffResourcePage";

export default function StorageLocationsPage() {
  return (
    <StaffResourcePage
      title="محل‌های نگهداری"
      description="کد محل، راک، قفسه و محدوده دمایی هر انبار را مشاهده کنید."
      endpoint="operations/storage-locations/"
      columns={[
        { key: "warehouse_code", label: "انبار" },
        { key: "code", label: "کد محل" },
        { key: "name", label: "نام" },
        { key: "rack", label: "راک" },
        { key: "shelf", label: "قفسه" },
        { key: "temperature_zone", label: "دمـا" },
        { key: "is_active", label: "فعال", kind: "boolean" }
      ]}
    />
  );
}
