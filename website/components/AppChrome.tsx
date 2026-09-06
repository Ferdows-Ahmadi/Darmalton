"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "./Header";
import { LocaleProvider, useLocale } from "./LocaleProvider";
import { Locale, TextKey } from "@/lib/locale";
import { PublicAnnouncements } from "./PublicAnnouncements";
import type { PublicAnnouncement } from "@/lib/types";
import { Icon } from "./StoreUI";
function CustomerChrome({authenticated,children,globalAnnouncements}:{authenticated:boolean;children:React.ReactNode;globalAnnouncements:PublicAnnouncement[]}) {
 const {t}=useLocale();const [offline,setOffline]=useState(false);
 useEffect(()=>{const update=()=>setOffline(!navigator.onLine);update();window.addEventListener("online",update);window.addEventListener("offline",update);return()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);};},[]);
 const footer: [string,TextKey][][]=[[["/shop","shop"],["/categories","categories"],["/manufacturers","manufacturers"]],[["/prescription-help","rxHelp"],["/help","help"],["/faq","faq"],["/contact","contact"]],[["/about","about"],["/app","app"],["/health","health"]],[["/privacy","privacy"],["/terms","terms"],["/delivery-policy","delivery"],["/returns","returns"]]];
 return <><a className="skip-link" href="#main">{t("products")}</a><Header authenticated={authenticated}/>{offline&&<p className="offline" role="status">{t("offline")}</p>}<PublicAnnouncements announcements={globalAnnouncements}/><main id="main">{children}</main><footer className="store-footer"><div className="service-strip wrap">{[["ICON-005_Prescription-Upload","privateRx"],["ICON-009_Secure-Checkout","cod"],["ICON-002_Account","orderHistory"],["ICON-010_Customer-Support","support"]].map(([icon,label])=><div key={icon}><Icon name={icon}/><span>{t(label as TextKey)}</span></div>)}</div><div className="footer-grid wrap"><div><Image src="/brand/darmalton-logo.png" alt="درملتون" width={140} height={57}/><p>{t("footer")}</p></div>{footer.map((group,i)=><nav key={i}>{group.map(([href,label])=><Link key={href} href={href}>{t(label)}</Link>)}</nav>)}</div><div className="footer-bottom wrap"><span>© {new Date().getFullYear()} Darmalton</span><span>{t("privateRx")}</span></div></footer><nav className="mobile-bottom" aria-label={t("menu")}>{[["/","home"],["/shop","shop"],["/prescriptions/upload","rx"],["/cart","cart"],["/account","account"]].map(([href,label])=><Link key={href} href={href}>{t(label as TextKey)}</Link>)}</nav></>;
}
export function AppChrome({locale,authenticated,globalAnnouncements,children}:{locale:Locale;authenticated:boolean;globalAnnouncements:PublicAnnouncement[];children:React.ReactNode}) {const pathname=usePathname();return <LocaleProvider locale={locale}>{pathname.startsWith("/staff")?<main className="staff-root">{children}</main>:<CustomerChrome authenticated={authenticated} globalAnnouncements={globalAnnouncements}>{children}</CustomerChrome>}</LocaleProvider>;}
