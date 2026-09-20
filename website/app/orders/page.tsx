"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { OrderCard } from "@/components/OrderCard";
import { AccountShell } from "@/components/AccountShell";
import { useAuthenticated } from "@/components/AuthStateProvider";
import { useLocale } from "@/components/LocaleProvider";
import { ApiError, apiFetch } from "@/lib/api";
import { accountError } from "@/lib/account-feedback";
import { loginPath } from "@/lib/auth-navigation";
import type { Order, PageResult } from "@/lib/types";

export default function OrdersPage() {
  const authenticated = useAuthenticated();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const { locale, t } = useLocale();

  useEffect(() => {
    if (!authenticated) {
      router.replace(loginPath("/account/orders"));
      return;
    }
    apiFetch<PageResult<Order>>("orders/")
      .then((data) => setOrders(data.results))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push(loginPath("/account/orders"));
        }
        else setError(accountError(err, locale, t("connection")));
      });
  }, [authenticated, locale, router, t]);

  return (
    <section className="page-section narrow">
      <p className="eyebrow">{t("account")}</p>
      <h1>{t("orders")}</h1>
      <AccountShell>
      {error && <p className="form-error">{error}</p>}
      {!orders && !error && (
        <div className="loading">{t("loading")}</div>
      )}
      {orders && !orders.length && (
        <div className="empty-state">
          <h2>{t("noOrders")}</h2>
          <p>{t("orderHistory")}</p>
          <Link className="button" href="/shop">
            {t("continueShopping")}
          </Link>
        </div>
      )}
      <div className="order-list">
        {orders?.map((order) => (
          <OrderCard order={order} key={order.id} />
        ))}
      </div>
      </AccountShell>
    </section>
  );
}
