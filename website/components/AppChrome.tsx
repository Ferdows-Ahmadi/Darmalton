"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { formatNumber, Locale, TextKey } from "@/lib/locale";
import type { PublicAnnouncement } from "@/lib/types";
import { isCustomerRoute, mobileCustomerSection } from "@/lib/customer-navigation";
import { Header } from "./Header";
import { Icon } from "./StoreUI";
import { LocaleProvider, useLocale } from "./LocaleProvider";
import { PublicAnnouncements } from "./PublicAnnouncements";
import { SessionIntro } from "./SessionIntro";
import { AuthStateProvider } from "./AuthStateProvider";
import marketplace from "./home/MarketplaceChrome.module.css";

function CustomerChrome({
  authenticated,
  hasHealthContent,
  children,
  globalAnnouncements
}: {
  authenticated: boolean;
  hasHealthContent: boolean;
  children: React.ReactNode;
  globalAnnouncements: PublicAnnouncement[];
}) {
  const { t, locale } = useLocale();
  const pathname = usePathname();
  const approvedChrome = isCustomerRoute(pathname);
  const mobileSection = approvedChrome ? mobileCustomerSection(pathname) : undefined;
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const footer: [string, TextKey][][] = [
    [["/shop", "shop"], ["/categories", "categories"], ["/manufacturers", "manufacturers"]],
    [["/prescription-help", "rxHelp"], ["/help", "help"], ["/faq", "faq"], ["/contact", "contact"]],
    [["/about", "about"], ["/app", "app"], ...(hasHealthContent ? [["/health", "health"] as [string, TextKey]] : [])],
    [["/privacy", "privacy"], ["/terms", "terms"], ["/delivery-policy", "delivery"], ["/returns", "returns"]]
  ];

  return <AuthStateProvider authenticated={authenticated}><div className={`site-shell${approvedChrome ? ` ${marketplace.chrome} ${marketplace.contentFlow}` : ""}`}>
    <SessionIntro />
    <a className="skip-link" href="#main">{t("products")}</a>
    <Header authenticated={authenticated} hasHealthContent={hasHealthContent}/>
    {offline && <p className="offline" role="status">{t("offline")}</p>}
    <PublicAnnouncements locale={locale} announcements={globalAnnouncements}/>
    <main id="main">{children}</main>
    <footer className="store-footer">
      <div className="service-strip wrap">
        {[["ICON-005_Prescription-Upload", "privateRx"], ["ICON-009_Secure-Checkout", "cod"], ["ICON-002_Account", "orderHistory"], ["ICON-010_Customer-Support", "support"]].map(([icon, label]) => <div key={icon}><Icon name={icon}/><span>{t(label as TextKey)}</span></div>)}
      </div>
      <div className="footer-grid wrap">
        <div><Image src="/brand/darmalton-logo.png" alt={locale === "en" ? "Darmalton" : "درملتون"} width={160} height={64} priority/><p>{t("footer")}</p></div>
        {footer.map((group, index) => <nav aria-label={`${t("menu")} ${locale !== "en" ? formatNumber(index + 1, locale) : index + 1}`} key={index}>{group.map(([href, label]) => <Link key={href} href={href}>{t(label)}</Link>)}</nav>)}
      </div>
      <div className="footer-bottom wrap"><span>© {new Date().getFullYear()} Darmalton</span><span>{t("privateRx")}</span></div>
    </footer>
    <nav className="mobile-bottom" aria-label={t("menu")}>
      {[["/", "home", "⌂"], ["/shop", "shop", "⌕"], ["/prescriptions/upload", "rx", "Rx"], ["/cart", "cart", "▱"], ["/account", "account", "○"]].map(([href, label, icon]) => <Link key={href} href={href} aria-current={(approvedChrome ? mobileSection === href : pathname === href || (href !== "/" && pathname.startsWith(href))) ? "page" : undefined}><span aria-hidden="true">{icon}</span>{t(label as TextKey)}</Link>)}
    </nav>
  </div></AuthStateProvider>;
}

export function AppChrome({
  locale,
  authenticated,
  hasHealthContent,
  globalAnnouncements,
  children
}: {
  locale: Locale;
  authenticated: boolean;
  hasHealthContent: boolean;
  globalAnnouncements: PublicAnnouncement[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return <LocaleProvider key={locale} locale={locale}>
    {!isCustomerRoute(pathname)
      ? <main className="staff-root">{children}</main>
      : <CustomerChrome authenticated={authenticated} hasHealthContent={hasHealthContent} globalAnnouncements={globalAnnouncements}>{children}</CustomerChrome>}
  </LocaleProvider>;
}
