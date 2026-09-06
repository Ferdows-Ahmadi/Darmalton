"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLocale } from "./LocaleProvider";
import type { TextKey } from "@/lib/locale";

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
  const { t } = useLocale();
  return (
    <div className="account-layout">
      <nav className="account-nav" aria-label={t("account")}>
        {accountLinks.map(([href, label]) => (
          <Link
            href={href}
            key={href}
            aria-current={pathname === href || (href !== "/account" && pathname.startsWith(`${href}/`)) ? "page" : undefined}
          >
            {t(label)}
          </Link>
        ))}
      </nav>
      <div className="account-content">{children}</div>
    </div>
  );
}
