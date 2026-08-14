import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";

import { AppChrome } from "@/components/AppChrome";
import { publicCmsList } from "@/lib/public-cms";
import type { PublicAnnouncement } from "@/lib/types";
import "./globals.css";

const vazirmatn = localFont({
  src: [
    { path: "./fonts/Vazirmatn-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Vazirmatn-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Vazirmatn-Bold.ttf", weight: "700", style: "normal" }
  ],
  variable: "--font-vazirmatn",
  display: "swap"
});

export const metadata: Metadata = {
  applicationName: "Darmalton",
  title: {
    default: "درملتون | داروخانه آنلاین",
    template: "%s | درملتون"
  },
  description:
    "جستجوی دارو و محصولات صحی، ارسال محرمانه نسخه و پیگیری سفارش در درملتون.",
  icons: {
    icon: "/branding/brand-bag-mark.png",
    apple: "/branding/brand-bag-mark.png"
  }
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const authenticated = Boolean(
    (await cookies()).get("pharmacy_refresh")?.value
  );
  const globalAnnouncements = await publicCmsList<PublicAnnouncement>(
    "cms/announcements/?placement=GLOBAL&ordering=display_order"
  );

  return (
    <html lang="fa-AF" dir="rtl" data-scroll-behavior="smooth">
      <body className={vazirmatn.variable}>
        <AppChrome
          authenticated={authenticated}
          globalAnnouncements={globalAnnouncements}
        >
          {children}
        </AppChrome>
      </body>
    </html>
  );
}
