"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import { cmsResourceConfigs, cmsResources, type CmsResource } from "@/lib/staff-cms";
import type { PageResult } from "@/lib/types";

export default function StaffCmsPage() {
  const [counts, setCounts] = useState<Partial<Record<CmsResource, number>>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const results = await Promise.allSettled(
        cmsResources.map(async (resource) => {
          const config = cmsResourceConfigs[resource];
          const payload = await apiFetch<PageResult<unknown>>(config.endpoint);
          return [resource, payload.count] as const;
        })
      );
      const next: Partial<Record<CmsResource, number>> = {};
      for (const result of results) {
        if (result.status === "fulfilled") next[result.value[0]] = result.value[1];
      }
      setCounts(next);
      if (results.every((result) => result.status === "rejected")) {
        const reason = results[0].status === "rejected" ? results[0].reason : null;
        setError(
          reason instanceof ApiError
            ? reason.message
            : "اطلاعات مدیریت محتوا دریافت نشد."
        );
      }
    }
    void load();
  }, []);

  return (
    <section className="staff-page">
      <header className="staff-page-heading">
        <div>
          <span className="staff-eyebrow">نشر و محتوای درملتون</span>
          <h1>مدیریت محتوا</h1>
          <p>
            بنر، اطلاعیه، صفحه معلوماتی، مقاله سلامت و داروهای ویژه را با زمان‌بندی و دسترسی
            امن مدیریت کنید.
          </p>
        </div>
        <span className="staff-live-indicator">● متصل به CMS سرور</span>
      </header>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="staff-cms-overview-grid">
        {cmsResources.map((resource) => {
          const config = cmsResourceConfigs[resource];
          return (
            <Link href={`/staff/cms/${resource}`} className="staff-cms-overview-card" key={resource}>
              <span className="staff-metric-icon" aria-hidden="true">{config.icon}</span>
              <div>
                <h2>{config.title}</h2>
                <p>{config.description}</p>
              </div>
              <strong>{counts[resource]?.toLocaleString("fa-AF") ?? "…"}</strong>
              <small>مدیریت و نشر ←</small>
            </Link>
          );
        })}
      </div>

      <article className="staff-panel staff-cms-guidance">
        <div className="staff-panel-heading">
          <div>
            <span className="staff-eyebrow">چرخه نشر</span>
            <h2>پیش‌نویس تا نشر</h2>
          </div>
        </div>
        <ol>
          <li><strong>پیش‌نویس:</strong> محتوا را بسازید و پیش‌نمایش کنید.</li>
          <li><strong>نشر:</strong> آغاز فوری یا آینده و زمان پایان را تعیین کنید.</li>
          <li><strong>کنترل:</strong> محتوا را موقتاً غیرفعال یا برای همیشه آرشیف کنید.</li>
        </ol>
      </article>
    </section>
  );
}
