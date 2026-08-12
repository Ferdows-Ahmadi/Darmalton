"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { ApiError, apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";

type ImportMode = "CREATE_NEW" | "UPDATE_EXISTING" | "SKIP_EXISTING";
type ImportError = { sheet: string; row: number; field: string; message: string };
type ImportSummary = {
  medicine_rows: number;
  new_medicines: number;
  updated_medicines: number;
  skipped_medicines: number;
  batch_rows: number;
  new_batches: number;
  duplicate_batches: number;
  error_count: number;
};
type ImportJob = {
  id: string;
  original_filename: string;
  mode: ImportMode;
  status: "PREVIEWED" | "COMPLETED" | "FAILED";
  validation_report: { summary: ImportSummary; errors: ImportError[] };
  result_report: Record<string, number>;
  uploaded_by_email: string;
  confirmed_at: string | null;
  created_at: string;
};

const modeCopy: Record<ImportMode, { label: string; detail: string }> = {
  CREATE_NEW: {
    label: "فقط ایجاد داروی تازه",
    detail: "حالت امن پیش‌فرض؛ SKU موجود خطا می‌دهد و هیچ رکوردی بازنویسی نمی‌شود."
  },
  UPDATE_EXISTING: {
    label: "به‌روزرسانی مشخصات موجود",
    detail: "مشخصات داروی دارای SKU یکسان به‌روزرسانی می‌شود؛ موجودی هرگز بازنویسی نمی‌شود."
  },
  SKIP_EXISTING: {
    label: "ردکردن داروی موجود",
    detail: "داروی دارای SKU یکسان نادیده گرفته می‌شود و تنها موارد تازه آماده ورود می‌گردد."
  }
};

function message(error: unknown) {
  if (error instanceof ApiError) {
    const fields = Object.values(error.fields).flat().join(" ");
    return fields || error.message;
  }
  return error instanceof Error ? error.message : "درخواست انجام نشد. دوباره کوشش کنید.";
}

export function StaffMedicineImport() {
  const [viewer, setViewer] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ImportMode>("CREATE_NEW");
  const [job, setJob] = useState<ImportJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    apiFetch<User>("auth/me/")
      .then(setViewer)
      .catch((caught) => setError(message(caught)))
      .finally(() => setChecking(false));
  }, []);

  const errorsBySheet = useMemo(() => {
    const grouped = new Map<string, ImportError[]>();
    for (const item of job?.validation_report.errors || []) {
      grouped.set(item.sheet, [...(grouped.get(item.sheet) || []), item]);
    }
    return [...grouped.entries()];
  }, [job]);

  function selectFile(selected: File | null) {
    setError("");
    setJob(null);
    if (!selected) {
      setFile(null);
      return;
    }
    const suffix = selected.name.toLowerCase();
    if (!suffix.endsWith(".xlsx") && !suffix.endsWith(".csv")) {
      setError("تنها فایل XLSX یا CSV با UTF-8 پذیرفته می‌شود.");
      setFile(null);
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("حجم فایل باید ۱۰ مگابایت یا کمتر باشد.");
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function preview(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("نخست فایل را انتخاب کنید.");
      return;
    }
    setBusy(true);
    setError("");
    setJob(null);
    const body = new FormData();
    body.append("file", file);
    body.append("mode", mode);
    try {
      setJob(
        await apiFetch<ImportJob>("staff/medicine-imports/preview/", {
          method: "POST",
          body
        })
      );
    } catch (caught) {
      setError(message(caught));
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!job) return;
    setBusy(true);
    setError("");
    try {
      const updated = await apiFetch<ImportJob>(
        `staff/medicine-imports/${job.id}/confirm/`,
        { method: "POST", body: JSON.stringify({}) }
      );
      setJob(updated);
      setConfirmOpen(false);
    } catch (caught) {
      setError(message(caught));
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return <main className="staff-page"><div className="staff-table-state" role="status"><span className="staff-loader" />در حال بررسی دسترسی…</div></main>;
  }
  if (viewer?.role !== "ADMIN") {
    return <main className="staff-page"><header className="staff-page-heading"><div><span className="staff-eyebrow">کاتالوگ</span><h1>ورود گروهی</h1></div></header><section className="staff-access-denied"><strong>دسترسی محدود</strong><p>تنها مدیر سیستم می‌تواند فایل دارو و موجودی را پیش‌نمایش یا تأیید کند.</p></section></main>;
  }

  const summary = job?.validation_report.summary;
  const canConfirm = job?.status === "PREVIEWED" && summary?.error_count === 0;

  return (
    <main className="staff-page staff-import-page">
      <header className="staff-page-heading">
        <div>
          <span className="staff-eyebrow">کاتالوگ و موجودی</span>
          <h1>ورود گروهی دارو</h1>
          <p>فایل را نخست بدون تغییر پایگاه داده بررسی کنید؛ ورود تنها پس از تأیید صریح و به‌صورت تراکنشی انجام می‌شود.</p>
        </div>
        <Link className="staff-primary-action" href="/api/backend/staff/medicine-imports/template/" prefetch={false}>دریافت قالب XLSX</Link>
      </header>

      <section className="staff-panel staff-import-guidance">
        <h2>ساختار پذیرفته‌شده</h2>
        <p>فایل XLSX باید دو برگه دقیق «Medicines» و «Stock - Batches» داشته باشد. CSV فقط برگه داروها را وارد می‌کند. تاریخ‌ها YYYY-MM-DD و پاسخ‌ها Yes/No باشند.</p>
        <p>بچ تازه با وضعیت «در انتظار بررسی» و غیرفعال ساخته می‌شود؛ مقدار آن فقط از مسیر دفتر تغییرناپذیر موجودی افزوده می‌گردد. بچ تکراری نادیده گرفته می‌شود.</p>
      </section>

      <form className="staff-panel staff-import-form" onSubmit={preview}>
        <label>
          <span>روش برخورد با SKU موجود</span>
          <select value={mode} onChange={(event) => { setMode(event.target.value as ImportMode); setJob(null); }}>
            {(Object.keys(modeCopy) as ImportMode[]).map((value) => <option key={value} value={value}>{modeCopy[value].label}</option>)}
          </select>
          <small>{modeCopy[mode].detail}</small>
        </label>
        <label>
          <span>فایل XLSX یا CSV (حداکثر ۱۰ MB)</span>
          <input type="file" accept=".xlsx,.csv" onChange={(event) => selectFile(event.target.files?.[0] || null)} />
          <small>{file ? <bdi dir="ltr">{file.name}</bdi> : "فایلی انتخاب نشده است."}</small>
        </label>
        <button className="staff-primary-action" disabled={busy || !file}>{busy ? "در حال بررسی…" : "بررسی و پیش‌نمایش"}</button>
      </form>

      {error && <p className="form-error" role="alert">{error}</p>}

      {job && summary && (
        <section className="staff-import-preview" aria-live="polite">
          <header className="staff-panel-heading">
            <div><span className="staff-eyebrow">نتیجه بررسی</span><h2><bdi dir="ltr">{job.original_filename}</bdi></h2></div>
            <span className={`status-pill status-${job.status}`}>{job.status === "COMPLETED" ? "تکمیل‌شده" : summary.error_count ? "نیازمند اصلاح" : "آماده تأیید"}</span>
          </header>
          <div className="staff-metric-grid staff-import-metrics">
            <article className="staff-metric-card"><span>داروی تازه</span><strong>{summary.new_medicines.toLocaleString("fa-AF")}</strong></article>
            <article className="staff-metric-card"><span>به‌روزرسانی</span><strong>{summary.updated_medicines.toLocaleString("fa-AF")}</strong></article>
            <article className="staff-metric-card"><span>داروی ردشده</span><strong>{summary.skipped_medicines.toLocaleString("fa-AF")}</strong></article>
            <article className="staff-metric-card"><span>بچ تازه</span><strong>{summary.new_batches.toLocaleString("fa-AF")}</strong></article>
            <article className="staff-metric-card"><span>بچ تکراری</span><strong>{summary.duplicate_batches.toLocaleString("fa-AF")}</strong></article>
            <article className="staff-metric-card"><span>خطا</span><strong>{summary.error_count.toLocaleString("fa-AF")}</strong></article>
          </div>

          {errorsBySheet.map(([sheet, errors]) => (
            <section className="staff-table-card" key={sheet}>
              <div className="staff-import-sheet-title"><strong>{sheet}</strong><span>{errors.length.toLocaleString("fa-AF")} خطا</span></div>
              <div className="staff-table-scroll"><table><thead><tr><th>سطر</th><th>ستون</th><th>پیام</th></tr></thead><tbody>{errors.map((item, index) => <tr key={`${item.row}-${item.field}-${index}`}><td>{item.row.toLocaleString("fa-AF")}</td><td><bdi dir="ltr">{item.field}</bdi></td><td>{item.message}</td></tr>)}</tbody></table></div>
            </section>
          ))}

          {job.status === "COMPLETED" ? (
            <div className="staff-cms-notice" role="status">ورود با موفقیت تکمیل شد. داروها ثبت و بچ‌های تازه برای بررسی کیفیت آماده‌اند.</div>
          ) : canConfirm ? (
            <div className="staff-import-confirm-bar"><p>پیش‌نمایش بدون خطاست. تأیید بعدی تغییرات را یک‌جا ثبت می‌کند.</p><button className="staff-primary-action" onClick={() => setConfirmOpen(true)} disabled={busy}>تأیید و اجرای ورود</button></div>
          ) : (
            <div className="staff-table-state error">فایل را اصلاح و دوباره پیش‌نمایش کنید. تا رفع همه خطاها هیچ تغییری ثبت نمی‌شود.</div>
          )}
        </section>
      )}

      {confirmOpen && job && <div className="staff-modal-backdrop"><section className="staff-modal staff-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="import-confirm-title"><header><div><span className="staff-eyebrow">تأیید نهایی</span><h2 id="import-confirm-title">اجرای ورود گروهی</h2></div><button aria-label="بستن" onClick={() => setConfirmOpen(false)} disabled={busy}>×</button></header><div className="staff-confirm-copy"><strong><bdi dir="ltr">{job.original_filename}</bdi></strong><p>این عملیات داروهای پیش‌نمایش‌شده را ثبت و بچ‌های تازه را از مسیر دفتر موجودی ایجاد می‌کند. موجودی فعلی یا بچ تکراری بازنویسی نمی‌شود.</p>{error && <p className="form-error" role="alert">{error}</p>}</div><footer className="staff-modal-actions"><button onClick={() => setConfirmOpen(false)} disabled={busy}>انصراف</button><button className="staff-primary-action" onClick={() => void confirmImport()} disabled={busy}>{busy ? "در حال ورود…" : "تأیید نهایی"}</button></footer></section></div>}
    </main>
  );
}
