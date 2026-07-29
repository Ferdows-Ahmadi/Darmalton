import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import localFont from "next/font/local";

import { Header } from "@/components/Header";
import { GuestWelcomePrompt } from "@/components/GuestWelcomePrompt";
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

  return (
    <html lang="fa-AF" dir="rtl">
      <body className={vazirmatn.variable}>
        <Header authenticated={authenticated} />
        <GuestWelcomePrompt authenticated={authenticated} />
        <ScrollToTop />
        <main>{children}</main>
        <footer className="site-footer">
          <div className="footer-main">
            <div className="footer-intro">
              <Image
                className="footer-brand"
                src="/branding/darmalton-wordmark.png"
                alt="درملتون"
                width={2000}
                height={808}
              />
              <p>
                راه ساده و مسئولانه برای جستجوی دارو، بررسی نسخه و پیگیری
                سفارش.
              </p>
            </div>
            <div>
              <strong>درملتون</strong>
              <Link href="/about">درباره ما</Link>
              <Link href="/contact">تماس</Link>
              <Link href="/#faq">پرسش‌های متداول</Link>
            </div>
            <div>
              <strong>خدمات</strong>
              <Link href="/shop">فروشگاه</Link>
              <Link href="/prescriptions">ارسال نسخه</Link>
              <Link href="/orders">پیگیری سفارش</Link>
            </div>
            <div>
              <strong>قوانین</strong>
              <Link href="/privacy">حریم خصوصی</Link>
              <Link href="/terms">شرایط استفاده</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© ۲۰۲۶ درملتون</span>
            <span>
              قیمت، موجودی و مجموع سفارش همیشه توسط سرور داروخانه تأیید
              می‌شود.
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
