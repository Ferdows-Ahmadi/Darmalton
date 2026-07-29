"use client";

import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { PageResult } from "@/lib/types";

type Transaction = {
  id: string;
  transaction_type: string;
  direction: string;
  quantity: number;
};

export default function StaffReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<PageResult<Transaction>>("operations/inventory-transactions/")
      .then((result) => {
        setTransactions(result.results);
        setTotal(result.count);
      })
      .catch(() => setError("گزارش موجودی در حال حاضر دریافت نشد."));
  }, []);

  const summary = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const item of transactions) {
      grouped[item.transaction_type] =
        (grouped[item.transaction_type] || 0) + item.quantity;
    }
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [transactions]);
  const max = Math.max(1, ...summary.map(([, value]) => value));

  return (
    <section className="staff-page">
      <header className="staff-page-heading">
        <div>
          <span className="staff-eyebrow">تصمیم‌گیری عملیاتی</span>
          <h1>گزارش‌ها</h1>
          <p>خلاصه حرکت‌های ثبت‌شده موجودی؛ ارقام مالی نهایی از سرور می‌آیند.</p>
        </div>
        <button className="staff-primary-action" onClick={() => window.print()}>
          چاپ گزارش
        </button>
      </header>
      <div className="staff-metric-grid report-metrics">
        <article className="staff-metric-card">
          <span>کل رویدادهای دفتر</span>
          <strong>{total.toLocaleString("fa-AF")}</strong>
          <small>حرکت‌های قابل ردیابی</small>
        </article>
        <article className="staff-metric-card">
          <span>نوع حرکت در صفحه</span>
          <strong>{summary.length.toLocaleString("fa-AF")}</strong>
          <small>خرید، فروش، برگشت و تنظیم</small>
        </article>
      </div>
      <article className="staff-panel">
        <div className="staff-panel-heading">
          <div>
            <span className="staff-eyebrow">نمونه اخیر</span>
            <h2>مقدار حرکت بر اساس نوع</h2>
          </div>
        </div>
        {error ? (
          <p className="form-error">{error}</p>
        ) : summary.length ? (
          <div className="staff-bar-chart">
            {summary.map(([label, value]) => (
              <div key={label}>
                <span>{label.replaceAll("_", " ")}</span>
                <i>
                  <b style={{ width: `${(value / max) * 100}%` }} />
                </i>
                <strong>{value.toLocaleString("fa-AF")}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="staff-table-state">داده‌ای برای این گزارش وجود ندارد.</div>
        )}
      </article>
      <p className="staff-report-note">
        این گزارش برای دید عملیاتی است. گزارش حسابداری و مالیات باید از منبع مالی
        تأییدشده تولید شود.
      </p>
    </section>
  );
}
