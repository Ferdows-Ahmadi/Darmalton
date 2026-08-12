"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch, money } from "@/lib/api";
import { dashboardMetricsForRole, type DashboardMetric } from "@/lib/staff-dashboard";
import type { PageResult, User } from "@/lib/types";

type DashboardOrder = {
  id: string;
  order_number: string;
  customer_email: string;
  status: string;
  grand_total: string;
  placed_at: string;
};

export default function StaffDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const metrics = useMemo(() => dashboardMetricsForRole(user?.role || "STAFF"), [user]);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const profile = await apiFetch<User>("auth/me/");
      setUser(profile);
      const visible = dashboardMetricsForRole(profile.role);
      const results = await Promise.allSettled(
        visible.map(async ([key, , , , endpoint]) => {
          const result = await apiFetch<PageResult<unknown>>(endpoint);
          return [key, result.count] as const;
        })
      );
      const nextCounts: Record<string, number> = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") nextCounts[result.value[0]] = result.value[1];
      });
      setCounts(nextCounts);
      const recent = await apiFetch<PageResult<DashboardOrder>>("staff/orders/?ordering=-placed_at");
      setOrders(recent.results.slice(0, 6));
      if (results.some((result) => result.status === "rejected")) {
        setError("بخشی از شمارنده‌ها در دسترس نبود؛ داده‌های موجود نمایش داده شده‌اند.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "دریافت داشبورد ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return <section className="staff-page staff-dashboard">
    <header className="staff-page-heading"><div><span className="staff-eyebrow">امروز در درملتون</span><h1>چه چیزی نیازمند توجه است؟</h1><p>کارهای عملیاتی واقعی را بر اساس نقش خود ببینید و مستقیماً به صف مربوط بروید.</p></div><button className="staff-dashboard-refresh" onClick={() => void load()} disabled={busy}>{busy ? "در حال تازه‌سازی…" : "تازه‌سازی داده‌ها"}</button></header>
    {error && <div className="staff-dashboard-warning" role="alert"><span>{error}</span><button onClick={() => void load()}>تلاش دوباره</button></div>}
    <div className="staff-metric-grid staff-attention-grid">{metrics.map(([key,label,icon,href]:DashboardMetric)=><Link className="staff-metric-card" href={href} key={key}><span className="staff-metric-icon">{icon}</span><span>{label}</span><strong>{busy?"…":(counts[key]??0).toLocaleString("fa-AF")}</strong><small>{(counts[key]??0)>0?"بازکردن صف کار ←":"مورد تازه‌ای نیست"}</small></Link>)}</div>
    <div className="staff-dashboard-grid"><article className="staff-panel staff-attention"><div className="staff-panel-heading"><div><span className="staff-eyebrow">میان‌برهای عملیاتی</span><h2>مدیریت روزانه</h2></div></div><Link href="/staff/medicines">مدیریت دارو و تصاویر</Link><Link href="/staff/categories">مدیریت دسته‌بندی‌ها</Link>{user?.role==="ADMIN"&&<Link href="/staff/users">مدیریت کاربران و کارکنان</Link>}<Link href="/staff/cms">مدیریت محتوای عمومی</Link></article><article className="staff-panel staff-dashboard-principle"><span className="staff-eyebrow">اصل عملیاتی</span><h2>همه کارها در همین پنل</h2><p>نسخه، کاتالوگ، کاربران، موجودی، تدارکات و محتوا از مسیرهای عادی پنل درملتون مدیریت می‌شوند. Django Admin فقط راه اضطراری فنی است و در منوی روزمره نمایش داده نمی‌شود.</p></article></div>
    <article className="staff-panel"><div className="staff-panel-heading"><div><span className="staff-eyebrow">آخرین فعالیت</span><h2>سفارش‌های تازه</h2></div><Link href="/staff/orders">همه سفارش‌ها</Link></div><div className="staff-table-scroll"><table><thead><tr><th>شماره سفارش</th><th>مشتری</th><th>وضعیت</th><th>مبلغ</th><th>زمان</th></tr></thead><tbody>{orders.length?orders.map(order=><tr key={order.id}><td dir="ltr">{order.order_number}</td><td>{order.customer_email}</td><td><span className={`staff-status status-${order.status}`}>{order.status.replaceAll("_"," ")}</span></td><td>{money(order.grand_total)}</td><td>{new Date(order.placed_at).toLocaleDateString("fa-AF")}</td></tr>):<tr><td colSpan={5}>{busy?"در حال دریافت…":"سفارش تازه‌ای برای نمایش وجود ندارد."}</td></tr>}</tbody></table></div></article>
  </section>;
}
