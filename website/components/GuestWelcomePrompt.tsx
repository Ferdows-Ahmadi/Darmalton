"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

const promptKey = "darmalton_guest_prompt_seen_v1";

export function GuestWelcomePrompt({
  authenticated
}: {
  authenticated: boolean;
}) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const { locale, t } = useLocale();
  const copy = locale === "en"
    ? { label: "Create an account suggestion", later: "Later", title: "Easier ordering and updates", body: "Create an account to keep your cart and follow orders and prescriptions." }
    : locale === "fa-AF"
      ? { label: "پیشنهاد ایجاد حساب", later: "بعداً", title: "خرید و پیگیری آسان‌تر", body: "با ایجاد حساب، سبد شما حفظ می‌شود و سفارش‌ها و نسخه‌های خود را پیگیری می‌کنید." }
      : { label: "د حساب جوړولو وړاندیز", later: "وروسته", title: "اسانه پېرود او تعقیب", body: "حساب جوړ کړئ څو ټوکرۍ مو وساتل شي او فرمایشونه او نسخې تعقیب کړئ." };

  useEffect(() => {
    if (authenticated || pathname !== "/shop") return;
    if (window.localStorage.getItem(promptKey) === "true") return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(promptKey, "true");
      setVisible(true);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [authenticated, pathname]);

  if (!visible || authenticated || pathname !== "/shop") return null;
  return (
    <aside className="guest-welcome" aria-label={copy.label}>
      <button
        className="guest-welcome-close"
        onClick={() => setVisible(false)}
        aria-label={copy.later}
      >
        ×
      </button>
      <strong>{copy.title}</strong>
      <p>{copy.body}</p>
      <div>
        <Link href="/login">{t("login")}</Link>
        <Link href="/register">{t("register")}</Link>
        <button onClick={() => setVisible(false)}>{copy.later}</button>
      </div>
    </aside>
  );
}
