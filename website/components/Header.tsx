"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Header({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links = [
    ["/", "Medicines"],
    ["/cart", "Cart"],
    ["/orders", "Orders"],
    ["/account", "Account"]
  ];

  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Darmalton Pharmacy home">
        <span className="brand-mark" aria-hidden="true">+</span>
        <span>Darmalton <small>Pharmacy</small></span>
      </Link>
      <nav aria-label="Main navigation">
        {links.map(([href, label]) => (
          <Link className={pathname === href ? "active" : ""} href={href} key={href}>
            {label}
          </Link>
        ))}
        {authenticated ? (
          <button className="link-button" onClick={logout}>Sign out</button>
        ) : (
          <Link className={pathname === "/login" ? "active" : ""} href="/login">Sign in</Link>
        )}
      </nav>
    </header>
  );
}
