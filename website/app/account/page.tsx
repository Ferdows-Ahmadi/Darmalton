"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { loginPath } from "@/lib/auth-navigation";
import { accountError } from "@/lib/account-feedback";
import { AccountShell } from "@/components/AccountShell";
import { useLocale } from "@/components/LocaleProvider";
import { formatNumber } from "@/lib/locale";
import type { Address, Order, PageResult, User } from "@/lib/types";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [addressCount, setAddressCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [error, setError] = useState("");
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
        setError("");
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push(loginPath("/account"));
        } else {
          setError(accountError(err, locale, t("connection")));
        }
      });
  }, [locale, router, t]);

  const name = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || t("account")
    : "";

  return (
    <section className="page-section narrow">
      <p className="eyebrow">{t("secure")}</p>
      <h1>{t("account")}</h1>
      <AccountShell>{!user ? (
        <div className={error ? "form-error" : "loading"} role={error ? "alert" : undefined}>{error || t("loading")}</div>
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
              <strong>{formatNumber(orderCount, locale)}</strong>
              <span>{t("orders")}</span>
            </Link>
            <Link href="/account/addresses">
              <strong>{formatNumber(addressCount, locale)}</strong>
              <span>{t("addresses")}</span>
            </Link>
          </div>
          <div className="profile-menu">
            <Link href="/account/orders">
              <span>{t("orders")}</span>
              <b aria-hidden="true">{locale === "en" ? "›" : "‹"}</b>
            </Link>
            <Link href="/cart">
              <span>{t("cart")}</span>
              <b aria-hidden="true">{locale === "en" ? "›" : "‹"}</b>
            </Link>
            <Link href="/account/prescriptions">
              <span>{t("rxList")}</span>
              <b aria-hidden="true">{locale === "en" ? "›" : "‹"}</b>
            </Link>
          </div>
        </>
      )}</AccountShell>
    </section>
  );
}
