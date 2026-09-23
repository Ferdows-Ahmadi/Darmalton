import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";

import { serverLocale } from "@/lib/server-locale";
import { AppChrome } from "@/components/AppChrome";
import { publicCmsList } from "@/lib/public-cms";
import type { PublicAnnouncement, PublicContentPage } from "@/lib/types";
import "./globals.css";
import "./polish.css";

const estedad = localFont({src:"./fonts/Estedad.ttf", variable:"--font-estedad", display:"swap"});

export async function generateMetadata(): Promise<Metadata> {
  const pashto = (await serverLocale()) === "ps-AF";
  return {
  applicationName: "Darmalton",
  title: {
    default: pashto ? "درملتون | آنلاین درملتون" : "درملتون | داروخانه آنلاین",
    template: "%s | درملتون"
  },
  description:
    pashto ? "په درملتون کې درمل او روغتیایي توکي ولټوئ، نسخه په محرم ډول واستوئ او خپل فرمایشونه وڅارئ." : "جستجوی دارو و محصولات صحی، ارسال محرمانه نسخه و پیگیری سفارش در درملتون.",
  icons: {
    icon: "/brand/android-icon.png",
    apple: "/brand/android-icon.png"
  }
  };
}

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await serverLocale();
  const authenticated = Boolean(
    (await cookies()).get("pharmacy_refresh")?.value
  );
  const [globalAnnouncements, healthArticles] = await Promise.all([
    publicCmsList<PublicAnnouncement>(
      "cms/announcements/?placement=GLOBAL&ordering=display_order"
    ),
    publicCmsList<PublicContentPage>("cms/health-articles/?ordering=display_order")
  ]);

  return (
    <html lang={locale} dir={locale === "en" ? "ltr" : "rtl"} data-scroll-behavior="smooth">
      <body className={estedad.variable}>
        <AppChrome
          locale={locale}
          authenticated={authenticated}
          hasHealthContent={healthArticles.length > 0}
          globalAnnouncements={globalAnnouncements}
        >
          {children}
        </AppChrome>
      </body>
    </html>
  );
}
