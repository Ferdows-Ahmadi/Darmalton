"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { ApiError, apiFetch, money, readableStatus } from "@/lib/api";
import type { Order } from "@/lib/types";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const query = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async function load() {
    try {
      setOrder(await apiFetch<Order>(`orders/${id}/`));
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.push("/login");
      else setError(err instanceof Error ? err.message : "سفارش بار نشد.");
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <section className="page-section narrow">
        <div className="empty-state error-state">
          <h1>سفارش در دسترس نیست</h1>
          <p>{error}</p>
        </div>
      </section>
    );
  }
  if (!order) {
    return (
      <section className="page-section narrow">
        <div className="loading">در حال بارگذاری سفارش...</div>
      </section>
    );
  }

  return (
    <section className="page-section narrow">
      {query.get("placed") && (
        <div className="success-banner">
          <strong>سفارش با موفقیت ثبت شد.</strong> داروخانه اکنون آن را بررسی
          می‌کند.
        </div>
      )}
      <div className="order-title">
        <div>
          <p className="eyebrow" dir="ltr">
            {order.order_number}
          </p>
          <h1>{readableStatus(order.status)}</h1>
          <p>
            ثبت در{" "}
            {new Date(order.placed_at).toLocaleString("fa-AF", {
              dateStyle: "medium",
              timeStyle: "short"
            })}
          </p>
        </div>
        <button className="secondary" onClick={load}>
          تازه‌سازی وضعیت
        </button>
      </div>
      <div className="tracking-placeholder">
        <span aria-hidden="true">⌖</span>
        <div>
          <strong>پیگیری مرحله‌ای سفارش</strong>
          <p>موقعیت زنده پیک در این نسخه پشتیبانی نمی‌شود.</p>
        </div>
      </div>
      <div className="status-timeline">
        {order.status_history.map((item) => (
          <div key={item.id}>
            <span />
            <p>
              <strong>{readableStatus(item.to_status)}</strong>
              <small>
                {new Date(item.created_at).toLocaleString("fa-AF")}{" "}
                {item.note &&
                  `· ${item.note === "Order placed" ? "سفارش ثبت شد" : item.note}`}
              </small>
            </p>
          </div>
        ))}
      </div>
      <div className="panel">
        <h2>محصولات سفارش</h2>
        {order.items.map((item) => (
          <div className="summary-row" key={item.id}>
            <span>
              {item.quantity.toLocaleString("fa-AF")} × {item.medicine_name}{" "}
              <bdi dir="ltr">{item.strength}</bdi>
            </span>
            <strong>{money(item.line_total)}</strong>
          </div>
        ))}
        <div className="summary-row total">
          <span>مجموع · پرداخت هنگام تحویل</span>
          <strong>{money(order.grand_total, order.currency_code)}</strong>
        </div>
      </div>
      <div className="panel">
        <h2>آدرس تحویل</h2>
        <p>
          {order.delivery_address.recipient_name} ·{" "}
          <bdi dir="ltr">{order.delivery_address.recipient_phone}</bdi>
        </p>
        <p>
          {order.delivery_address.street_address}،{" "}
          {order.delivery_address.city}، {order.delivery_address.province}
        </p>
      </div>
    </section>
  );
}
