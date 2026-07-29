import { StaffResourcePage } from "@/components/staff/StaffResourcePage";

export default function StaffReturnsPage() {
  return (
    <StaffResourcePage
      title="مرجوعی و بازپرداخت"
      description="درخواست مشتری، تأیید، دریافت، بررسی کالا و بازپرداخت داخلی را دنبال کنید."
      endpoint="operations/returns/"
      statusOptions={[
        "REQUESTED",
        "APPROVED",
        "REJECTED",
        "PICKUP_SCHEDULED",
        "RECEIVED",
        "VERIFIED",
        "REFUNDED",
        "CANCELLED"
      ]}
      columns={[
        { key: "return_number", label: "شماره مرجوعی" },
        { key: "customer_email", label: "مشتری" },
        { key: "status", label: "وضعیت", kind: "status" },
        { key: "pickup_status", label: "دریافت", kind: "status" },
        { key: "refund_status", label: "بازپرداخت", kind: "status" },
        { key: "approved_refund_amount", label: "مبلغ تأیید", kind: "money" },
        { key: "created_at", label: "درخواست", kind: "date" }
      ]}
    />
  );
}
