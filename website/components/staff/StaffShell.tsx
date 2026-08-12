"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { isStaffRole, staffLoginPath } from "@/lib/auth-navigation";
import { staffNavigationForRole } from "@/lib/staff-navigation";
import type { User } from "@/lib/types";

export function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const loginPage = pathname === "/staff/login";

  useEffect(() => {
    if (loginPage) return;
    apiFetch<User>("auth/me/")
      .then((profile) => {
        if (!isStaffRole(profile.role)) {
          router.replace(staffLoginPath(pathname, "forbidden"));
          return;
        }
        setUser(profile);
        setReady(true);
      })
      .catch(() => router.replace(staffLoginPath(pathname)));
  }, [loginPage, pathname, router]);

  useEffect(() => setMenuOpen(false), [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  if (loginPage) return <>{children}</>;

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
          {staffNavigationForRole(user.role).map((group) => (
            <section className="staff-nav-group" key={group.label}>
              <strong>{group.label}</strong>
              {group.items.map(([href, label, icon]) => {
                const overview = href === "/staff" || href === "/staff/cms";
                const active =
                  pathname === href || (!overview && pathname.startsWith(`${href}/`));
                return (
                  <Link className={active ? "active" : ""} href={href} key={href}>
                    <span aria-hidden="true">{icon}</span>
                    {label}
                  </Link>
                );
              })}
            </section>
          ))}
        </nav>
        <div className="staff-sidebar-footer">
          <Link href="/shop">مشاهده فروشگاه</Link>
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
