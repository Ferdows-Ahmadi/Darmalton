"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const promptKey = "darmalton_guest_prompt_seen_v1";

export function GuestWelcomePrompt({
  authenticated
}: {
  authenticated: boolean;
}) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

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
    <aside className="guest-welcome" aria-label="پیشنهاد ایجاد حساب">
      <button
        className="guest-welcome-close"
        onClick={() => setVisible(false)}
        aria-label="بعداً"
      >
        ×
      </button>
      <strong>خرید و پیگیری آسان‌تر</strong>
      <p>
        با ایجاد حساب، سبد شما حفظ می‌شود و سفارش‌ها و نسخه‌های خود را پیگیری
        می‌کنید.
      </p>
      <div>
        <Link href="/login">ورود</Link>
        <Link href="/register">ایجاد حساب</Link>
        <button onClick={() => setVisible(false)}>بعداً</button>
      </div>
    </aside>
  );
}
