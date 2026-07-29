"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";

const navigation = [
  ["/staff", "نمای کلی", "⌂"],
  ["/staff/orders", "سفارش‌ها", "▤"],
  ["/staff/prescriptions", "نسخه‌ها", "Rx"],
  ["/staff/inventory", "موجودی", "▦"],
  ["/staff/warehouses", "انبارها", "⌑"],
  ["/staff/suppliers", "تأمین‌کنندگان", "◇"],
  ["/staff/purchase-orders", "خریدها", "↙"],
  ["/staff/returns", "مرجوعی‌ها", "↺"],
  ["/staff/customers", "مشتریان", "◎"],
  ["/staff/reports", "گزارش‌ها", "▥"],
  ["/staff/settings", "تنظیمات", "⚙"]
] as const;

export function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    apiFetch<User>("auth/me/")
      .then((profile) => {
        if (!["STAFF", "ADMIN", "PHARMACIST"].includes(profile.role)) {
          router.replace("/shop");
          return;
        }
        setUser(profile);
        setReady(true);
      })
      .catch(() => router.replace("/login?returnTo=/staff"));
  }, [router]);

  useEffect(() => setMenuOpen(false), [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  if (!ready || !user) {
    return (
      <div className="staff-gate" role="status">
        <span className="staff-loader" />
        <strong>در حال بررسی دسترسی کارمند…</strong>
      </div>
    );
  }

  return (
    <div className={`staff-shell ${menuOpen ? "menu-open" : ""}`}>
      <aside className="staff-sidebar">
        <div className="staff-brand">
          <Image
            src="/branding/darmalton-wordmark.png"
            alt="درملتون"
            width={2000}
            height={808}
            priority
          />
          <span>پنل عملیات</span>
        </div>
        <nav aria-label="منوی پنل کارمندان">
          {navigation.map(([href, label, icon]) => {
            const active =
              pathname === href || (href !== "/staff" && pathname.startsWith(`${href}/`));
            return (
              <Link className={active ? "active" : ""} href={href} key={href}>
                <span aria-hidden="true">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="staff-sidebar-footer">
          <Link href="/shop">مشاهده فروشگاه</Link>
          <a href="http://localhost:8000/admin/">Django Admin</a>
        </div>
      </aside>
      <section className="staff-workspace">
        <header className="staff-topbar">
          <button
            className="staff-menu-button"
            aria-label="بازکردن منوی پنل"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            ☰
          </button>
          <div>
            <strong>{user.first_name || "کارمند درملتون"}</strong>
            <span>{user.email}</span>
          </div>
          <span className="staff-role">{user.role}</span>
          <button className="staff-logout" onClick={logout}>
            خروج
          </button>
        </header>
        <div className="staff-content">{children}</div>
      </section>
      {menuOpen && (
        <button
          className="staff-scrim"
          aria-label="بستن منو"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
