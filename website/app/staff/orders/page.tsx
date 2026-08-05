import { StaffResourcePage } from "@/components/staff/StaffResourcePage";

export default function StaffOrdersPage() {
  return (
    <StaffResourcePage
      title="مدیریت سفارش‌ها"
      description="سفارش‌های مشتری، پرداخت هنگام تحویل و مرحله آماده‌سازی را پیگیری کنید."
      endpoint="staff/orders/"
      statusOptions={[
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY_FOR_DELIVERY",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "REJECTED"
      ]}
      columns={[
        { key: "order_number", label: "شماره سفارش" },
        { key: "customer_email", label: "مشتری" },
        { key: "branch_name", label: "شعبه" },
        { key: "status", label: "وضعیت", kind: "status" },
        { key: "grand_total", label: "مبلغ", kind: "money" },
        { key: "placed_at", label: "ثبت", kind: "date" }
      ]}
      actionLabel="مدیریت کامل در ادمین"
      actionHref="/admin?path=/admin/commerce/order/"
    />
  );
}
