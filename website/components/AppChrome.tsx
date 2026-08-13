"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { GuestWelcomePrompt } from "@/components/GuestWelcomePrompt";
import { Header } from "@/components/Header";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PublicAnnouncements } from "@/components/PublicAnnouncements";
import type { PublicAnnouncement } from "@/lib/types";

export function AppChrome({
  authenticated,
  globalAnnouncements,
  children
}: {
  authenticated: boolean;
  globalAnnouncements: PublicAnnouncement[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const staff = pathname.startsWith("/staff");

  if (staff) {
    return <main className="staff-root">{children}</main>;
  }

  return (
    <>
      <Header authenticated={authenticated} />
      <PublicAnnouncements announcements={globalAnnouncements} />
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
              راه ساده و مسئولانه برای جستجوی دارو، بررسی نسخه و پیگیری سفارش.
            </p>
          </div>
          <div>
            <strong>درملتون</strong>
            <Link href="/about">درباره ما</Link>
            <Link href="/health-articles">مقاله‌های سلامت</Link>
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
            قیمت، موجودی و مجموع سفارش همیشه توسط سرور داروخانه تأیید می‌شود.
          </span>
        </div>
      </footer>
    </>
  );
}
