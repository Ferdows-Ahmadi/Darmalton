import { StaffResourcePage } from "@/components/staff/StaffResourcePage";

export default function StaffInventoryPage() {
  return (
    <StaffResourcePage
      title="موجودی و کیفیت"
      description="بچ‌ها، تاریخ انقضا، محل نگهداری، قرنطین و تأیید شمارش را بررسی کنید."
      endpoint="operations/inventory-batches/"
      statusOptions={["PENDING", "APPROVED", "QUARANTINED", "REJECTED"]}
      statusParam="quality_status"
      columns={[
        { key: "medicine_name", label: "محصول" },
        { key: "batch_number", label: "شماره بچ" },
        { key: "branch_name", label: "شعبه" },
        { key: "storage_location_code", label: "محل" },
        { key: "available_quantity", label: "موجودی" },
        { key: "quality_status", label: "کیفیت", kind: "status" },
        { key: "expiry_date", label: "انقضا", kind: "date" }
      ]}
      actionLabel="دفتر حرکت موجودی"
      actionHref="/staff/inventory/ledger"
    />
  );
}
