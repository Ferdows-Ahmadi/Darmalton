import { StaffResourcePage } from "@/components/staff/StaffResourcePage";

export default function StaffSuppliersPage() {
  return (
    <StaffResourcePage
      title="تأمین‌کنندگان"
      description="مجوز، اعتبار، شرایط پرداخت و راه‌های تماس تأمین‌کنندگان را مرور کنید."
      endpoint="operations/suppliers/"
      columns={[
        { key: "code", label: "کد" },
        { key: "company_name", label: "شرکت" },
        { key: "contact_name", label: "مسئول تماس" },
        { key: "primary_phone", label: "تلفن", kind: "phone" },
        { key: "payment_terms_days", label: "مهلت پرداخت" },
        { key: "rating", label: "امتیاز" },
        { key: "is_verified", label: "تأییدشده", kind: "boolean" },
        { key: "is_active", label: "فعال", kind: "boolean" }
      ]}
      actionLabel="ثبت تأمین‌کننده"
      actionHref="http://localhost:8000/admin/operations/supplier/add/"
    />
  );
}
