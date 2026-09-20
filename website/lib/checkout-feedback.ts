import type { Locale } from "./locale";

const messages: Record<string, string> = {
  "Your cart is empty.": "سبد خرید شما خالی است. نخست محصولی انتخاب کنید.",
  "The selected address does not belong to this customer.": "آدرس انتخاب‌شده در دسترس نیست. یکی از آدرس‌های حساب خود را انتخاب کنید.",
  "No active pharmacy branch is available.": "در حال حاضر شعبه‌ای برای آماده‌سازی سفارش در دسترس نیست.",
  "The fulfillment branch is not currently active.": "شعبه آماده‌سازی سفارش فعلاً فعال نیست. کمی بعد دوباره کوشش کنید.",
  "An approved prescription is required.": "برای ثبت این سفارش نسخه تأییدشده لازم است.",
  "An approved prescription is required for this medicine.": "برای این دوا نسخه تأییدشده لازم است.",
  "The selected prescription has expired.": "اعتبار نسخه انتخاب‌شده پایان یافته است. نسخه معتبر انتخاب کنید.",
  "This prescription has already been used for an order.": "این نسخه قبلاً برای یک سفارش استفاده شده است.",
  "This medicine is not authorized by the selected prescription.": "این دوا در نسخه انتخاب‌شده تأیید نشده است.",
  "The selected prescription does not belong to this customer.": "نسخه انتخاب‌شده در دسترس حساب شما نیست.",
  "One order cannot use more than one prescription authorization.": "برای یک سفارش فقط یک نسخه تأییدشده قابل استفاده است."
};

// Map request failures only. Never display arbitrary server text or translate data.
export function checkoutError(error: unknown, locale: Locale, fallback: string) {
  if (locale !== "fa-AF") return fallback;
  const failure = error instanceof Error ? error as Error & { status?: number; fields?: Record<string, string | string[]> } : undefined;
  const status = failure?.status;
  if (status === 401) return "برای ادامه دوباره وارد حساب خود شوید.";
  if (status === 403) return "اجازه انجام این درخواست را ندارید.";
  if (status === 429) return "درخواست‌های زیادی فرستاده شده است. کمی بعد دوباره کوشش کنید.";
  if (status && status >= 500) return "خدمات موقتاً در دسترس نیست. کمی بعد دوباره کوشش کنید.";
  const candidates = [failure?.message || "", ...Object.values(failure?.fields || {}).flat()];
  for (const message of candidates) {
    if (messages[message]) return messages[message];
    if (/^Insufficient stock for .+\.$/.test(message)) return "موجودی یکی از دواها کافی نیست. تعداد محصولات سبد را بررسی کنید.";
    if (/^.+ is no longer available\.$/.test(message)) return "یکی از محصولات دیگر در دسترس نیست. سبد خرید را بررسی کنید.";
    if (/^.+ requires an approved prescription\.$/.test(message)) return messages["An approved prescription is required."];
    if (/^Price is not available for .+\.$/.test(message)) return "قیمت یکی از محصولات در دسترس نیست. سبد خرید را بررسی کنید.";
    if (/^Only \d+ units are authorized by this prescription\.$/.test(message)) return "تعداد انتخاب‌شده بیشتر از مقدار تأییدشده در نسخه است.";
  }
  if (failure?.fields?.recipient_phone) return "شماره تماس گیرنده را بررسی و با قالب درست وارد کنید.";
  if (failure?.fields?.address_id) return "یک آدرس معتبر برای تحویل انتخاب کنید.";
  if (status === 400 || status === 422) return "معلومات واردشده را بررسی و اصلاح کنید.";
  if (failure?.message === "Failed to fetch" || failure instanceof TypeError) return "اتصال خود را بررسی و دوباره کوشش کنید.";
  return fallback;
}

export const checkoutRequiredFields = ["recipient_name", "recipient_phone", "province", "city", "street_address"] as const;

export function missingCheckoutFields(values: Record<string, unknown>) {
  return checkoutRequiredFields.filter(name => typeof values[name] !== "string" || !(values[name] as string).trim());
}
