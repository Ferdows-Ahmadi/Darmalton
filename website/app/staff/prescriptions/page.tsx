import { StaffResourcePage } from "@/components/staff/StaffResourcePage";

export default function StaffPrescriptionsPage() {
  return (
    <StaffResourcePage
      title="بررسی نسخه‌ها"
      description="نسخه‌های تازه، در حال بررسی و نیازمند توضیح را بدون نمایش عمومی فایل مدیریت کنید."
      endpoint="staff/prescriptions/"
      statusOptions={[
        "SUBMITTED",
        "UNDER_REVIEW",
        "CLARIFICATION_REQUESTED",
        "APPROVED",
        "REJECTED",
        "EXPIRED",
        "CANCELLED"
      ]}
      columns={[
        { key: "patient_name", label: "نام مریض" },
        { key: "customer_email", label: "مشتری" },
        { key: "contact_phone", label: "تماس", kind: "phone" },
        { key: "status", label: "وضعیت", kind: "status" },
        { key: "reviewer_email", label: "بررسی‌کننده" },
        { key: "created_at", label: "ارسال", kind: "date" }
      ]}
      actionLabel="بازکردن صف تخصصی"
      actionHref="http://localhost:8000/admin/prescriptions/prescription/"
    />
  );
}
