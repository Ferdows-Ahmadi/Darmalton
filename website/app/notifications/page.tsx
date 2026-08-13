"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { loginPath } from "@/lib/auth-navigation";
import type { AppNotification, PageResult } from "@/lib/types";

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await apiFetch<PageResult<AppNotification>>("notifications/");
      setItems(data.results);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.push(loginPath("/notifications"));
        return;
      }
      setError(caught instanceof Error ? caught.message : "اعلان‌ها دریافت نشد.");
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function markAll() {
    setBusy(true);
    try {
      await apiFetch("notifications/read-all/", { method: "POST", body: "{}" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "اعلان‌ها به‌روز نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function destination(item: AppNotification) {
    if (!item.read_at) {
      await apiFetch(`notifications/${item.id}/read/`, { method: "POST", body: "{}" });
    }
    return item.order_id ? `/orders/${item.order_id}` : item.prescription_id ? "/prescriptions" : "/shop";
  }

  return <section className="page-section notification-page">
    <header className="notification-heading">
      <div><p className="eyebrow">به‌روزرسانی‌های واقعی حساب</p><h1>اعلان‌ها</h1><p className="muted">تغییر وضعیت نسخه و سفارش شما در این‌جا نگهداری می‌شود.</p></div>
      <button className="secondary" disabled={busy || !items?.some((item) => !item.read_at)} onClick={markAll}>همه خوانده شد</button>
    </header>
    {error && <div className="error-box" role="alert"><p>{error}</p><button onClick={() => void load()}>تلاش دوباره</button></div>}
    {!items && !error && <div className="loading">در حال دریافت اعلان‌ها…</div>}
    {items?.length === 0 && <div className="empty-state"><h2>اعلان تازه‌ای ندارید</h2><p>وقتی وضعیت نسخه یا سفارش تغییر کند، این‌جا نمایش داده می‌شود.</p></div>}
    <div className="notification-list">{items?.map((item) => <Link
      href={item.order_id ? `/orders/${item.order_id}` : item.prescription_id ? "/prescriptions" : "/shop"}
      onClick={async (event) => { event.preventDefault(); router.push(await destination(item)); }}
      className={`notification-card ${item.read_at ? "is-read" : "is-unread"}`}
      key={item.id}
    ><span aria-hidden="true">{item.order_id ? "🚚" : "Rx"}</span><div><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString("fa-AF")}</small></div>{!item.read_at && <i aria-label="خوانده‌نشده"/>}</Link>)}</div>
  </section>;
}
