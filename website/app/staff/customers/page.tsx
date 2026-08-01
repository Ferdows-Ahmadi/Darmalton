import { StaffResourcePage } from "@/components/staff/StaffResourcePage";

export default function StaffCustomersPage() {
  return (
    <StaffResourcePage
      title="مشتریان"
      description="حساب مشتری، راه تماس و خلاصه سفارش‌ها را برای پشتیبانی مشاهده کنید."
      endpoint="auth/staff/customers/"
      columns={[
        { key: "email", label: "ایمیل" },
        { key: "phone", label: "تلفن", kind: "phone" },
        { key: "first_name", label: "نام" },
        { key: "last_name", label: "تخلص" },
        { key: "order_count", label: "سفارش‌ها" },
        { key: "total_spent", label: "جمع خرید", kind: "money" },
        { key: "is_active", label: "فعال", kind: "boolean" },
        { key: "created_at", label: "عضویت", kind: "date" }
      ]}
    />
  );
}
