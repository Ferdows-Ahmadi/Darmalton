import type { Locale } from "./locale";

const messages: Record<string, readonly [string, string]> = {
  "Please correct the highlighted fields.": ["معلومات واردشده را بررسی و اصلاح کنید.", "لیکل شوي معلومات وګورئ او سم یې کړئ."],
  "The request could not be completed.": ["درخواست انجام نشد. دوباره کوشش کنید.", "غوښتنه ترسره نه شوه. بیا هڅه وکړئ."],
  "Failed to fetch": ["اتصال خود را بررسی و دوباره کوشش کنید.", "خپله اړیکه وګورئ او بیا هڅه وکړئ."],
  "NetworkError when attempting to fetch resource.": ["اتصال خود را بررسی و دوباره کوشش کنید.", "خپله اړیکه وګورئ او بیا هڅه وکړئ."],
  "This prescription does not belong to you.": ["به این نسخه دسترسی ندارید.", "دې نسخې ته لاسرسی نه لرئ."],
  "An approved prescription is required.": ["یک نسخه تأییدشده لازم است.", "یوه تایید شوې نسخه اړینه ده."],
  "The selected prescription has expired.": ["اعتبار نسخه انتخاب‌شده پایان یافته است.", "د ټاکل شوې نسخې اعتبار پای ته رسېدلی دی."],
  "This prescription has already been used for an order.": ["این نسخه قبلاً برای یک سفارش استفاده شده است.", "دا نسخه مخکې د یوه فرمایش لپاره کارول شوې ده."],
  "No medicines are authorized by this prescription.": ["برای این نسخه دوایی تأیید نشده است.", "د دې نسخې لپاره درمل نه دي تایید شوي."]
};

// Use only for failed requests, never for stored customer or pharmacy content.
export function accountError(error: unknown, locale: Locale, fallback: string): string {
  if (locale === "en") return error instanceof Error ? error.message : fallback;
  const message = error instanceof Error ? error.message : "";
  if (messages[message]) return messages[message][locale === "ps-AF" ? 1 : 0];
  const status = error instanceof Error && "status" in error ? error.status : undefined;
  if (status === 401) return locale === "ps-AF" ? "د دوام لپاره بیا خپل حساب ته ننوځئ." : "برای ادامه دوباره وارد حساب خود شوید.";
  if (status === 403) return locale === "ps-AF" ? "د دې غوښتنې د ترسره کولو اجازه نه لرئ." : "اجازه انجام این درخواست را ندارید.";
  if (status === 404) return locale === "ps-AF" ? "غوښتل شوی توکی ونه موندل شو یا ورته لاسرسی نه لرئ." : "مورد درخواستی پیدا نشد یا در دسترس شما نیست.";
  if (status === 413) return locale === "ps-AF" ? "فایل له ټاکلې اندازې لوی دی. کوچنی فایل وټاکئ." : "حجم فایل بیشتر از حد مجاز است. فایل کوچک‌تری انتخاب کنید.";
  if (status === 429) return locale === "ps-AF" ? "ډېرې غوښتنې لېږل شوې دي. لږ وروسته بیا هڅه وکړئ." : "درخواست‌های زیادی فرستاده شده است. کمی بعد دوباره کوشش کنید.";
  // Keep existing Dari validation feedback, including technical file-type names.
  if (locale === "fa-AF" && /[\u0600-\u06ff]/.test(message)) return message;
  if (status === 400 || status === 422) return messages["Please correct the highlighted fields."][locale === "ps-AF" ? 1 : 0];
  if (typeof status === "number" && status >= 500) return locale === "ps-AF" ? "خدمتونه لنډمهاله د لاسرسي وړ نه دي. لږ وروسته بیا هڅه وکړئ." : "خدمات موقتاً در دسترس نیست. کمی بعد دوباره کوشش کنید.";
  return fallback;
}

export function accountValidation(validity: Pick<ValidityState, "valueMissing" | "typeMismatch" | "tooLong" | "tooShort">, locale: Locale = "fa-AF"): string {
  if (validity.valueMissing) return locale === "ps-AF" ? "دا برخه بشپړه کړئ." : "این بخش را تکمیل کنید.";
  if (validity.typeMismatch) return locale === "ps-AF" ? "معلومات په سمه بڼه ولیکئ." : "معلومات را با قالب درست وارد کنید.";
  if (validity.tooLong) return locale === "ps-AF" ? "لیکل شوی متن ډېر اوږد دی." : "متن واردشده بیش از حد طولانی است.";
  if (validity.tooShort) return locale === "ps-AF" ? "لیکل شوی متن تر اړینې اندازې لنډ دی." : "متن واردشده کوتاه‌تر از حد لازم است.";
  return locale === "ps-AF" ? "لیکل شوې اندازه وګورئ او سمه یې کړئ." : "مقدار واردشده را بررسی و اصلاح کنید.";
}
