export const purchaseStatuses = ["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"] as const;

export function purchaseActions(status: string) {
  if (status === "DRAFT") return ["submit", "cancel"] as const;
  if (status === "SUBMITTED") return ["approve", "cancel"] as const;
  if (status === "APPROVED" || status === "PARTIALLY_RECEIVED") return ["receive"] as const;
  return [] as const;
}

export function purchaseStatusLabel(value: string) {
  return ({ DRAFT: "پیش‌نویس", SUBMITTED: "ارسال‌شده", APPROVED: "تأییدشده", PARTIALLY_RECEIVED: "دریافت جزئی", RECEIVED: "دریافت کامل", CANCELLED: "لغوشده", UNPAID: "پرداخت‌نشده", PARTIALLY_PAID: "پرداخت جزئی", PAID: "پرداخت‌شده", OVERDUE: "سررسید گذشته" } as Record<string, string>)[value] || value.replaceAll("_", " ");
}

export function receiptOutstanding(ordered: number, received: number) {
  return Math.max(0, ordered - received);
}
