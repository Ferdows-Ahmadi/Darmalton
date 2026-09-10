"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { loginPath } from "@/lib/auth-navigation";
import { AccountShell } from "@/components/AccountShell";
import { useAuthenticated } from "@/components/AuthStateProvider";
import { useLocale } from "@/components/LocaleProvider";
import type { AppNotification, PageResult } from "@/lib/types";

export default function NotificationsPage() {
  const authenticated = useAuthenticated();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { locale, t } = useLocale();
  const copy = locale === "en"
    ? { kicker: "Verified account updates", body: "Order and prescription status changes are kept here.", empty: "Updates will appear when an order or prescription status changes.", unread: "Unread" }
    : locale === "fa-AF"
      ? { kicker: "به‌روزرسانی‌های واقعی حساب", body: "تغییر وضعیت نسخه و سفارش شما در این‌جا نگهداری می‌شود.", empty: "وقتی وضعیت نسخه یا سفارش تغییر کند، این‌جا نمایش داده می‌شود.", unread: "خوانده‌نشده" }
      : { kicker: "د حساب تایید شوي تازه معلومات", body: "د فرمایشونو او نسخو د حالت بدلونونه دلته ساتل کېږي.", empty: "د فرمایش یا نسخې حالت چې بدل شي، دلته به ښکاره شي.", unread: "نه دی لوستل شوی" };

  const load = useCallback(async () => {
    if (!authenticated) {
      router.replace(loginPath("/account/notifications"));
      return;
    }
    setError("");
    try {
      const data = await apiFetch<PageResult<AppNotification>>("notifications/");
      setItems(data.results);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.push(loginPath("/account/notifications"));
        return;
      }
      setError(caught instanceof Error ? caught.message : t("connection"));
    }
  }, [authenticated, router, t]);

  useEffect(() => { void load(); }, [load]);

  async function markAll() {
    setBusy(true);
    try {
      await apiFetch("notifications/read-all/", { method: "POST", body: "{}" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("connection"));
    } finally {
      setBusy(false);
    }
  }

  async function destination(item: AppNotification) {
    if (!item.read_at) {
      await apiFetch(`notifications/${item.id}/read/`, { method: "POST", body: "{}" });
    }
    return item.order_id ? `/account/orders/${item.order_id}` : item.prescription_id ? `/account/prescriptions/${item.prescription_id}` : "/shop";
  }

  return <section className="page-section notification-page"><AccountShell>
    <header className="notification-heading">
      <div><p className="eyebrow">{copy.kicker}</p><h1>{t("notifications")}</h1><p className="muted">{copy.body}</p></div>
      <button className="secondary" disabled={busy || !items?.some((item) => !item.read_at)} onClick={markAll}>{t("markAllRead")}</button>
    </header>
    {error && <div className="error-box" role="alert"><p>{error}</p><button onClick={() => void load()}>{t("retry")}</button></div>}
    {!items && !error && <div className="loading">{t("loading")}</div>}
    {items?.length === 0 && <div className="empty-state"><h2>{t("noNotifications")}</h2><p>{copy.empty}</p></div>}
    <div className="notification-list">{items?.map((item) => <Link
      href={item.order_id ? `/account/orders/${item.order_id}` : item.prescription_id ? `/account/prescriptions/${item.prescription_id}` : "/shop"}
      onClick={async (event) => { event.preventDefault(); router.push(await destination(item)); }}
      className={`notification-card ${item.read_at ? "is-read" : "is-unread"}`}
      key={item.id}
    ><span aria-hidden="true">{item.order_id ? "🚚" : "Rx"}</span><div><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString(locale)}</small></div>{!item.read_at && <i aria-label={copy.unread}/>}</Link>)}</div>
  </AccountShell></section>;
}
