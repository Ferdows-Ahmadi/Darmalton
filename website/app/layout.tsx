import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";

import { Header } from "@/components/Header";
import { ScrollToTop } from "@/components/ScrollToTop";
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
  title: { default: "درملتون | داروخانه آنلاین", template: "%s | درملتون" },
  description: "خرید آنلاین دوا و محصولات صحی با قیمت و موجودی تأییدشده."
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const authenticated = Boolean(
    (await cookies()).get("pharmacy_refresh")?.value
  );

  return (
    <html lang="fa-AF" dir="rtl">
      <body className={vazirmatn.variable}>
        <Header authenticated={authenticated} />
        <ScrollToTop />
        <main>{children}</main>
        <footer>
          <strong>درملتون</strong>
          <p>قیمت، موجودی و مجموع سفارش همیشه توسط سرور داروخانه تأیید می‌شود.</p>
        </footer>
      </body>
    </html>
  );
}
