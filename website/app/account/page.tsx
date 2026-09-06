"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { loginPath } from "@/lib/auth-navigation";
import { AccountShell } from "@/components/AccountShell";
import { useLocale } from "@/components/LocaleProvider";
import type { Address, Order, PageResult, User } from "@/lib/types";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [addressCount, setAddressCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const router = useRouter();
  const { locale, t } = useLocale();

  useEffect(() => {
    Promise.all([
      apiFetch<User>("auth/me/"),
      apiFetch<PageResult<Address>>("addresses/"),
      apiFetch<PageResult<Order>>("orders/")
    ])
      .then(([currentUser, addresses, orders]) => {
        setUser(currentUser);
        setAddressCount(addresses.count);
        setOrderCount(orders.count);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push(loginPath("/account"));
        }
      });
  }, [router]);

  const name = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || t("account")
    : "";

  return (
    <section className="page-section narrow">
      <p className="eyebrow">{t("secure")}</p>
      <h1>{t("account")}</h1>
      <AccountShell>{!user ? (
        <div className="loading">{t("loading")}</div>
      ) : (
        <>
          <div className="panel profile-card">
            <span className="avatar">
              {(user.first_name[0] || user.email[0]).toUpperCase()}
            </span>
            <div>
              <h2>{name}</h2>
              <p dir="ltr">{user.email}</p>
              <p dir="ltr">{user.phone || t("unspecified")}</p>
            </div>
          </div>
          <div className="account-stats">
            <Link href="/account/orders">
              <strong>{orderCount.toLocaleString(locale)}</strong>
              <span>{t("orders")}</span>
            </Link>
            <Link href="/account/addresses">
              <strong>{addressCount.toLocaleString(locale)}</strong>
              <span>{t("addresses")}</span>
            </Link>
          </div>
          <div className="profile-menu">
            <Link href="/account/orders">
              <span>{t("orders")}</span>
              <b aria-hidden="true">‹</b>
            </Link>
            <Link href="/cart">
              <span>{t("cart")}</span>
              <b aria-hidden="true">‹</b>
            </Link>
            <Link href="/account/prescriptions">
              <span>{t("rxList")}</span>
              <b aria-hidden="true">‹</b>
            </Link>
          </div>
        </>
      )}</AccountShell>
    </section>
  );
}
