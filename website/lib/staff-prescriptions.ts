export const prescriptionStatuses = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "CLARIFICATION_REQUESTED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED"
] as const;

export type PrescriptionStatus = (typeof prescriptionStatuses)[number];
export type PrescriptionAction =
  | "start-review"
  | "request-clarification"
  | "approve"
  | "reject"
  | "expire";

export const prescriptionStatusLabels: Record<PrescriptionStatus, string> = {
  SUBMITTED: "ارسال‌شده",
  UNDER_REVIEW: "در حال بررسی",
  CLARIFICATION_REQUESTED: "منتظر توضیح مشتری",
  APPROVED: "تأییدشده",
  REJECTED: "ردشده",
  EXPIRED: "منقضی",
  CANCELLED: "لغوشده"
};

export const prescriptionActionLabels: Record<PrescriptionAction, string> = {
  "start-review": "آغاز بررسی",
  "request-clarification": "درخواست توضیح",
  approve: "تأیید نسخه",
  reject: "رد نسخه",
  expire: "ثبت انقضا"
};

export function allowedPrescriptionActions(
  status: string,
  canReview: boolean
): PrescriptionAction[] {
  if (!canReview) return [];
  if (status === "SUBMITTED") return ["start-review"];
  if (status === "UNDER_REVIEW") {
    return ["request-clarification", "approve", "reject"];
  }
  if (status === "APPROVED") return ["expire"];
  return [];
}

export function isPrescriptionReviewerRole(role: string) {
  return role === "PHARMACIST" || role === "ADMIN";
}

export function nextPageNumber(url: string | null) {
  if (!url) return null;
  const page = new URL(url, "http://staff.local").searchParams.get("page");
  return page ? Number(page) : 1;
}
