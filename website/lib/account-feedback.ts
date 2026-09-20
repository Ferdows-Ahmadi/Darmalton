import type { Locale } from "./locale";

const messages: Record<string, string> = {
  "Please correct the highlighted fields.": "معلومات واردشده را بررسی و اصلاح کنید.",
  "The request could not be completed.": "درخواست انجام نشد. دوباره کوشش کنید.",
  "Failed to fetch": "اتصال خود را بررسی و دوباره کوشش کنید.",
  "NetworkError when attempting to fetch resource.": "اتصال خود را بررسی و دوباره کوشش کنید.",
  "This prescription does not belong to you.": "به این نسخه دسترسی ندارید.",
  "An approved prescription is required.": "یک نسخه تأییدشده لازم است.",
  "The selected prescription has expired.": "اعتبار نسخه انتخاب‌شده پایان یافته است.",
  "This prescription has already been used for an order.": "این نسخه قبلاً برای یک سفارش استفاده شده است.",
  "No medicines are authorized by this prescription.": "برای این نسخه دوایی تأیید نشده است."
};

// Use only for failed requests, never for stored customer or pharmacy content.
export function accountError(error: unknown, locale: Locale, fallback: string): string {
  if (locale !== "fa-AF") return error instanceof Error ? error.message : fallback;
  const message = error instanceof Error ? error.message : "";
  if (messages[message]) return messages[message];
  const status = error instanceof Error && "status" in error ? error.status : undefined;
  if (status === 401) return "برای ادامه دوباره وارد حساب خود شوید.";
  if (status === 403) return "اجازه انجام این درخواست را ندارید.";
  if (status === 404) return "مورد درخواستی پیدا نشد یا در دسترس شما نیست.";
  if (status === 413) return "حجم فایل بیشتر از حد مجاز است. فایل کوچک‌تری انتخاب کنید.";
  if (status === 429) return "درخواست‌های زیادی فرستاده شده است. کمی بعد دوباره کوشش کنید.";
  // Keep existing Dari validation feedback, including technical file-type names.
  if (/[\u0600-\u06ff]/.test(message)) return message;
  if (status === 400 || status === 422) return messages["Please correct the highlighted fields."];
  if (typeof status === "number" && status >= 500) return "خدمات موقتاً در دسترس نیست. کمی بعد دوباره کوشش کنید.";
  return fallback;
}

export function accountValidation(validity: Pick<ValidityState, "valueMissing" | "typeMismatch" | "tooLong" | "tooShort">): string {
  if (validity.valueMissing) return "این بخش را تکمیل کنید.";
  if (validity.typeMismatch) return "معلومات را با قالب درست وارد کنید.";
  if (validity.tooLong) return "متن واردشده بیش از حد طولانی است.";
  if (validity.tooShort) return "متن واردشده کوتاه‌تر از حد لازم است.";
  return "مقدار واردشده را بررسی و اصلاح کنید.";
}
