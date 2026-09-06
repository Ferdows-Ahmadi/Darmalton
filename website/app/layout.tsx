import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";

import { serverLocale } from "@/lib/server-locale";
import { AppChrome } from "@/components/AppChrome";
import { publicCmsList } from "@/lib/public-cms";
import type { PublicAnnouncement } from "@/lib/types";
import "./globals.css";

const estedad = localFont({src:"./fonts/Estedad.ttf", variable:"--font-estedad", display:"swap"});

export const metadata: Metadata = {
  applicationName: "Darmalton",
  title: {
    default: "درملتون | داروخانه آنلاین",
    template: "%s | درملتون"
  },
  description:
    "جستجوی دارو و محصولات صحی، ارسال محرمانه نسخه و پیگیری سفارش در درملتون.",
  icons: {
    icon: "/brand/android-icon.png",
    apple: "/brand/android-icon.png"
  }
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await serverLocale();
  const authenticated = Boolean(
    (await cookies()).get("pharmacy_refresh")?.value
  );
  const globalAnnouncements = await publicCmsList<PublicAnnouncement>(
    "cms/announcements/?placement=GLOBAL&ordering=display_order"
  );

  return (
    <html lang={locale} dir={locale === "en" ? "ltr" : "rtl"} data-scroll-behavior="smooth">
      <body className={estedad.variable}>
        <AppChrome
          locale={locale}
          authenticated={authenticated}
          globalAnnouncements={globalAnnouncements}
        >
          {children}
        </AppChrome>
      </body>
    </html>
  );
}
