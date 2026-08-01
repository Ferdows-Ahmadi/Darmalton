"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { ApiError, apiFetch, money } from "@/lib/api";
import type { PageResult } from "@/lib/types";

export type StaffColumn = {
  key: string;
  label: string;
  kind?: "date" | "money" | "status" | "boolean" | "phone";
};

type RecordValue = string | number | boolean | null | undefined;
type StaffRecord = Record<string, RecordValue>;

function displayValue(value: RecordValue, kind?: StaffColumn["kind"]) {
  if (value === null || value === undefined || value === "") return "—";
  if (kind === "money") return money(String(value));
  if (kind === "date") {
    const date = new Date(String(value));
    return Number.isNaN(date.valueOf())
      ? String(value)
      : date.toLocaleDateString("fa-AF");
  }
  if (kind === "boolean") return value ? "بلی" : "نخیر";
  return String(value).replaceAll("_", " ");
}

export function StaffResourcePage({
  title,
  description,
  endpoint,
  columns,
  statusOptions = [],
  actionLabel,
  actionHref
}: {
  title: string;
  description: string;
  endpoint: string;
  columns: StaffColumn[];
  statusOptions?: readonly string[];
  actionLabel?: string;
  actionHref?: string;
}) {
  const [records, setRecords] = useState<StaffRecord[]>([]);
  const [count, setCount] = useState(0);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    const params = new URLSearchParams();
    if (appliedQuery) params.set("search", appliedQuery);
    if (status) params.set("status", status);
    try {
      const payload = await apiFetch<PageResult<StaffRecord>>(
        `${endpoint}${params.size ? `?${params}` : ""}`
      );
      setRecords(payload.results);
      setCount(payload.count);
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "اطلاعات این بخش دریافت نشد. اتصال را بررسی کنید."
      );
    } finally {
      setBusy(false);
    }
  }, [appliedQuery, endpoint, status]);

  useEffect(() => {
    void load();
  }, [load]);

  function search(event: FormEvent) {
    event.preventDefault();
    setAppliedQuery(query.trim());
  }

  return (
    <section className="staff-page">
      <header className="staff-page-heading">
        <div>
          <span className="staff-eyebrow">عملیات درملتون</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actionHref && actionLabel && (
          <a className="staff-primary-action" href={actionHref}>
            {actionLabel}
          </a>
        )}
      </header>

      <div className="staff-toolbar">
        <form onSubmit={search} role="search">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجو در این بخش…"
          />
          <button>جستجو</button>
        </form>
        {statusOptions.length > 0 && (
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">همه وضعیت‌ها</option>
            {statusOptions.map((option) => (
              <option value={option} key={option}>
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        )}
        <button className="staff-refresh" onClick={() => void load()} disabled={busy}>
          تازه‌سازی
        </button>
        <span className="staff-result-count">{count.toLocaleString("fa-AF")} مورد</span>
      </div>

      <div className="staff-table-card">
        {busy ? (
          <div className="staff-table-state">
            <span className="staff-loader" />
            در حال دریافت اطلاعات…
          </div>
        ) : error ? (
          <div className="staff-table-state error">
            <strong>دریافت اطلاعات ناموفق بود</strong>
            <span>{error}</span>
            <button onClick={() => void load()}>تلاش دوباره</button>
          </div>
        ) : records.length === 0 ? (
          <div className="staff-table-state">
            <strong>موردی پیدا نشد</strong>
            <span>فیلترها را تغییر دهید یا نخستین مورد را در سیستم ثبت کنید.</span>
          </div>
        ) : (
          <div className="staff-table-scroll">
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={String(record.id || index)}>
                    {columns.map((column) => (
                      <td key={column.key}>
                        {column.kind === "status" ? (
                          <span className={`staff-status status-${record[column.key]}`}>
                            {displayValue(record[column.key], column.kind)}
                          </span>
                        ) : column.kind === "phone" ? (
                          <bdi dir="ltr">
                            {displayValue(record[column.key], column.kind)}
                          </bdi>
                        ) : (
                          displayValue(record[column.key], column.kind)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
