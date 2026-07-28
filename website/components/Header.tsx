"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Header({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.google?.accounts.id.disableAutoSelect();
    router.push("/");
    router.refresh();
  }

  const links = [
    ["/", "خانه"],
    ["/cart", "سبد خرید"],
    ["/orders", "سفارش‌های من"],
    ["/account", "حساب کاربری"]
  ];

  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="خانه درملتون">
        <Image
          src="/branding/darmalton-wordmark.png"
          alt="درملتون"
          width={2000}
          height={808}
          priority
        />
      </Link>
      <nav aria-label="منوی اصلی">
        {links.map(([href, label]) => (
          <Link
            className={pathname === href ? "active" : ""}
            href={href}
            key={href}
          >
            {label}
          </Link>
        ))}
        {authenticated ? (
          <button className="link-button signout" onClick={logout}>
            خروج
          </button>
        ) : (
          <Link
            className={pathname === "/login" ? "active" : ""}
            href="/login"
          >
            ورود
          </Link>
        )}
      </nav>
    </header>
  );
}
