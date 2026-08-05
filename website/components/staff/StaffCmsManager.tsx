"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import {
  cmsRecordTitle,
  cmsResourceConfigs,
  cmsVisibility,
  cmsVisibilityLabels,
  toApiDateTime,
  toLocalDateTime,
  validateCmsSchedule,
  type CmsRecord,
  type CmsResource
} from "@/lib/staff-cms";
import type { Medicine, PageResult } from "@/lib/types";

type ModalMode = "create" | "edit" | "view";
type MutationAction = "archive" | "toggle" | "delete";
type FieldErrors = Record<string, string[] | string>;

type CmsFormValues = {
  code: string;
  slug: string;
  placement: string;
  level: string;
  title: string;
  title_dari: string;
  body: string;
  body_dari: string;
  summary: string;
  summary_dari: string;
  alt_text: string;
  alt_text_dari: string;
  action_label: string;
  action_label_dari: string;
  action_url: string;
  medicine_id: string;
  label: string;
  label_dari: string;
  display_order: string;
  is_active: boolean;
};

const initialForm: CmsFormValues = {
  code: "",
  slug: "",
  placement: "",
  level: "INFO",
  title: "",
  title_dari: "",
  body: "",
  body_dari: "",
  summary: "",
  summary_dari: "",
  alt_text: "",
  alt_text_dari: "",
  action_label: "",
  action_label_dari: "",
  action_url: "",
  medicine_id: "",
  label: "",
  label_dari: "",
  display_order: "0",
  is_active: true
};

function recordToForm(record: CmsRecord): CmsFormValues {
  return {
    ...initialForm,
    code: record.code || "",
    slug: record.slug || "",
    placement: record.placement || "",
    level: record.level || "INFO",
    title: record.title || "",
    title_dari: record.title_dari || "",
    body: record.body || "",
    body_dari: record.body_dari || "",
    summary: record.summary || "",
    summary_dari: record.summary_dari || "",
    alt_text: record.alt_text || "",
    alt_text_dari: record.alt_text_dari || "",
    action_label: record.action_label || "",
    action_label_dari: record.action_label_dari || "",
    action_url: record.action_url || "",
    medicine_id: record.medicine_id || "",
    label: record.label || "",
    label_dari: record.label_dari || "",
    display_order: String(record.display_order),
    is_active: record.is_active
  };
}

function fieldMessage(errors: FieldErrors, name: string) {
  const value = errors[name];
  return Array.isArray(value) ? value.join(" ") : value || "";
}

function localDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleString("fa-AF");
}

export function StaffCmsManager({ resource }: { resource: CmsResource }) {
  const config = cmsResourceConfigs[resource];
  const [records, setRecords] = useState<CmsRecord[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [status, setStatus] = useState("");
  const [active, setActive] = useState("");
  const [placement, setPlacement] = useState("");
  const [ordering, setOrdering] = useState("display_order");
  const [busy, setBusy] = useState(true);
  const [listError, setListError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selected, setSelected] = useState<CmsRecord | null>(null);
  const [form, setForm] = useState<CmsFormValues>(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishFrom, setPublishFrom] = useState("");
  const [publishUntil, setPublishUntil] = useState("");
  const [pendingMutation, setPendingMutation] = useState<{
    record: CmsRecord;
    action: MutationAction;
  } | null>(null);
  const [medicineQuery, setMedicineQuery] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicineBusy, setMedicineBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setListError("");
    const params = new URLSearchParams({ page: String(page), ordering });
    if (appliedQuery) params.set("search", appliedQuery);
    if (status) params.set("status", status);
    if (active) params.set("is_active", active);
    if (placement) params.set("placement", placement);
    try {
      const payload = await apiFetch<PageResult<CmsRecord>>(`${config.endpoint}?${params}`);
      setRecords(payload.results);
      setCount(payload.count);
      setHasNext(Boolean(payload.next));
      setHasPrevious(Boolean(payload.previous));
    } catch (reason) {
      setListError(
        reason instanceof ApiError
          ? reason.message
          : "اطلاعات CMS دریافت نشد. اتصال را بررسی کنید."
      );
    } finally {
      setBusy(false);
    }
  }, [active, appliedQuery, config.endpoint, ordering, page, placement, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!localPreview) return;
    return () => URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  useEffect(() => {
    if (!modalMode) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        setModalMode(null);
        setSelected(null);
        setFile(null);
        setLocalPreview("");
        setFieldErrors({});
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [modalMode, saving]);

  const selectedImage = useMemo(() => {
    if (localPreview) return localPreview;
    if (!selected?.image_url) return "";
    return `/api/backend/${config.endpoint}${selected.id}/image/`;
  }, [config.endpoint, localPreview, selected]);

  function setValue<K extends keyof CmsFormValues>(key: K, value: CmsFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function openCreate() {
    setSelected(null);
    setForm({
      ...initialForm,
      placement: config.placements[0]?.[0] || ""
    });
    setFile(null);
    setLocalPreview("");
    setFieldErrors({});
    setError("");
    setModalMode("create");
  }

  function openRecord(record: CmsRecord, mode: ModalMode) {
    setSelected(record);
    setForm(recordToForm(record));
    setFile(null);
    setLocalPreview("");
    setFieldErrors({});
    setError("");
    setModalMode(mode);
  }

  function closeModal() {
    if (saving) return;
    setModalMode(null);
    setSelected(null);
    setFile(null);
    setLocalPreview("");
    setFieldErrors({});
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  function handleFile(nextFile?: File) {
    if (!nextFile) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(nextFile.type)) {
      setFieldErrors({ image: "فقط JPEG، PNG یا WebP قابل قبول است." });
      return;
    }
    if (nextFile.size > 5 * 1024 * 1024) {
      setFieldErrors({ image: "حجم تصویر باید ۵ مگابایت یا کمتر باشد." });
      return;
    }
    setFile(nextFile);
    setLocalPreview(URL.createObjectURL(nextFile));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.image;
      return next;
    });
  }

  function formFields() {
    const common = ["display_order", "is_active"];
    if (resource === "banners") {
      return [
        "code", "placement", "title", "title_dari", "body", "body_dari",
        "alt_text", "alt_text_dari", "action_label", "action_label_dari",
        "action_url", ...common
      ];
    }
    if (resource === "announcements") {
      return [
        "level", "placement", "title", "title_dari", "body", "body_dari",
        "action_label", "action_label_dari", "action_url", ...common
      ];
    }
    if (resource === "pages") {
      return [
        "slug", "title", "title_dari", "summary", "summary_dari", "body",
        "body_dari", "alt_text", "alt_text_dari", ...common
      ];
    }
    return ["medicine_id", "placement", "label", "label_dari", ...common];
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      const fields = formFields();
      let body: BodyInit;
      let headers: HeadersInit | undefined;
      if (config.hasImage) {
        const data = new FormData();
        for (const key of fields) data.append(key, String(form[key as keyof CmsFormValues]));
        if (file) data.append("image", file);
        body = data;
      } else {
        body = JSON.stringify(
          Object.fromEntries(fields.map((key) => [key, form[key as keyof CmsFormValues]]))
        );
        headers = { "Content-Type": "application/json" };
      }
      const editing = modalMode === "edit" && selected;
      await apiFetch<CmsRecord>(
        editing ? `${config.endpoint}${selected.id}/` : config.endpoint,
        { method: editing ? "PATCH" : "POST", body, headers }
      );
      setModalMode(null);
      setSelected(null);
      setFile(null);
      setLocalPreview("");
      setFieldErrors({});
      showNotice(`${config.singular} ${editing ? "ویرایش" : "ایجاد"} شد.`);
      await load();
    } catch (reason) {
      if (reason instanceof ApiError) {
        setError(reason.message);
        setFieldErrors(reason.fields);
      } else {
        setError("ذخیره محتوا ناموفق بود. دوباره کوشش کنید.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function mutate(record: CmsRecord, action: MutationAction) {
    setSaving(true);
    setError("");
    try {
      if (action === "archive") {
        await apiFetch(`${config.endpoint}${record.id}/archive/`, { method: "POST" });
      } else if (action === "toggle") {
        await apiFetch(`${config.endpoint}${record.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ is_active: !record.is_active })
        });
      } else {
        await apiFetch(`${config.endpoint}${record.id}/`, { method: "DELETE" });
      }
      showNotice(
        action === "archive" ? "محتوا آرشیف شد." : action === "delete" ? "محتوا حذف شد." : "وضعیت فعالیت تغییر کرد."
      );
      setPendingMutation(null);
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "عملیات انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  function openPublish(record: CmsRecord) {
    setSelected(record);
    setPublishFrom(toLocalDateTime(record.publish_from));
    setPublishUntil(toLocalDateTime(record.publish_until));
    setFieldErrors({});
    setPublishOpen(true);
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const scheduleError = validateCmsSchedule(publishFrom, publishUntil);
    if (scheduleError) {
      setFieldErrors({ publish_until: scheduleError });
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, string | null> = {};
      if (publishFrom) payload.publish_from = toApiDateTime(publishFrom);
      if (publishUntil) payload.publish_until = toApiDateTime(publishUntil);
      await apiFetch(`${config.endpoint}${selected.id}/publish/`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setPublishOpen(false);
      setSelected(null);
      showNotice(publishFrom ? "زمان‌بندی نشر ذخیره شد." : "محتوا منتشر شد.");
      await load();
    } catch (reason) {
      if (reason instanceof ApiError) {
        setError(reason.message);
        setFieldErrors(reason.fields);
      } else {
        setError("نشر محتوا ناموفق بود.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function searchMedicines() {
    setMedicineBusy(true);
    try {
      const params = new URLSearchParams({ ordering: "name" });
      if (medicineQuery.trim()) params.set("search", medicineQuery.trim());
      const payload = await apiFetch<PageResult<Medicine>>(`medicines/?${params}`);
      setMedicines(payload.results);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "فهرست دارو دریافت نشد.");
    } finally {
      setMedicineBusy(false);
    }
  }

  useEffect(() => {
    if (resource === "featured-medicines" && modalMode && modalMode !== "view") {
      void searchMedicines();
    }
    // The initial medicine list is refreshed whenever the editor opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalMode, resource]);

  function search(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setAppliedQuery(query.trim());
  }

  return (
    <section className="staff-page">
      <header className="staff-page-heading">
        <div>
          <span className="staff-eyebrow"><Link href="/staff/cms">مدیریت محتوا</Link> / CMS</span>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <button className="staff-primary-action" onClick={openCreate}>ایجاد {config.singular}</button>
      </header>

      {notice && <div className="staff-cms-notice" role="status">{notice}</div>}
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="staff-toolbar staff-cms-toolbar">
        <form onSubmit={search} role="search">
          <label className="sr-only" htmlFor="cms-search">جستجوی محتوا</label>
          <input id="cms-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در محتوا…" />
          <button>جستجو</button>
        </form>
        <select aria-label="فیلتر وضعیت نشر" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
          <option value="">همه وضعیت‌ها</option>
          <option value="DRAFT">پیش‌نویس</option>
          <option value="PUBLISHED">منتشرشده</option>
          <option value="ARCHIVED">آرشیف‌شده</option>
        </select>
        <select aria-label="فیلتر فعالیت" value={active} onChange={(event) => { setPage(1); setActive(event.target.value); }}>
          <option value="">فعال و غیرفعال</option>
          <option value="true">فقط فعال</option>
          <option value="false">فقط غیرفعال</option>
        </select>
        {config.placements.length > 0 && (
          <select aria-label="فیلتر جایگاه" value={placement} onChange={(event) => { setPage(1); setPlacement(event.target.value); }}>
            <option value="">همه جایگاه‌ها</option>
            {config.placements.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        )}
        <select aria-label="ترتیب محتوا" value={ordering} onChange={(event) => { setPage(1); setOrdering(event.target.value); }}>
          <option value="display_order">ترتیب نمایش</option>
          <option value="-display_order">ترتیب نمایش، نزولی</option>
          <option value="-updated_at">آخرین ویرایش</option>
          <option value="-created_at">تازه‌ترین ایجاد</option>
          <option value="publish_from">زمان آغاز نشر</option>
        </select>
        <button className="staff-refresh" onClick={() => void load()} disabled={busy}>تازه‌سازی</button>
        <span className="staff-result-count">{count.toLocaleString("fa-AF")} مورد</span>
      </div>

      <div className="staff-table-card">
        {busy ? (
          <div className="staff-table-state"><span className="staff-loader" />در حال دریافت محتوا…</div>
        ) : listError && records.length === 0 ? (
          <div className="staff-table-state error"><strong>دریافت اطلاعات ناموفق بود</strong><button onClick={() => void load()}>تلاش دوباره</button></div>
        ) : records.length === 0 ? (
          <div className="staff-table-state"><strong>محتوایی پیدا نشد</strong><span>فیلترها را تغییر دهید یا نخستین {config.singular} را بسازید.</span><button onClick={openCreate}>ایجاد {config.singular}</button></div>
        ) : (
          <div className="staff-table-scroll">
            <table>
              <thead><tr><th>عنوان</th><th>جایگاه / نوع</th><th>نمایش</th><th>ترتیب</th><th>آغاز</th><th>پایان</th><th>عملیات</th></tr></thead>
              <tbody>
                {records.map((record) => {
                  const visibility = cmsVisibility(record);
                  return (
                    <tr key={record.id}>
                      <td><strong>{cmsRecordTitle(record)}</strong><small className="staff-cms-latin">{record.code || record.slug || record.medicine_name || ""}</small></td>
                      <td>{record.placement?.replaceAll("_", " ") || record.level || "—"}</td>
                      <td><span className={`staff-status status-${visibility}`}>{cmsVisibilityLabels[visibility]}</span></td>
                      <td>{record.display_order.toLocaleString("fa-AF")}</td>
                      <td>{localDate(record.publish_from)}</td>
                      <td>{localDate(record.publish_until)}</td>
                      <td>
                        <div className="staff-row-actions">
                          <button onClick={() => openRecord(record, "view")}>جزئیات</button>
                          <button onClick={() => openRecord(record, "edit")}>ویرایش</button>
                          <button onClick={() => openPublish(record)}>نشر</button>
                          <button onClick={() => setPendingMutation({ record, action: "toggle" })}>{record.is_active ? "غیرفعال" : "فعال"}</button>
                          {record.status !== "ARCHIVED" && <button onClick={() => setPendingMutation({ record, action: "archive" })}>آرشیف</button>}
                          <button className="danger" onClick={() => setPendingMutation({ record, action: "delete" })}>حذف</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(hasPrevious || hasNext) && <nav className="staff-pagination" aria-label="صفحه‌بندی محتوا"><button disabled={!hasPrevious || busy} onClick={() => setPage((value) => Math.max(1, value - 1))}>صفحه پیش</button><span>صفحه {page.toLocaleString("fa-AF")}</span><button disabled={!hasNext || busy} onClick={() => setPage((value) => value + 1)}>صفحه بعد</button></nav>}

      {modalMode && (
        <div className="staff-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <section className="staff-modal" role="dialog" aria-modal="true" aria-labelledby="cms-modal-title">
            <header><div><span className="staff-eyebrow">{modalMode === "view" ? "پیش‌نمایش و جزئیات" : modalMode === "edit" ? "ویرایش محتوا" : "محتوای تازه"}</span><h2 id="cms-modal-title">{modalMode === "create" ? `ایجاد ${config.singular}` : selected ? cmsRecordTitle(selected) : config.singular}</h2></div><button aria-label="بستن پنجره" onClick={closeModal} disabled={saving}>×</button></header>
            {modalMode === "view" && selected ? (
              <CmsPreview record={selected} imageUrl={selectedImage} />
            ) : (
              <form className="staff-cms-form" onSubmit={submit}>
                {error && <p className="form-error staff-form-wide" role="alert">{error}</p>}
                {resource === "banners" && <TextField label="کد یکتا" name="code" value={form.code} onChange={(value) => setValue("code", value)} error={fieldMessage(fieldErrors, "code")} required />}
                {resource === "pages" && <TextField label="نام مسیر (slug)" name="slug" value={form.slug} onChange={(value) => setValue("slug", value)} error={fieldMessage(fieldErrors, "slug")} required dir="ltr" />}
                {config.placements.length > 0 && <SelectField label="جایگاه" name="placement" value={form.placement} onChange={(value) => setValue("placement", value)} options={config.placements} error={fieldMessage(fieldErrors, "placement")} />}
                {resource === "announcements" && <SelectField label="نوع اطلاعیه" name="level" value={form.level} onChange={(value) => setValue("level", value)} options={[["INFO", "معلومات"], ["SUCCESS", "موفقیت"], ["WARNING", "هشدار"], ["CRITICAL", "بحرانی"]]} error={fieldMessage(fieldErrors, "level")} />}
                {resource !== "featured-medicines" && <><TextField label="عنوان دری" name="title_dari" value={form.title_dari} onChange={(value) => setValue("title_dari", value)} error={fieldMessage(fieldErrors, "title_dari")} required /><TextField label="عنوان انگلیسی" name="title" value={form.title} onChange={(value) => setValue("title", value)} error={fieldMessage(fieldErrors, "title")} dir="ltr" /></>}
                {resource === "pages" && <><TextArea label="خلاصه دری" name="summary_dari" value={form.summary_dari} onChange={(value) => setValue("summary_dari", value)} error={fieldMessage(fieldErrors, "summary_dari")} /><TextArea label="خلاصه انگلیسی" name="summary" value={form.summary} onChange={(value) => setValue("summary", value)} error={fieldMessage(fieldErrors, "summary")} dir="ltr" /></>}
                {(resource === "banners" || resource === "announcements" || resource === "pages") && <><TextArea label="محتوای دری" name="body_dari" value={form.body_dari} onChange={(value) => setValue("body_dari", value)} error={fieldMessage(fieldErrors, "body_dari")} required={resource !== "banners"} /><TextArea label="محتوای انگلیسی" name="body" value={form.body} onChange={(value) => setValue("body", value)} error={fieldMessage(fieldErrors, "body")} dir="ltr" /></>}
                {(resource === "banners" || resource === "announcements") && <><TextField label="متن دکمه دری" name="action_label_dari" value={form.action_label_dari} onChange={(value) => setValue("action_label_dari", value)} error={fieldMessage(fieldErrors, "action_label_dari")} /><TextField label="متن دکمه انگلیسی" name="action_label" value={form.action_label} onChange={(value) => setValue("action_label", value)} error={fieldMessage(fieldErrors, "action_label")} dir="ltr" /><TextField label="پیوند دکمه" name="action_url" value={form.action_url} onChange={(value) => setValue("action_url", value)} error={fieldMessage(fieldErrors, "action_url")} dir="ltr" /></>}
                {config.hasImage && <><TextField label="توضیح تصویر دری" name="alt_text_dari" value={form.alt_text_dari} onChange={(value) => setValue("alt_text_dari", value)} error={fieldMessage(fieldErrors, "alt_text_dari")} required={config.imageRequired} /><TextField label="توضیح تصویر انگلیسی" name="alt_text" value={form.alt_text} onChange={(value) => setValue("alt_text", value)} error={fieldMessage(fieldErrors, "alt_text")} dir="ltr" /><label className="staff-cms-file staff-form-wide"><span>تصویر {modalMode === "edit" ? "جایگزین" : ""}</span><input type="file" accept="image/jpeg,image/png,image/webp" required={config.imageRequired && modalMode === "create"} onChange={(event) => handleFile(event.target.files?.[0])} /><small>JPEG، PNG یا WebP؛ حداکثر ۵ مگابایت</small>{fieldMessage(fieldErrors, "image") && <em>{fieldMessage(fieldErrors, "image")}</em>}</label>{selectedImage && <Image className="staff-cms-form-preview staff-form-wide" src={selectedImage} alt="پیش‌نمایش تصویر محتوا" width={720} height={320} unoptimized />}</>}
                {resource === "featured-medicines" && <div className="staff-medicine-picker staff-form-wide"><label htmlFor="medicine-search">جستجوی دارو</label><div><input id="medicine-search" value={medicineQuery} onChange={(event) => setMedicineQuery(event.target.value)} placeholder="نام، SKU یا ماده فعال…" /><button type="button" onClick={() => void searchMedicines()} disabled={medicineBusy}>{medicineBusy ? "…" : "جستجو"}</button></div><label htmlFor="medicine_id">انتخاب دارو</label><select id="medicine_id" value={form.medicine_id} onChange={(event) => setValue("medicine_id", event.target.value)} required><option value="">یک دارو را انتخاب کنید</option>{selected?.medicine_id && !medicines.some((item) => item.id === selected.medicine_id) && <option value={selected.medicine_id}>{selected.medicine_name_dari || selected.medicine_name}</option>}{medicines.map((medicine) => <option value={medicine.id} key={medicine.id}>{medicine.brand_name_dari || medicine.brand_name} — {medicine.sku}</option>)}</select>{fieldMessage(fieldErrors, "medicine_id") && <em>{fieldMessage(fieldErrors, "medicine_id")}</em>}</div>}
                {resource === "featured-medicines" && <><TextField label="برچسب دری" name="label_dari" value={form.label_dari} onChange={(value) => setValue("label_dari", value)} error={fieldMessage(fieldErrors, "label_dari")} /><TextField label="برچسب انگلیسی" name="label" value={form.label} onChange={(value) => setValue("label", value)} error={fieldMessage(fieldErrors, "label")} dir="ltr" /></>}
                <TextField label="ترتیب نمایش" name="display_order" type="number" min="0" value={form.display_order} onChange={(value) => setValue("display_order", value)} error={fieldMessage(fieldErrors, "display_order")} required />
                <label className="staff-cms-checkbox"><input type="checkbox" checked={form.is_active} onChange={(event) => setValue("is_active", event.target.checked)} /><span><strong>فعال باشد</strong><small>غیرفعال‌کردن، نمایش عمومی را متوقف می‌کند.</small></span></label>
                <footer className="staff-modal-actions staff-form-wide"><button type="button" onClick={closeModal} disabled={saving}>انصراف</button><button className="staff-primary-action" disabled={saving}>{saving ? "در حال ذخیره…" : modalMode === "edit" ? "ذخیره تغییرات" : "ذخیره پیش‌نویس"}</button></footer>
              </form>
            )}
          </section>
        </div>
      )}

      {publishOpen && selected && <div className="staff-modal-backdrop"><section className="staff-modal staff-publish-modal" role="dialog" aria-modal="true" aria-labelledby="publish-title"><header><div><span className="staff-eyebrow">کنترل نشر</span><h2 id="publish-title">نشر {cmsRecordTitle(selected)}</h2></div><button aria-label="بستن پنجره" onClick={() => setPublishOpen(false)} disabled={saving}>×</button></header><form className="staff-cms-form" onSubmit={publish}><label><span>زمان آغاز (خالی یعنی اکنون)</span><input type="datetime-local" value={publishFrom} onChange={(event) => setPublishFrom(event.target.value)} /></label><label><span>زمان پایان (اختیاری)</span><input type="datetime-local" value={publishUntil} onChange={(event) => setPublishUntil(event.target.value)} />{fieldMessage(fieldErrors, "publish_until") && <em>{fieldMessage(fieldErrors, "publish_until")}</em>}</label>{error && <p className="form-error staff-form-wide" role="alert">{error}</p>}<footer className="staff-modal-actions staff-form-wide"><button type="button" onClick={() => setPublishOpen(false)} disabled={saving}>انصراف</button><button className="staff-primary-action" disabled={saving}>{saving ? "در حال نشر…" : "تأیید نشر"}</button></footer></form></section></div>}

      {pendingMutation && <div className="staff-modal-backdrop"><section className="staff-modal staff-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="mutation-title" aria-describedby="mutation-description"><header><div><span className="staff-eyebrow">تأیید عملیات</span><h2 id="mutation-title">{pendingMutation.action === "delete" ? "حذف محتوا" : pendingMutation.action === "archive" ? "آرشیف محتوا" : pendingMutation.record.is_active ? "غیرفعال‌کردن محتوا" : "فعال‌کردن محتوا"}</h2></div><button aria-label="بستن پنجره" onClick={() => setPendingMutation(null)} disabled={saving}>×</button></header><div className="staff-confirm-copy"><strong>{cmsRecordTitle(pendingMutation.record)}</strong><p id="mutation-description">{pendingMutation.action === "delete" ? "این محتوا برای همیشه حذف می‌شود و این کار قابل برگشت نیست." : pendingMutation.action === "archive" ? "این محتوا آرشیف می‌شود و از نمایش عمومی بیرون می‌گردد." : pendingMutation.record.is_active ? "این محتوا غیرفعال می‌شود و نمایش عمومی آن متوقف می‌گردد." : "این محتوا دوباره فعال می‌شود."}</p></div><footer className="staff-modal-actions"><button type="button" onClick={() => setPendingMutation(null)} disabled={saving}>انصراف</button><button className={pendingMutation.action === "delete" ? "staff-danger-action" : "staff-primary-action"} onClick={() => void mutate(pendingMutation.record, pendingMutation.action)} disabled={saving}>{saving ? "در حال اجرا…" : "تأیید"}</button></footer></section></div>}
    </section>
  );
}

function CmsPreview({ record, imageUrl }: { record: CmsRecord; imageUrl: string }) {
  const visibility = cmsVisibility(record);
  return <div className="staff-cms-preview">{imageUrl && <Image src={imageUrl} alt={record.alt_text_dari || record.alt_text || "تصویر محتوا"} width={760} height={360} unoptimized />}<div className="staff-cms-preview-copy"><span className={`staff-status status-${visibility}`}>{cmsVisibilityLabels[visibility]}</span><h3>{cmsRecordTitle(record)}</h3>{record.title && <p dir="ltr">{record.title}</p>}<p>{record.body_dari || record.summary_dari || record.label_dari || "محتوای متنی ندارد."}</p>{(record.body || record.summary || record.label) && <p dir="ltr">{record.body || record.summary || record.label}</p>}{record.action_url && <a href={record.action_url} target={record.action_url.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{record.action_label_dari || record.action_label || "بازکردن پیوند"}</a>}</div><dl><div><dt>جایگاه</dt><dd>{record.placement?.replaceAll("_", " ") || "—"}</dd></div><div><dt>ترتیب</dt><dd>{record.display_order}</dd></div><div><dt>آغاز نشر</dt><dd>{localDate(record.publish_from)}</dd></div><div><dt>پایان نشر</dt><dd>{localDate(record.publish_until)}</dd></div><div><dt>آخرین ویرایش</dt><dd>{localDate(record.updated_at)}</dd></div><div><dt>ویرایش‌کننده</dt><dd>{record.updated_by_email || "—"}</dd></div></dl></div>;
}

function TextField({ label, name, value, onChange, error, dir, type = "text", required, min }: { label: string; name: string; value: string; onChange: (value: string) => void; error?: string; dir?: "ltr" | "rtl"; type?: string; required?: boolean; min?: string }) {
  return <label><span>{label}{required && " *"}</span><input name={name} type={type} min={min} value={value} onChange={(event) => onChange(event.target.value)} dir={dir} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} />{error && <em id={`${name}-error`}>{error}</em>}</label>;
}

function TextArea({ label, name, value, onChange, error, dir, required }: { label: string; name: string; value: string; onChange: (value: string) => void; error?: string; dir?: "ltr" | "rtl"; required?: boolean }) {
  return <label className="staff-form-wide"><span>{label}{required && " *"}</span><textarea name={name} value={value} onChange={(event) => onChange(event.target.value)} dir={dir} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} />{error && <em id={`${name}-error`}>{error}</em>}</label>;
}

function SelectField({ label, name, value, onChange, options, error }: { label: string; name: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[]; error?: string }) {
  return <label><span>{label}</span><select name={name} value={value} onChange={(event) => onChange(event.target.value)} required aria-invalid={Boolean(error)}>{options.map(([option, optionLabel]) => <option value={option} key={option}>{optionLabel}</option>)}</select>{error && <em>{error}</em>}</label>;
}
