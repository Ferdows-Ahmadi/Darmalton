import { StaffResourcePage } from "@/components/staff/StaffResourcePage";

export default function InventoryLedgerPage() {
  return (
    <StaffResourcePage
      title="دفتر حرکت موجودی"
      description="هر افزایش و کاهش موجودی با مرجع، اجراکننده و مقدار قبل و بعد قابل ردیابی است."
      endpoint="operations/inventory-transactions/"
      columns={[
        { key: "created_at", label: "زمان", kind: "date" },
        { key: "batch_number", label: "بچ" },
        { key: "transaction_type", label: "نوع", kind: "status" },
        { key: "direction", label: "جهت", kind: "status" },
        { key: "quantity", label: "مقدار" },
        { key: "resulting_quantity", label: "مانده" },
        { key: "performed_by_email", label: "اجراکننده" },
        { key: "reference", label: "مرجع" }
      ]}
    />
  );
}
