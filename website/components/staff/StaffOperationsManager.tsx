"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import { operationsConfigs, operationsStatusLabel, type OperationsField, type OperationsResource } from "@/lib/staff-operations";
import type { PageResult } from "@/lib/types";

type Value = string | number | boolean | null | undefined;
type Row = Record<string, Value> & { id: string };
type Option = { id: string; label: string };
type FieldErrors = Record<string, string[] | string>;

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "درخواست انجام نشد. دوباره کوشش کنید.";
}

function fieldError(errors: FieldErrors, key: string) {
  const value = errors[key];
  return Array.isArray(value) ? value.join(" ") : value || "";
}

function emptyForm(fields: readonly OperationsField[]) {
  return Object.fromEntries(fields.map((field) => [field.key, field.type === "checkbox" ? field.key === "is_active" : ""]));
}

export function StaffOperationsManager({ resource }: { resource: OperationsResource }) {
  const config = operationsConfigs[resource];
  const fields = config.fields as readonly OperationsField[];
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [active, setActive] = useState("");
  const [verified, setVerified] = useState("");
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [mode, setMode] = useState<"create" | "edit" | "view" | null>(null);
  const [form, setForm] = useState<Record<string, Value>>(() => emptyForm(fields));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [branches, setBranches] = useState<Option[]>([]);
  const [warehouses, setWarehouses] = useState<Option[]>([]);

  const load = useCallback(async () => {
    setBusy(true); setError("");
    const params = new URLSearchParams();
    if (appliedQuery) params.set("search", appliedQuery);
    if (active) params.set("is_active", active);
    if (verified && resource === "suppliers") params.set("is_verified", verified);
    try {
      const payload = await apiFetch<PageResult<Row>>(`${config.endpoint}${params.size ? `?${params}` : ""}`);
      setRows(payload.results); setCount(payload.count);
    } catch (caught) { setError(errorText(caught)); }
    finally { setBusy(false); }
  }, [active, appliedQuery, config.endpoint, resource, verified]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    Promise.all([
      apiFetch<{ id: string; name: string; pharmacy_name: string }[]>("operations/branches/"),
      apiFetch<PageResult<{ id: string; code: string; name: string }>>("operations/warehouses/?ordering=code")
    ]).then(([branchRows, warehouseRows]) => {
      setBranches(branchRows.map((item) => ({ id: item.id, label: `${item.name} — ${item.pharmacy_name}` })));
      setWarehouses(warehouseRows.results.map((item) => ({ id: item.id, label: `${item.code} — ${item.name}` })));
    }).catch(() => undefined);
  }, [resource]);

  function openCreate() {
    setSelected(null); setForm(emptyForm(fields)); setFieldErrors({}); setError(""); setMode("create");
  }

  function open(row: Row, nextMode: "view" | "edit") {
    setSelected(row);
    setForm(Object.fromEntries(fields.map((field) => [field.key, row[field.key] ?? (field.type === "checkbox" ? false : "")])));
    setFieldErrors({}); setError(""); setMode(nextMode);
  }

  function close() { setMode(null); setSelected(null); setFieldErrors({}); setError(""); }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setFieldErrors({});
    const payload = Object.fromEntries(fields.map((field) => {
      const value = form[field.key];
      if (field.type === "number") return [field.key, value === "" ? null : Number(value)];
      if (field.type === "date") return [field.key, value || null];
      return [field.key, value];
    }));
    try {
      await apiFetch(selected ? `${config.endpoint}${selected.id}/` : config.endpoint, {
        method: selected ? "PATCH" : "POST", body: JSON.stringify(payload)
      });
      setNotice(`${config.singular} با موفقیت ذخیره شد.`); close(); await load();
    } catch (caught) {
      if (caught instanceof ApiError) setFieldErrors(caught.fields);
      setError(errorText(caught));
    } finally { setSaving(false); }
  }

  async function toggle(row: Row) {
    if (!window.confirm(`${row.is_active ? "غیرفعال" : "فعال"}‌سازی این ${config.singular} تأیید شود؟`)) return;
    setSaving(true); setError("");
    try {
      await apiFetch(`${config.endpoint}${row.id}/`, { method: "PATCH", body: JSON.stringify({ is_active: !row.is_active }) });
      setNotice("وضعیت با موفقیت تغییر کرد."); await load();
    } catch (caught) { setError(errorText(caught)); }
    finally { setSaving(false); }
  }

  function options(field: OperationsField) {
    return field.optionSource === "branches" ? branches : warehouses;
  }

  return <main className="staff-page staff-operations-page">
    <header className="staff-page-heading"><div><span className="staff-eyebrow">عملیات درملتون</span><h1>{config.title}</h1><p>{config.description}</p></div><button className="staff-primary-action" onClick={openCreate}>ایجاد {config.singular}</button></header>
    {notice && <div className="staff-cms-notice" role="status">{notice}<button aria-label="بستن پیام" onClick={() => setNotice("")}>×</button></div>}
    {error && !mode && <p className="form-error" role="alert">{error}</p>}
    <div className="staff-toolbar staff-operations-toolbar">
      <form role="search" onSubmit={(event) => { event.preventDefault(); setAppliedQuery(query.trim()); }}><input aria-label={`جستجوی ${config.title}`} placeholder={config.search} value={query} onChange={(event) => setQuery(event.target.value)}/><button>جستجو</button></form>
      <select aria-label="فیلتر فعالیت" value={active} onChange={(event) => setActive(event.target.value)}><option value="">همه وضعیت‌ها</option><option value="true">فعال</option><option value="false">غیرفعال</option></select>
      {resource === "suppliers" && <select aria-label="فیلتر تأیید" value={verified} onChange={(event) => setVerified(event.target.value)}><option value="">همه اعتبارها</option><option value="true">تأییدشده</option><option value="false">تأییدنشده</option></select>}
      <button className="staff-refresh" onClick={() => void load()} disabled={busy}>تازه‌سازی</button><span>{count.toLocaleString("fa-AF")} مورد</span>
    </div>
    <section className="staff-table-card">{busy ? <div className="staff-table-state"><span className="staff-loader"/>در حال دریافت اطلاعات…</div> : error ? <div className="staff-table-state error"><strong>دریافت اطلاعات ناموفق بود</strong><span>{error}</span><button onClick={() => void load()}>تلاش دوباره</button></div> : !rows.length ? <div className="staff-table-state"><strong>موردی پیدا نشد</strong><span>فیلترها را تغییر دهید یا نخستین مورد را ایجاد کنید.</span></div> : <div className="staff-table-scroll"><table><thead><tr>{config.columns.map(([, label]) => <th key={label}>{label}</th>)}<th>عملیات</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{config.columns.map(([key]) => <td key={key} className={typeof row[key] === "boolean" ? `status-${row[key] ? "ACTIVE" : "INACTIVE"}` : ""}>{operationsStatusLabel(row[key])}</td>)}<td><div className="staff-row-actions"><button onClick={() => open(row, "view")}>مشاهده</button><button onClick={() => open(row, "edit")}>ویرایش</button><button disabled={saving} onClick={() => void toggle(row)}>{row.is_active ? "غیرفعال" : "فعال"}</button></div></td></tr>)}</tbody></table></div>}</section>
    {mode && <div className="staff-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="staff-modal" role="dialog" aria-modal="true" aria-labelledby="operations-modal-title"><header><div><span>{mode === "view" ? "جزئیات" : mode === "edit" ? "ویرایش" : "ایجاد"}</span><h2 id="operations-modal-title">{config.singular}</h2></div><button aria-label="بستن" onClick={close}>×</button></header>{mode === "view" ? <div className="staff-cms-preview"><dl>{fields.map((field) => <div key={field.key}><dt>{field.label}</dt><dd>{operationsStatusLabel(selected?.[field.key])}</dd></div>)}</dl><div className="staff-modal-actions"><button className="staff-primary-action" onClick={() => selected && open(selected, "edit")}>ویرایش</button></div></div> : <form className="staff-cms-form" onSubmit={save}>{fields.map((field) => <label key={field.key} className={field.type === "textarea" ? "staff-form-wide" : field.type === "checkbox" ? "staff-cms-checkbox" : ""}>{field.type === "checkbox" ? <><input type="checkbox" checked={Boolean(form[field.key])} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.checked }))}/><span>{field.label}</span></> : <><span>{field.label}{field.required ? " *" : ""}</span>{field.type === "textarea" ? <textarea required={field.required} value={String(form[field.key] ?? "")} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}/> : field.type === "select" ? <select required={field.required} value={String(form[field.key] ?? "")} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}><option value="">انتخاب کنید</option>{options(field).map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select> : <input required={field.required} type={field.type || "text"} min={field.key === "rating" ? 0 : undefined} max={field.key === "rating" ? 5 : undefined} step={field.key === "rating" ? "0.01" : "1"} dir={field.type === "tel" || field.type === "email" ? "ltr" : undefined} value={String(form[field.key] ?? "")} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}/>} {fieldError(fieldErrors, field.key) && <small className="field-error">{fieldError(fieldErrors, field.key)}</small>}</>}</label>)}{error && <p className="form-error staff-form-wide" role="alert">{error}</p>}<div className="staff-modal-actions staff-form-wide"><button type="button" onClick={close}>انصراف</button><button className="staff-primary-action" disabled={saving}>{saving ? "در حال ذخیره…" : "ذخیره"}</button></div></form>}</section></div>}
  </main>;
}
