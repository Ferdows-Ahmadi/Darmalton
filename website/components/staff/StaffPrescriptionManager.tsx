"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import {
  allowedPrescriptionActions,
  isPrescriptionReviewerRole,
  nextPageNumber,
  prescriptionActionLabels,
  prescriptionStatuses,
  prescriptionStatusLabels,
  type PrescriptionAction
} from "@/lib/staff-prescriptions";
import type { Medicine, PageResult, User } from "@/lib/types";

type StaffHistory = {
  id: number;
  from_status: string;
  to_status: string;
  action: string;
  actor_email: string | null;
  customer_visible_note: string;
  internal_staff_note: string;
  created_at: string;
};

type StaffPrescription = {
  id: string;
  customer: string;
  customer_email: string;
  patient_name: string;
  contact_phone: string;
  delivery_preference: string;
  customer_note: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  document_url: string;
  status: string;
  reviewer_email: string | null;
  review_started_at: string | null;
  reviewed_at: string | null;
  clarification_request: string;
  customer_response: string;
  customer_visible_note: string;
  internal_staff_note: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  history: StaffHistory[];
  authorized_medicines: Array<{
    id: string;
    medicine_id: string;
    medicine_name: string;
    max_quantity: number;
    instructions: string;
  }>;
};

type MedicineAuthorization = {
  medicine_id: string;
  medicine_name: string;
  max_quantity: number;
  instructions: string;
};

type ActionForm = {
  customer_visible_note: string;
  internal_staff_note: string;
  clarification_request: string;
  expires_at: string;
};

const emptyActionForm: ActionForm = {
  customer_visible_note: "",
  internal_staff_note: "",
  clarification_request: "",
  expires_at: ""
};

function fieldMessage(fields: ApiError["fields"], name: string) {
  const value = fields[name];
  return Array.isArray(value) ? value.join(" ") : value || "";
}

function dateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString("fa-AF");
}

function formatBytes(value: number) {
  if (!value) return "—";
  return value < 1024 * 1024
    ? `${Math.ceil(value / 1024).toLocaleString("fa-AF")} KB`
    : `${(value / (1024 * 1024)).toLocaleString("fa-AF", { maximumFractionDigits: 1 })} MB`;
}

function defaultExpiry() {
  const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function StaffPrescriptionManager() {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<StaffPrescription[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [previousPage, setPreviousPage] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [status, setStatus] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<StaffPrescription | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<PrescriptionAction | null>(null);
  const [actionForm, setActionForm] = useState<ActionForm>(emptyActionForm);
  const [fieldErrors, setFieldErrors] = useState<ApiError["fields"]>({});
  const [saving, setSaving] = useState(false);
  const [medicineQuery, setMedicineQuery] = useState("");
  const [medicineBusy, setMedicineBusy] = useState(false);
  const [medicineResults, setMedicineResults] = useState<Medicine[]>([]);
  const [authorizations, setAuthorizations] = useState<MedicineAuthorization[]>([]);

  const canReview = isPrescriptionReviewerRole(user?.role || "");

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    const params = new URLSearchParams({ ordering, page: String(page) });
    if (appliedQuery) params.set("search", appliedQuery);
    if (status) params.set("status", status);
    try {
      const [profile, payload] = await Promise.all([
        apiFetch<User>("auth/me/"),
        apiFetch<PageResult<StaffPrescription>>(`staff/prescriptions/?${params}`)
      ]);
      setUser(profile);
      setRecords(payload.results);
      setCount(payload.count);
      setNextPage(nextPageNumber(payload.next));
      setPreviousPage(nextPageNumber(payload.previous));
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "نسخه‌ها دریافت نشد. اتصال را بررسی و دوباره تلاش کنید."
      );
    } finally {
      setBusy(false);
    }
  }, [appliedQuery, ordering, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("status");
    if (requested && prescriptionStatuses.some((value) => value === requested)) setStatus(requested);
  }, []);

  useEffect(() => setPage(1), [appliedQuery, ordering, status]);

  useEffect(() => {
    if (!selected) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        if (pendingAction) setPendingAction(null);
        else setSelected(null);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [pendingAction, saving, selected]);

  async function openDetail(id: string) {
    setDetailBusy(true);
    setError("");
    try {
      setSelected(await apiFetch<StaffPrescription>(`staff/prescriptions/${id}/`));
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "جزئیات نسخه دریافت نشد.");
    } finally {
      setDetailBusy(false);
    }
  }

  function search(event: FormEvent) {
    event.preventDefault();
    setAppliedQuery(query.trim());
  }

  function beginAction(action: PrescriptionAction) {
    setFieldErrors({});
    setError("");
    setActionForm({
      ...emptyActionForm,
      expires_at: action === "approve" ? defaultExpiry() : ""
    });
    setAuthorizations([]);
    setMedicineResults([]);
    setMedicineQuery("");
    setPendingAction(action);
  }

  async function searchMedicines() {
    setMedicineBusy(true);
    setFieldErrors((current) => ({ ...current, authorized_items: "" }));
    try {
      const params = new URLSearchParams({
        prescription_required: "true",
        ordering: "name"
      });
      if (medicineQuery.trim()) params.set("search", medicineQuery.trim());
      const payload = await apiFetch<PageResult<Medicine>>(`medicines/?${params}`);
      setMedicineResults(payload.results);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "جستجوی دارو انجام نشد.");
    } finally {
      setMedicineBusy(false);
    }
  }

  function addMedicine(medicine: Medicine) {
    if (authorizations.some((item) => item.medicine_id === medicine.id)) return;
    setAuthorizations((current) => [
      ...current,
      {
        medicine_id: medicine.id,
        medicine_name: medicine.brand_name_dari || medicine.brand_name,
        max_quantity: 1,
        instructions: ""
      }
    ]);
  }

  function updateAuthorization(
    medicineId: string,
    key: "max_quantity" | "instructions",
    value: string
  ) {
    setAuthorizations((current) =>
      current.map((item) =>
        item.medicine_id === medicineId
          ? {
              ...item,
              [key]: key === "max_quantity" ? Number(value) : value
            }
          : item
      )
    );
  }

  async function performAction(event: FormEvent) {
    event.preventDefault();
    if (!selected || !pendingAction) return;
    setSaving(true);
    setError("");
    setFieldErrors({});
    const payload: Record<string, unknown> = {
      customer_visible_note: actionForm.customer_visible_note.trim(),
      internal_staff_note: actionForm.internal_staff_note.trim()
    };
    if (pendingAction === "request-clarification") {
      payload.clarification_request = actionForm.clarification_request.trim();
    }
    if (pendingAction === "approve") {
      payload.expires_at = actionForm.expires_at
        ? new Date(actionForm.expires_at).toISOString()
        : "";
      payload.authorized_items = authorizations.map((item) => ({
        medicine_id: item.medicine_id,
        max_quantity: item.max_quantity,
        instructions: item.instructions.trim()
      }));
    }
    try {
      const updated = await apiFetch<StaffPrescription>(
        `staff/prescriptions/${selected.id}/${pendingAction}/`,
        { method: "POST", body: JSON.stringify(payload) }
      );
      setSelected(updated);
      setPendingAction(null);
      setNotice(`${prescriptionActionLabels[pendingAction]} با موفقیت ثبت شد.`);
      await load();
    } catch (reason) {
      if (reason instanceof ApiError) {
        setError(reason.message);
        setFieldErrors(reason.fields);
      } else {
        setError("عملیات انجام نشد. دوباره تلاش کنید.");
      }
    } finally {
      setSaving(false);
    }
  }

  const actions = useMemo(
    () => allowedPrescriptionActions(selected?.status || "", canReview),
    [canReview, selected?.status]
  );

  return (
    <section className="staff-page staff-prescriptions">
      <header className="staff-page-heading">
        <div>
          <span className="staff-eyebrow">عملیات نسخه‌های طبی</span>
          <h1>بررسی نسخه‌ها</h1>
          <p>فایل محافظت‌شده، سابقه، توضیحات و تصمیم داروساز را در یک جریان کامل مدیریت کنید.</p>
        </div>
        <span className="staff-live-indicator">● داده زنده سرور</span>
      </header>

      {notice && <p className="staff-cms-notice" role="status">{notice}</p>}
      {error && !selected && <p className="form-error" role="alert">{error}</p>}

      <div className="staff-toolbar staff-prescription-toolbar">
        <form onSubmit={search} role="search">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="نام مریض، ایمیل یا شماره تماس…"
            aria-label="جستجوی نسخه"
          />
          <button>جستجو</button>
        </form>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="فیلتر وضعیت">
          <option value="">همه وضعیت‌ها</option>
          {prescriptionStatuses.map((value) => (
            <option value={value} key={value}>{prescriptionStatusLabels[value]}</option>
          ))}
        </select>
        <select value={ordering} onChange={(event) => setOrdering(event.target.value)} aria-label="مرتب‌سازی">
          <option value="-created_at">تازه‌ترین</option>
          <option value="created_at">قدیمی‌ترین</option>
          <option value="-updated_at">آخرین تغییر</option>
          <option value="review_started_at">زمان آغاز بررسی</option>
        </select>
        <button className="staff-refresh" onClick={() => void load()} disabled={busy}>تازه‌سازی</button>
        <span className="staff-result-count">{count.toLocaleString("fa-AF")} نسخه</span>
      </div>

      <div className="staff-table-card">
        {busy ? (
          <div className="staff-table-state" role="status"><span className="staff-loader" />در حال دریافت نسخه‌ها…</div>
        ) : error ? (
          <div className="staff-table-state error"><strong>دریافت نسخه‌ها ناموفق بود</strong><span>{error}</span><button onClick={() => void load()}>تلاش دوباره</button></div>
        ) : records.length === 0 ? (
          <div className="staff-table-state"><strong>نسخه‌ای پیدا نشد</strong><span>فیلتر یا عبارت جستجو را تغییر دهید.</span></div>
        ) : (
          <div className="staff-table-scroll">
            <table>
              <thead><tr><th>مریض / مشتری</th><th>فایل</th><th>وضعیت</th><th>بررسی‌کننده</th><th>ارسال</th><th>عملیات</th></tr></thead>
              <tbody>
                {records.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.patient_name || "نام ثبت نشده"}</strong><small className="staff-cms-latin">{item.customer_email}</small></td>
                    <td>{item.content_type === "application/pdf" ? "PDF" : "تصویر"}<small className="staff-cms-latin">{item.original_filename}</small></td>
                    <td><span className={`staff-status status-${item.status}`}>{prescriptionStatusLabels[item.status as keyof typeof prescriptionStatusLabels] || item.status}</span></td>
                    <td>{item.reviewer_email || "تخصیص نشده"}</td>
                    <td>{dateTime(item.created_at)}</td>
                    <td><button className="staff-table-action" onClick={() => void openDetail(item.id)} disabled={detailBusy}>مشاهده و بررسی</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(previousPage || nextPage) && (
        <div className="staff-pagination">
          <button disabled={!previousPage || busy} onClick={() => previousPage && setPage(previousPage)}>صفحه قبل</button>
          <span>صفحه {page.toLocaleString("fa-AF")}</span>
          <button disabled={!nextPage || busy} onClick={() => nextPage && setPage(nextPage)}>صفحه بعد</button>
        </div>
      )}

      {selected && (
        <div className="staff-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setSelected(null); }}>
          <section className="staff-modal staff-prescription-modal" role="dialog" aria-modal="true" aria-labelledby="prescription-detail-title">
            <header>
              <div><span className="staff-eyebrow">جزئیات و تصمیم داروساز</span><h2 id="prescription-detail-title">نسخه {selected.patient_name || selected.customer_email}</h2></div>
              <button aria-label="بستن پنجره" onClick={() => setSelected(null)} disabled={saving}>×</button>
            </header>
            <div className="staff-prescription-detail">
              <div className="staff-prescription-summary">
                <span className={`staff-status status-${selected.status}`}>{prescriptionStatusLabels[selected.status as keyof typeof prescriptionStatusLabels] || selected.status}</span>
                <bdi dir="ltr">{selected.id}</bdi>
                <span>ارسال: {dateTime(selected.created_at)}</span>
              </div>

              <div className="staff-prescription-grid">
                <article className="staff-prescription-document">
                  <div className="staff-panel-heading"><div><span className="staff-eyebrow">فایل محافظت‌شده</span><h3>{selected.original_filename}</h3></div><a href={`/api/backend/staff/prescriptions/${selected.id}/file/?download=1`}>دانلود</a></div>
                  {selected.content_type === "application/pdf" ? (
                    <object data={`/api/backend/staff/prescriptions/${selected.id}/file/`} type="application/pdf"><a href={`/api/backend/staff/prescriptions/${selected.id}/file/`}>بازکردن فایل PDF</a></object>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/backend/staff/prescriptions/${selected.id}/file/`} alt="نسخه ارسال‌شده مشتری" />
                  )}
                  <small>{selected.content_type || "نوع نامشخص"} · {formatBytes(selected.size_bytes)}</small>
                </article>

                <article className="staff-prescription-facts">
                  <h3>اطلاعات نسخه</h3>
                  <dl>
                    <div><dt>مشتری</dt><dd>{selected.customer_email}</dd></div>
                    <div><dt>نام مریض</dt><dd>{selected.patient_name || "—"}</dd></div>
                    <div><dt>تماس</dt><dd><bdi dir="ltr">{selected.contact_phone || "—"}</bdi></dd></div>
                    <div><dt>ترجیح تحویل</dt><dd>{selected.delivery_preference || "—"}</dd></div>
                    <div><dt>بررسی‌کننده</dt><dd>{selected.reviewer_email || "—"}</dd></div>
                    <div><dt>آغاز بررسی</dt><dd>{dateTime(selected.review_started_at)}</dd></div>
                    <div><dt>پایان بررسی</dt><dd>{dateTime(selected.reviewed_at)}</dd></div>
                    <div><dt>اعتبار تا</dt><dd>{dateTime(selected.expires_at)}</dd></div>
                  </dl>
                  {selected.customer_note && <div className="staff-prescription-note"><strong>یادداشت مشتری</strong><p>{selected.customer_note}</p></div>}
                  {selected.clarification_request && <div className="staff-prescription-note warning"><strong>درخواست توضیح</strong><p>{selected.clarification_request}</p></div>}
                  {selected.customer_response && <div className="staff-prescription-note success"><strong>پاسخ مشتری</strong><p>{selected.customer_response}</p></div>}
                  {selected.internal_staff_note && <div className="staff-prescription-note private"><strong>یادداشت داخلی</strong><p>{selected.internal_staff_note}</p></div>}
                </article>
              </div>

              {selected.authorized_medicines.length > 0 && <article className="staff-prescription-authorized"><h3>داروهای مجاز</h3>{selected.authorized_medicines.map((item) => <div key={item.id}><strong>{item.medicine_name}</strong><span>حداکثر {item.max_quantity.toLocaleString("fa-AF")}</span><p>{item.instructions || "بدون دستور اضافی"}</p></div>)}</article>}

              <article className="staff-prescription-actions">
                <div><h3>عملیات معتبر</h3>{canReview ? <p>فقط عملیات مجاز برای وضعیت فعلی نمایش داده می‌شود.</p> : <p className="form-error">نقش شما اجازه تصمیم‌گیری درباره نسخه را ندارد.</p>}</div>
                <div>{actions.map((action) => <button key={action} className={action === "reject" ? "staff-danger-action" : "staff-primary-action"} onClick={() => beginAction(action)}>{prescriptionActionLabels[action]}</button>)}{canReview && actions.length === 0 && <span>این وضعیت عملیات تازه‌ای برای داروساز ندارد.</span>}</div>
              </article>

              <article className="staff-prescription-history">
                <h3>سابقه کامل</h3>
                {selected.history.length ? <ol>{selected.history.map((item) => <li key={item.id}><span className={`staff-status status-${item.to_status}`}>{prescriptionStatusLabels[item.to_status as keyof typeof prescriptionStatusLabels] || item.to_status}</span><div><strong>{item.action.replaceAll("_", " ")}</strong><small>{dateTime(item.created_at)} · {item.actor_email || "سیستم"}</small>{item.customer_visible_note && <p>{item.customer_visible_note}</p>}{item.internal_staff_note && <p className="private">داخلی: {item.internal_staff_note}</p>}</div></li>)}</ol> : <p>سابقه‌ای ثبت نشده است.</p>}
              </article>
            </div>
          </section>
        </div>
      )}

      {selected && pendingAction && (
        <div className="staff-modal-backdrop staff-action-backdrop">
          <section className="staff-modal staff-action-modal" role="alertdialog" aria-modal="true" aria-labelledby="prescription-action-title">
            <header><div><span className="staff-eyebrow">تأیید عملیات</span><h2 id="prescription-action-title">{prescriptionActionLabels[pendingAction]}</h2></div><button aria-label="بستن پنجره" onClick={() => setPendingAction(null)} disabled={saving}>×</button></header>
            <form className="staff-cms-form" onSubmit={performAction}>
              {pendingAction === "request-clarification" && <label className="staff-form-wide"><span>پیام توضیح برای مشتری *</span><textarea value={actionForm.clarification_request} onChange={(event) => setActionForm((current) => ({ ...current, clarification_request: event.target.value }))} required aria-invalid={Boolean(fieldMessage(fieldErrors, "clarification_request"))} />{fieldMessage(fieldErrors, "clarification_request") && <em>{fieldMessage(fieldErrors, "clarification_request")}</em>}</label>}
              {pendingAction === "approve" && <><label><span>اعتبار نسخه تا *</span><input type="datetime-local" value={actionForm.expires_at} onChange={(event) => setActionForm((current) => ({ ...current, expires_at: event.target.value }))} required aria-invalid={Boolean(fieldMessage(fieldErrors, "expires_at"))} />{fieldMessage(fieldErrors, "expires_at") && <em>{fieldMessage(fieldErrors, "expires_at")}</em>}</label><div className="staff-medicine-picker staff-form-wide"><label htmlFor="prescription-medicine-search">جستجوی داروی نسخه‌ای *</label><div><input id="prescription-medicine-search" value={medicineQuery} onChange={(event) => setMedicineQuery(event.target.value)} placeholder="نام یا SKU…" /><button type="button" onClick={() => void searchMedicines()} disabled={medicineBusy}>{medicineBusy ? "…" : "جستجو"}</button></div>{medicineResults.length > 0 && <div className="staff-prescription-medicine-results">{medicineResults.map((medicine) => <button type="button" key={medicine.id} onClick={() => addMedicine(medicine)} disabled={authorizations.some((item) => item.medicine_id === medicine.id)}>{medicine.brand_name_dari || medicine.brand_name}<small>{medicine.sku}</small></button>)}</div>}{authorizations.map((item) => <div className="staff-authorization-row" key={item.medicine_id}><strong>{item.medicine_name}</strong><label><span>حداکثر تعداد</span><input type="number" min="1" max="100" value={item.max_quantity} onChange={(event) => updateAuthorization(item.medicine_id, "max_quantity", event.target.value)} required /></label><label><span>دستور مصرف</span><input value={item.instructions} onChange={(event) => updateAuthorization(item.medicine_id, "instructions", event.target.value)} /></label><button type="button" className="danger" onClick={() => setAuthorizations((current) => current.filter((entry) => entry.medicine_id !== item.medicine_id))}>حذف</button></div>)}{fieldMessage(fieldErrors, "authorized_items") && <em>{fieldMessage(fieldErrors, "authorized_items")}</em>}</div></>}
              <label className="staff-form-wide"><span>{pendingAction === "reject" ? "دلیل قابل مشاهده برای مشتری *" : "یادداشت قابل مشاهده برای مشتری"}</span><textarea value={actionForm.customer_visible_note} onChange={(event) => setActionForm((current) => ({ ...current, customer_visible_note: event.target.value }))} required={pendingAction === "reject"} aria-invalid={Boolean(fieldMessage(fieldErrors, "customer_visible_note"))} />{fieldMessage(fieldErrors, "customer_visible_note") && <em>{fieldMessage(fieldErrors, "customer_visible_note")}</em>}</label>
              <label className="staff-form-wide"><span>یادداشت داخلی کارکنان</span><textarea value={actionForm.internal_staff_note} onChange={(event) => setActionForm((current) => ({ ...current, internal_staff_note: event.target.value }))} />{fieldMessage(fieldErrors, "internal_staff_note") && <em>{fieldMessage(fieldErrors, "internal_staff_note")}</em>}</label>
              {error && <p className="form-error staff-form-wide" role="alert">{error}</p>}
              <p className="staff-confirm-copy staff-form-wide">این تغییر در سابقه نسخه ثبت می‌شود و مشتری وضعیت تازه را خواهد دید.</p>
              <footer className="staff-modal-actions staff-form-wide"><button type="button" onClick={() => setPendingAction(null)} disabled={saving}>انصراف</button><button className={pendingAction === "reject" ? "staff-danger-action" : "staff-primary-action"} disabled={saving}>{saving ? "در حال ثبت…" : `تأیید ${prescriptionActionLabels[pendingAction]}`}</button></footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
