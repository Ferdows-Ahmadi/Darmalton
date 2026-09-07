"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { loginPath } from "@/lib/auth-navigation";
import { AccountShell } from "@/components/AccountShell";
import { useLocale } from "@/components/LocaleProvider";
import { formatMoney, formatNumber } from "@/lib/locale";
import { orderStatus } from "@/lib/status";
import type { Order } from "@/lib/types";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const query = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const { locale, t } = useLocale();
  const copy = locale === "en"
    ? { unavailable: "Order unavailable", placed: "Order placed successfully. The pharmacy team will now review it.", refresh: "Refresh status", placedOn: "Placed", items: "Order items", cod: "Cash on delivery", address: "Delivery address", placedNote: "Order placed" }
    : locale === "fa-AF"
      ? { unavailable: "سفارش در دسترس نیست", placed: "سفارش با موفقیت ثبت شد. داروخانه اکنون آن را بررسی می‌کند.", refresh: "تازه‌سازی وضعیت", placedOn: "ثبت در", items: "محصولات سفارش", cod: "پرداخت هنگام تحویل", address: "آدرس تحویل", placedNote: "سفارش ثبت شد" }
      : { unavailable: "فرمایش نشته", placed: "فرمایش په بریالیتوب ثبت شو. د درملتون ډله به یې اوس وګوري.", refresh: "حالت تازه کول", placedOn: "ثبت شوی", items: "د فرمایش توکي", cod: "د سپارلو پر مهال نغدې پیسې", address: "د سپارلو پته", placedNote: "فرمایش ثبت شو" };

  const load = useCallback(async function load() {
    try {
      setOrder(await apiFetch<Order>(`orders/${id}/`));
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(loginPath(`/account/orders/${id}`));
      }
      else setError(err instanceof Error ? err.message : t("connection"));
    }
  }, [id, router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <section className="page-section narrow">
        <div className="empty-state error-state">
          <h1>{copy.unavailable}</h1>
          <p>{error}</p>
        </div>
      </section>
    );
  }
  if (!order) {
    return (
      <section className="page-section narrow">
        <div className="loading">{t("loading")}</div>
      </section>
    );
  }

  return (
    <section className="page-section narrow">
      <AccountShell>
      {query.get("placed") && (
        <div className="success-banner">
          {copy.placed}
        </div>
      )}
      <div className="order-title">
        <div>
          <p className="eyebrow" dir="ltr">
            {order.order_number}
          </p>
          <h1>{orderStatus(order.status, locale)}</h1>
          <p>
            {copy.placedOn}{" "}
            {new Date(order.placed_at).toLocaleString(locale, {
              dateStyle: "medium",
              timeStyle: "short"
            })}
          </p>
        </div>
        <button className="secondary" onClick={load}>
          {copy.refresh}
        </button>
      </div>
      <div className="status-timeline">
        {order.status_history.map((item) => (
          <div key={item.id}>
            <span />
            <p>
              <strong>{orderStatus(item.to_status, locale)}</strong>
              <small>
                {new Date(item.created_at).toLocaleString(locale)}{" "}
                {item.note &&
                  `· ${item.note === "Order placed" ? copy.placedNote : item.note}`}
              </small>
            </p>
          </div>
        ))}
      </div>
      <div className="panel">
        <h2>{copy.items}</h2>
        {order.items.map((item) => (
          <div className="summary-row" key={item.id}>
            <span>
              {formatNumber(item.quantity, locale)} × {item.medicine_name}{" "}
              <bdi dir="ltr">{item.strength}</bdi>
            </span>
            <strong>{formatMoney(item.line_total, locale)}</strong>
          </div>
        ))}
        <div className="summary-row total">
          <span>{t("total")} · {copy.cod}</span>
          <strong>{formatMoney(order.grand_total, locale)}</strong>
        </div>
      </div>
      <div className="panel">
        <h2>{copy.address}</h2>
        <p>
          {order.delivery_address.recipient_name} ·{" "}
          <bdi dir="ltr">{order.delivery_address.recipient_phone}</bdi>
        </p>
        <p>
          {order.delivery_address.street_address}،{" "}
          {order.delivery_address.city}، {order.delivery_address.province}
        </p>
      </div>
      </AccountShell>
    </section>
  );
}
