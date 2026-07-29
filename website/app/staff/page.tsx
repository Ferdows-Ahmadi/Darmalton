"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch, money } from "@/lib/api";
import type { PageResult } from "@/lib/types";

type DashboardOrder = {
  id: string;
  order_number: string;
  customer_email: string;
  status: string;
  grand_total: string;
  placed_at: string;
};

const metrics = [
  ["orders", "سفارش‌ها", "▤", "/staff/orders"],
  ["prescriptions", "نسخه‌های منتظر", "Rx", "/staff/prescriptions"],
  ["inventory", "بچ‌های موجودی", "▦", "/staff/inventory"],
  ["returns", "درخواست‌های مرجوعی", "↺", "/staff/returns"]
] as const;

export default function StaffDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    async function load() {
      const endpoints = {
        orders: "staff/orders/",
        prescriptions: "staff/prescriptions/?status=SUBMITTED",
        inventory: "operations/inventory-batches/",
        returns: "operations/returns/"
      };
      const entries = await Promise.allSettled(
        Object.entries(endpoints).map(async ([key, endpoint]) => {
          const result = await apiFetch<PageResult<DashboardOrder>>(endpoint);
          return [key, result] as const;
        })
      );
      const nextCounts: Record<string, number> = {};
      for (const entry of entries) {
        if (entry.status === "fulfilled") {
          nextCounts[entry.value[0]] = entry.value[1].count;
          if (entry.value[0] === "orders") {
            setOrders(entry.value[1].results.slice(0, 6));
          }
        }
      }
      setCounts(nextCounts);
      setBusy(false);
    }
    void load();
  }, []);

  const maxCount = Math.max(1, ...Object.values(counts));

  return (
    <section className="staff-page staff-dashboard">
      <header className="staff-page-heading">
        <div>
          <span className="staff-eyebrow">امروز در درملتون</span>
          <h1>نمای کلی عملیات</h1>
          <p>سفارش، نسخه، موجودی و مرجوعی‌های نیازمند توجه را یک‌جا ببینید.</p>
        </div>
        <span className="staff-live-indicator">● داده زنده سرور</span>
      </header>

      <div className="staff-metric-grid">
        {metrics.map(([key, label, icon, href]) => (
          <Link className="staff-metric-card" href={href} key={key}>
            <span className="staff-metric-icon">{icon}</span>
            <span>{label}</span>
            <strong>{busy ? "…" : (counts[key] || 0).toLocaleString("fa-AF")}</strong>
            <small>مشاهده جزئیات ←</small>
          </Link>
        ))}
      </div>

      <div className="staff-dashboard-grid">
        <article className="staff-panel">
          <div className="staff-panel-heading">
            <div>
              <span className="staff-eyebrow">حجم کاری</span>
              <h2>نمای سریع بخش‌ها</h2>
            </div>
            <span>بر اساس شمار رکوردهای فعال</span>
          </div>
          <div className="staff-bar-chart" aria-label="مقایسه حجم کاری بخش‌ها">
            {metrics.map(([key, label]) => (
              <div key={key}>
                <span>{label}</span>
                <i>
                  <b
                    style={{
                      width: `${Math.max(8, ((counts[key] || 0) / maxCount) * 100)}%`
                    }}
                  />
                </i>
                <strong>{counts[key] || 0}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="staff-panel staff-attention">
          <div className="staff-panel-heading">
            <div>
              <span className="staff-eyebrow">اولویت امروز</span>
              <h2>کارهای پیشنهادی</h2>
            </div>
          </div>
          <Link href="/staff/prescriptions">بررسی نسخه‌های تازه</Link>
          <Link href="/staff/inventory">کنترل بچ‌های قرنطین‌شده</Link>
          <Link href="/staff/purchase-orders">پیگیری خریدهای در انتظار</Link>
          <Link href="/staff/returns">رسیدگی به مرجوعی‌ها</Link>
        </article>
      </div>

      <article className="staff-panel">
        <div className="staff-panel-heading">
          <div>
            <span className="staff-eyebrow">آخرین فعالیت</span>
            <h2>سفارش‌های تازه</h2>
          </div>
          <Link href="/staff/orders">همه سفارش‌ها</Link>
        </div>
        <div className="staff-table-scroll">
          <table>
            <thead>
              <tr>
                <th>شماره سفارش</th>
                <th>مشتری</th>
                <th>وضعیت</th>
                <th>مبلغ</th>
                <th>زمان</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td dir="ltr">{order.order_number}</td>
                    <td>{order.customer_email}</td>
                    <td>
                      <span className={`staff-status status-${order.status}`}>
                        {order.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>{money(order.grand_total)}</td>
                    <td>{new Date(order.placed_at).toLocaleDateString("fa-AF")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>سفارش تازه‌ای برای نمایش وجود ندارد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
