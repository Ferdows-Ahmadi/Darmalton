import type { Locale } from "./locale";

const messages: Record<string, readonly [string, string]> = {
  "Your cart is empty.": ["سبد خرید شما خالی است. نخست محصولی انتخاب کنید.", "ستاسو ټوکرۍ تشه ده. لومړی یو توکی وټاکئ."],
  "The selected address does not belong to this customer.": ["آدرس انتخاب‌شده در دسترس نیست. یکی از آدرس‌های حساب خود را انتخاب کنید.", "ټاکل شوې پته د لاسرسي وړ نه ده. د خپل حساب یوه پته وټاکئ."],
  "No active pharmacy branch is available.": ["در حال حاضر شعبه‌ای برای آماده‌سازی سفارش در دسترس نیست.", "اوس د فرمایش د چمتو کولو لپاره څانګه نشته."],
  "The fulfillment branch is not currently active.": ["شعبه آماده‌سازی سفارش فعلاً فعال نیست. کمی بعد دوباره کوشش کنید.", "د فرمایش چمتو کوونکې څانګه اوس فعاله نه ده. لږ وروسته بیا هڅه وکړئ."],
  "An approved prescription is required.": ["برای ثبت این سفارش نسخه تأییدشده لازم است.", "د دې فرمایش د ثبت لپاره تایید شوې نسخه اړینه ده."],
  "An approved prescription is required for this medicine.": ["برای این دوا نسخه تأییدشده لازم است.", "د دې درملو لپاره تایید شوې نسخه اړینه ده."],
  "The selected prescription has expired.": ["اعتبار نسخه انتخاب‌شده پایان یافته است. نسخه معتبر انتخاب کنید.", "د ټاکل شوې نسخې اعتبار پای ته رسېدلی دی. معتبره نسخه وټاکئ."],
  "This prescription has already been used for an order.": ["این نسخه قبلاً برای یک سفارش استفاده شده است.", "دا نسخه مخکې د یوه فرمایش لپاره کارول شوې ده."],
  "This medicine is not authorized by the selected prescription.": ["این دوا در نسخه انتخاب‌شده تأیید نشده است.", "دا درمل په ټاکل شوې نسخه کې نه دي تایید شوي."],
  "The selected prescription does not belong to this customer.": ["نسخه انتخاب‌شده در دسترس حساب شما نیست.", "ټاکل شوې نسخې ته ستاسو حساب لاسرسی نه لري."],
  "One order cannot use more than one prescription authorization.": ["برای یک سفارش فقط یک نسخه تأییدشده قابل استفاده است.", "د یوه فرمایش لپاره یوازې یوه تایید شوې نسخه کارول کېدای شي."]
};

// Map request failures only. Never display arbitrary server text or translate data.
export function checkoutError(error: unknown, locale: Locale, fallback: string) {
  if (locale === "en") return fallback;
  const failure = error instanceof Error ? error as Error & { status?: number; fields?: Record<string, string | string[]> } : undefined;
  const status = failure?.status;
  if (status === 401) return locale === "ps-AF" ? "د دوام لپاره بیا خپل حساب ته ننوځئ." : "برای ادامه دوباره وارد حساب خود شوید.";
  if (status === 403) return locale === "ps-AF" ? "د دې غوښتنې د ترسره کولو اجازه نه لرئ." : "اجازه انجام این درخواست را ندارید.";
  if (status === 429) return locale === "ps-AF" ? "ډېرې غوښتنې لېږل شوې دي. لږ وروسته بیا هڅه وکړئ." : "درخواست‌های زیادی فرستاده شده است. کمی بعد دوباره کوشش کنید.";
  if (status && status >= 500) return locale === "ps-AF" ? "خدمتونه لنډمهاله د لاسرسي وړ نه دي. لږ وروسته بیا هڅه وکړئ." : "خدمات موقتاً در دسترس نیست. کمی بعد دوباره کوشش کنید.";
  const candidates = [failure?.message || "", ...Object.values(failure?.fields || {}).flat()];
  for (const message of candidates) {
    if (messages[message]) return messages[message][locale === "ps-AF" ? 1 : 0];
    if (/^Insufficient stock for .+\.$/.test(message)) return locale === "ps-AF" ? "د یوه درمل موجودي بسنه نه کوي. په ټوکرۍ کې د توکو شمېر وګورئ." : "موجودی یکی از دواها کافی نیست. تعداد محصولات سبد را بررسی کنید.";
    if (/^.+ is no longer available\.$/.test(message)) return locale === "ps-AF" ? "یو توکی نور د لاسرسي وړ نه دی. خپله ټوکرۍ وګورئ." : "یکی از محصولات دیگر در دسترس نیست. سبد خرید را بررسی کنید.";
    if (/^.+ requires an approved prescription\.$/.test(message)) return messages["An approved prescription is required."][locale === "ps-AF" ? 1 : 0];
    if (/^Price is not available for .+\.$/.test(message)) return locale === "ps-AF" ? "د یوه توکي بیه نشته. خپله ټوکرۍ وګورئ." : "قیمت یکی از محصولات در دسترس نیست. سبد خرید را بررسی کنید.";
    if (/^Only \d+ units are authorized by this prescription\.$/.test(message)) return locale === "ps-AF" ? "ټاکل شوی شمېر په نسخه کې له تایید شوې اندازې ډېر دی." : "تعداد انتخاب‌شده بیشتر از مقدار تأییدشده در نسخه است.";
  }
  if (failure?.fields?.recipient_phone) return locale === "ps-AF" ? "د ترلاسه کوونکي د اړیکې شمېره وګورئ او په سمه بڼه یې ولیکئ." : "شماره تماس گیرنده را بررسی و با قالب درست وارد کنید.";
  if (failure?.fields?.address_id) return locale === "ps-AF" ? "د سپارلو لپاره معتبره پته وټاکئ." : "یک آدرس معتبر برای تحویل انتخاب کنید.";
  if (status === 400 || status === 422) return locale === "ps-AF" ? "لیکل شوي معلومات وګورئ او سم یې کړئ." : "معلومات واردشده را بررسی و اصلاح کنید.";
  if (failure?.message === "Failed to fetch" || failure instanceof TypeError) return locale === "ps-AF" ? "خپله اړیکه وګورئ او بیا هڅه وکړئ." : "اتصال خود را بررسی و دوباره کوشش کنید.";
  return fallback;
}

export const checkoutRequiredFields = ["recipient_name", "recipient_phone", "province", "city", "street_address"] as const;

export function missingCheckoutFields(values: Record<string, unknown>) {
  return checkoutRequiredFields.filter(name => typeof values[name] !== "string" || !(values[name] as string).trim());
}
