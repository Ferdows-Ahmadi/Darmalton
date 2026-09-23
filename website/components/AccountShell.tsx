"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLocale } from "./LocaleProvider";
import type { TextKey } from "@/lib/locale";
import { accountValidation } from "@/lib/account-feedback";
import styles from "./AccountShell.module.css";

const accountLinks: [string, TextKey][] = [
  ["/account", "account"],
  ["/account/profile", "profile"],
  ["/account/addresses", "addresses"],
  ["/account/orders", "orders"],
  ["/account/prescriptions", "rxList"],
  ["/account/notifications", "notifications"]
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, locale } = useLocale();
  const activePath = locale !== "en"
    ? pathname.replace(/^\/(orders|notifications|prescriptions)(?=\/|$)/, "/account/$1")
    : pathname;
  return (
    <div className={`account-layout${locale !== "en" ? ` ${styles.shell}` : ""}`}
      onInvalidCapture={(event) => {
        const field = event.target;
        if (locale !== "en" && (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) {
          field.setCustomValidity(accountValidation(field.validity, locale));
        }
      }}
      onInputCapture={(event) => {
        const field = event.target;
        if (locale !== "en" && (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) field.setCustomValidity("");
      }}
    >
      <nav className="account-nav" aria-label={t("account")}>
        {accountLinks.map(([href, label]) => (
          <Link
            href={href}
            key={href}
            aria-current={activePath === href || (href !== "/account" && activePath.startsWith(`${href}/`)) ? "page" : undefined}
          >
            {t(label)}
          </Link>
        ))}
      </nav>
      <div className="account-content">{children}</div>
    </div>
  );
}
