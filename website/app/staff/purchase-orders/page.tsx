import { StaffResourcePage } from "@/components/staff/StaffResourcePage";

export default function StaffPurchaseOrdersPage() {
  return (
    <StaffResourcePage
      title="سفارش‌های خرید"
      description="خرید از تأمین‌کننده، تأیید، دریافت، فاکتور و وضعیت پرداخت را پیگیری کنید."
      endpoint="operations/purchase-orders/"
      statusOptions={["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]}
      columns={[
        { key: "purchase_order_number", label: "شماره خرید" },
        { key: "status", label: "وضعیت", kind: "status" },
        { key: "payment_status", label: "پرداخت", kind: "status" },
        { key: "invoice_number", label: "فاکتور" },
        { key: "net_total", label: "مجموع", kind: "money" },
        { key: "expected_delivery_on", label: "تحویل مورد انتظار", kind: "date" },
        { key: "created_at", label: "ایجاد", kind: "date" }
      ]}
      actionLabel="ایجاد سفارش خرید"
      actionHref="http://localhost:8000/admin/operations/purchaseorder/add/"
    />
  );
}
