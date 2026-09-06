import type { Locale } from "./locale";

const orderLabels: Record<string, [string, string, string]> = {
  PENDING: ["Pending", "در انتظار", "په تمه"],
  CONFIRMED: ["Confirmed", "تأیید شده", "تایید شوی"],
  PREPARING: ["Preparing", "در حال آماده‌سازی", "چمتو کېږي"],
  READY_FOR_DELIVERY: ["Ready for delivery", "آماده تحویل", "سپارلو ته چمتو"],
  OUT_FOR_DELIVERY: ["Out for delivery", "در حال ارسال", "د سپارلو په حال کې"],
  DELIVERED: ["Delivered", "تحویل شده", "سپارل شوی"],
  CANCELLED: ["Cancelled", "لغو شده", "لغوه شوی"],
  REJECTED: ["Rejected", "رد شده", "رد شوی"]
};

const prescriptionLabels: Record<string, [string, string, string]> = {
  SUBMITTED: ["Submitted", "ارسال‌شده", "لېږل شوې"],
  UNDER_REVIEW: ["Under review", "در حال بررسی", "د ارزونې لاندې"],
  CLARIFICATION_REQUESTED: ["Clarification requested", "نیازمند توضیح", "وضاحت غوښتل شوی"],
  APPROVED: ["Approved", "تأییدشده", "تایید شوې"],
  REJECTED: ["Rejected", "ردشده", "رد شوې"],
  EXPIRED: ["Expired", "منقضی‌شده", "پای ته رسېدلې"],
  CANCELLED: ["Cancelled", "لغوشده", "لغوه شوې"]
};

function select(locale: Locale, values?: [string, string, string]) {
  if (!values) return "";
  return values[locale === "en" ? 0 : locale === "fa-AF" ? 1 : 2];
}

export function orderStatus(status: string, locale: Locale) {
  return select(locale, orderLabels[status]) || status.replaceAll("_", " ");
}

export function prescriptionStatus(status: string, locale: Locale) {
  return select(locale, prescriptionLabels[status]) || status.replaceAll("_", " ");
}
