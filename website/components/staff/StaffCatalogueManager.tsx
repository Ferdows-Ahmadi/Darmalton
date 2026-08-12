"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import {
  apiAssetUrl,
  catalogueConfigs,
  catalogueStatusLabel,
  validateCatalogueImage,
  type CatalogueResource
} from "@/lib/staff-catalogue";
import type { Category, DosageForm, Manufacturer, Medicine, PageResult } from "@/lib/types";

type FieldErrors = Record<string, string[] | string>;
type CategoryForm = { name: string; name_dari: string; slug: string; parent_id: string; display_order: string; status: string };
type MedicineForm = { sku: string; barcode: string; brand_name: string; brand_name_dari: string; generic_name: string; manufacturer_id: string; category_id: string; dosage_form_id: string; strength: string; pack_size: string; description: string; description_dari: string; prescription_required: boolean; status: string };

const emptyCategory: CategoryForm = { name: "", name_dari: "", slug: "", parent_id: "", display_order: "0", status: "ACTIVE" };
const emptyMedicine: MedicineForm = { sku: "", barcode: "", brand_name: "", brand_name_dari: "", generic_name: "", manufacturer_id: "", category_id: "", dosage_form_id: "", strength: "", pack_size: "", description: "", description_dari: "", prescription_required: false, status: "DRAFT" };

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "درخواست انجام نشد. دوباره کوشش کنید.";
}

function fieldMessage(errors: FieldErrors, name: string) {
  const value = errors[name];
  return Array.isArray(value) ? value.join(" ") : value || "";
}

function medicineToForm(item: Medicine): MedicineForm {
  return {
    ...emptyMedicine,
    sku: item.sku,
    barcode: item.barcode || "",
    brand_name: item.brand_name,
    brand_name_dari: item.brand_name_dari,
    generic_name: item.generic_name,
    manufacturer_id: item.manufacturer?.id || "",
    category_id: item.category?.id || "",
    dosage_form_id: item.dosage_form.id,
    strength: item.strength,
    pack_size: item.pack_size,
    description: item.description,
    description_dari: item.description_dari,
    prescription_required: item.prescription_required,
    status: item.status || "DRAFT"
  };
}

function categoryToForm(item: Category): CategoryForm {
  return { name: item.name, name_dari: item.name_dari, slug: item.slug, parent_id: item.parent_id || "", display_order: String(item.display_order || 0), status: item.status || "ACTIVE" };
}

export function StaffCatalogueManager({ resource }: { resource: CatalogueResource }) {
  const config = catalogueConfigs[resource];
  const medicineMode = resource === "medicines";
  const [items, setItems] = useState<(Medicine | Category)[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [status, setStatus] = useState("");
  const [prescription, setPrescription] = useState("");
  const [ordering, setOrdering] = useState(medicineMode ? "brand_name" : "display_order");
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<Medicine | Category | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | "view" | null>(null);
  const [confirm, setConfirm] = useState<{ item: Medicine | Category; action: "toggle" | "delete" } | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);
  const [medicineForm, setMedicineForm] = useState<MedicineForm>(emptyMedicine);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [dosageForms, setDosageForms] = useState<DosageForm[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [imagePrimary, setImagePrimary] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setListError("");
    const params = new URLSearchParams({ page: String(page), ordering });
    if (appliedQuery) params.set("search", appliedQuery);
    if (status) params.set("status", status);
    if (medicineMode && prescription) params.set("prescription_required", prescription);
    try {
      const payload = await apiFetch<PageResult<Medicine | Category>>(`${config.endpoint}?${params}`);
      setItems(payload.results);
      setCount(payload.count);
    } catch (caught) {
      setListError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }, [appliedQuery, config.endpoint, medicineMode, ordering, page, prescription, status]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    Promise.all([
      apiFetch<Category[]>("categories/"),
      apiFetch<Manufacturer[]>("manufacturers/"),
      apiFetch<DosageForm[]>("dosage-forms/")
    ]).then(([categoryRows, makerRows, forms]) => {
      setCategories(categoryRows); setManufacturers(makerRows); setDosageForms(forms);
    }).catch(() => undefined);
  }, []);
  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  const pages = Math.max(1, Math.ceil(count / 20));
  const title = (item: Medicine | Category) => medicineMode ? ((item as Medicine).brand_name_dari || (item as Medicine).brand_name) : ((item as Category).name_dari || (item as Category).name);
  const currentStatus = (item: Medicine | Category) => item.status || "ACTIVE";
  const categoryRows = useMemo(() => categories.filter((row) => row.id !== selected?.id), [categories, selected]);

  function clearModal() {
    setModal(null); setSelected(null); setError(""); setFieldErrors({}); setFile(null); setPreview(""); setImageFile(null); setImageAlt(""); setImagePrimary(false);
  }

  function openCreate() {
    setSelected(null); setCategoryForm(emptyCategory); setMedicineForm(emptyMedicine); setModal("create"); setError(""); setFieldErrors({}); setFile(null); setPreview("");
  }

  function open(item: Medicine | Category, mode: "view" | "edit") {
    setSelected(item); setModal(mode); setError(""); setFieldErrors({}); setFile(null); setPreview("");
    if (medicineMode) setMedicineForm(medicineToForm(item as Medicine));
    else setCategoryForm(categoryToForm(item as Category));
  }

  function selectFile(next: File | undefined) {
    if (!next) return;
    const validation = validateCatalogueImage(next);
    if (validation) { setError(validation); return; }
    setFile(next); setPreview(URL.createObjectURL(next)); setError("");
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setFieldErrors({});
    const path = selected ? `${config.endpoint}${selected.id}/` : config.endpoint;
    try {
      if (medicineMode) {
        const payload = { ...medicineForm, barcode: medicineForm.barcode || null, manufacturer_id: medicineForm.manufacturer_id || null, category_id: medicineForm.category_id || null };
        await apiFetch(path, { method: selected ? "PATCH" : "POST", body: JSON.stringify(payload) });
      } else {
        const body = new FormData();
        Object.entries(categoryForm).forEach(([key, value]) => body.append(key, value));
        if (file) body.append("image", file);
        await apiFetch(path, { method: selected ? "PATCH" : "POST", body });
      }
      setNotice(`${config.singular} با موفقیت ذخیره شد.`); clearModal(); await load();
      if (!medicineMode) setCategories(await apiFetch<Category[]>("categories/"));
    } catch (caught) {
      if (caught instanceof ApiError) setFieldErrors(caught.fields);
      setError(errorText(caught));
    } finally { setSaving(false); }
  }

  async function mutate() {
    if (!confirm) return;
    setSaving(true); setError("");
    try {
      if (confirm.action === "delete") {
        await apiFetch(`${config.endpoint}${confirm.item.id}/`, { method: "DELETE" });
      } else {
        const next = currentStatus(confirm.item) === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        await apiFetch(`${config.endpoint}${confirm.item.id}/`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      }
      setNotice("وضعیت با موفقیت به‌روزرسانی شد."); setConfirm(null); await load();
    } catch (caught) { setError(errorText(caught)); setConfirm(null); }
    finally { setSaving(false); }
  }

  async function uploadMedicineImage(event: FormEvent) {
    event.preventDefault();
    if (!selected || !imageFile) { setError("یک تصویر را انتخاب کنید."); return; }
    const validation = validateCatalogueImage(imageFile);
    if (validation) { setError(validation); return; }
    setSaving(true); setError("");
    const body = new FormData(); body.append("medicine_id", selected.id); body.append("image", imageFile); body.append("alt_text", imageAlt); body.append("is_primary", String(imagePrimary));
    try {
      await apiFetch("medicine-images/", { method: "POST", body });
      const refreshed = await apiFetch<Medicine>(`${config.endpoint}${selected.id}/`);
      setSelected(refreshed); setItems((current) => current.map((item) => item.id === refreshed.id ? refreshed : item));
      setImageFile(null); setImageAlt(""); setImagePrimary(false); setNotice("تصویر دارو بارگذاری شد.");
    } catch (caught) { if (caught instanceof ApiError) setFieldErrors(caught.fields); setError(errorText(caught)); }
    finally { setSaving(false); }
  }

  async function mutateMedicineImage(imageId: string, action: "primary" | "delete") {
    if (!selected) return;
    setSaving(true); setError("");
    try {
      if (action === "delete") await apiFetch(`medicine-images/${imageId}/`, { method: "DELETE" });
      else { const body = new FormData(); body.append("is_primary", "true"); await apiFetch(`medicine-images/${imageId}/`, { method: "PATCH", body }); }
      const refreshed = await apiFetch<Medicine>(`${config.endpoint}${selected.id}/`);
      setSelected(refreshed); setItems((current) => current.map((item) => item.id === refreshed.id ? refreshed : item));
      setNotice(action === "delete" ? "تصویر حذف شد." : "تصویر اصلی تغییر کرد.");
    } catch (caught) { setError(errorText(caught)); } finally { setSaving(false); }
  }

  return <main className="staff-page staff-catalogue-page">
    <header className="staff-page-heading"><div><span>کاتالوگ</span><h1>{config.title}</h1><p>اطلاعات و رسانه‌های کاتالوگ را بدون نیاز به Django Admin مدیریت کنید.</p></div><button className="staff-primary-link" onClick={openCreate}>ایجاد {config.singular}</button></header>
    {notice && <div className="staff-cms-notice" role="status">{notice}<button aria-label="بستن پیام" onClick={() => setNotice("")}>×</button></div>}
    {error && !modal && !confirm && <p className="form-error" role="alert">{error}</p>}
    <div className="staff-toolbar staff-catalogue-toolbar">
      <form onSubmit={(event) => { event.preventDefault(); setPage(1); setAppliedQuery(query.trim()); }}><input aria-label={`جستجوی ${config.title}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام، کد یا عبارت جستجو…"/><button>جستجو</button></form>
      <select aria-label="فیلتر وضعیت" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}><option value="">همه وضعیت‌ها</option>{(medicineMode ? ["DRAFT","ACTIVE","INACTIVE","RECALLED"] : ["ACTIVE","INACTIVE"]).map((value) => <option value={value} key={value}>{catalogueStatusLabel(value)}</option>)}</select>
      {medicineMode && <select aria-label="فیلتر نسخه" value={prescription} onChange={(event) => { setPage(1); setPrescription(event.target.value); }}><option value="">همه داروها</option><option value="true">نسخه‌ای</option><option value="false">بدون نسخه</option></select>}
      <select aria-label="مرتب‌سازی" value={ordering} onChange={(event) => { setPage(1); setOrdering(event.target.value); }}>{medicineMode ? <><option value="brand_name">نام الفبایی</option><option value="-updated_at">تازه‌ترین تغییر</option><option value="sku">کد SKU</option></> : <><option value="display_order">ترتیب نمایش</option><option value="name">نام الفبایی</option><option value="-updated_at">تازه‌ترین تغییر</option></>}</select>
    </div>
    <section className="staff-table-card">
      {busy ? <div className="staff-table-state" role="status"><span className="staff-loader"/>در حال دریافت اطلاعات…</div> : listError ? <div className="staff-table-state error"><strong>دریافت اطلاعات ناموفق بود</strong><span>{listError}</span><button onClick={() => void load()}>تلاش دوباره</button></div> : !items.length ? <div className="staff-table-state"><strong>موردی پیدا نشد</strong><span>فیلترها را تغییر دهید یا نخستین مورد را ایجاد کنید.</span></div> : <div className="staff-table-scroll"><table><thead><tr><th>تصویر</th><th>{medicineMode ? "دارو" : "دسته‌بندی"}</th><th>{medicineMode ? "SKU / نوع" : "نامک / ترتیب"}</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><Image className="staff-catalogue-thumb" src={apiAssetUrl((item as Medicine).image_url)} width={72} height={72} alt={title(item)} unoptimized/></td><td><strong>{title(item)}</strong><small className="staff-cms-latin">{medicineMode ? (item as Medicine).brand_name : (item as Category).name}</small></td><td>{medicineMode ? <><bdi>{(item as Medicine).sku}</bdi><small>{(item as Medicine).prescription_required ? "نسخه‌ای" : "بدون نسخه"}</small></> : <><bdi>{(item as Category).slug}</bdi><small>ترتیب {(item as Category).display_order || 0}</small></>}</td><td><span className={`status-pill status-${currentStatus(item)}`}>{catalogueStatusLabel(currentStatus(item))}</span></td><td><div className="staff-row-actions"><button onClick={() => open(item,"view")}>مشاهده</button><button onClick={() => open(item,"edit")}>ویرایش</button><button onClick={() => setConfirm({item,action:"toggle"})}>{currentStatus(item)==="ACTIVE" ? "غیرفعال" : "فعال"}</button>{!medicineMode && <button className="danger" onClick={() => setConfirm({item,action:"delete"})}>حذف</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
    <div className="staff-pagination"><button disabled={page<=1||busy} onClick={() => setPage((value)=>value-1)}>صفحه قبل</button><span>صفحه {page} از {pages} · {count.toLocaleString("fa-AF")} مورد</span><button disabled={page>=pages||busy} onClick={() => setPage((value)=>value+1)}>صفحه بعد</button></div>
    {modal && <div className="staff-modal-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget&&!saving)clearModal();}}><section className="staff-modal staff-catalogue-modal" role="dialog" aria-modal="true" aria-labelledby="catalogue-modal-title"><header><div><span className="staff-eyebrow">{modal==="create"?"ایجاد":modal==="edit"?"ویرایش":"جزئیات"}</span><h2 id="catalogue-modal-title">{selected ? title(selected) : `${config.singular} تازه`}</h2></div><button aria-label="بستن پنجره" onClick={clearModal} disabled={saving}>×</button></header>
      {modal==="view" && selected ? <div className="staff-catalogue-detail"><Image src={apiAssetUrl((selected as Medicine).image_url)} width={520} height={360} alt={title(selected)} unoptimized/><dl>{Object.entries(medicineMode ? {"نام دری":(selected as Medicine).brand_name_dari,"نام انگلیسی":(selected as Medicine).brand_name,"نام عمومی":(selected as Medicine).generic_name,"قدرت":(selected as Medicine).strength,"بسته":(selected as Medicine).pack_size,"وضعیت":catalogueStatusLabel(selected.status)} : {"نام دری":(selected as Category).name_dari,"نام انگلیسی":(selected as Category).name,"نامک":(selected as Category).slug,"ترتیب":String((selected as Category).display_order||0),"وضعیت":catalogueStatusLabel(selected.status)}).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value||"—"}</dd></div>)}</dl>{medicineMode && <MedicineImages medicine={selected as Medicine} saving={saving} error={error} imageFile={imageFile} setImageFile={setImageFile} imageAlt={imageAlt} setImageAlt={setImageAlt} imagePrimary={imagePrimary} setImagePrimary={setImagePrimary} upload={uploadMedicineImage} mutate={mutateMedicineImage}/>}</div> : <form className="staff-cms-form" onSubmit={save}>{medicineMode ? <MedicineFields value={medicineForm} setValue={setMedicineForm} errors={fieldErrors} categories={categoryRows} manufacturers={manufacturers} dosageForms={dosageForms}/> : <CategoryFields value={categoryForm} setValue={setCategoryForm} errors={fieldErrors} categories={categoryRows} preview={preview || apiAssetUrl((selected as Category | null)?.image_url)} onFile={selectFile}/>} {error && <p className="form-error staff-form-wide" role="alert">{error}</p>}<footer className="staff-modal-actions staff-form-wide"><button type="button" onClick={clearModal} disabled={saving}>انصراف</button><button className="staff-primary-action" disabled={saving}>{saving?"در حال ذخیره…":"ذخیره"}</button></footer></form>}
    </section></div>}
    {confirm && <div className="staff-modal-backdrop"><section className="staff-modal staff-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="catalogue-confirm-title"><header><div><span className="staff-eyebrow">تأیید عملیات</span><h2 id="catalogue-confirm-title">{confirm.action==="delete"?"حذف دسته‌بندی":"تغییر وضعیت"}</h2></div><button onClick={()=>setConfirm(null)} aria-label="بستن">×</button></header><div className="staff-confirm-copy"><strong>{title(confirm.item)}</strong><p>{confirm.action==="delete"?"تنها دسته‌بندی استفاده‌نشده حذف می‌شود؛ در غیر آن سرور از حذف جلوگیری می‌کند.":"نمایش عمومی این مورد متناسب با وضعیت تازه تغییر می‌کند."}</p>{error&&<p className="form-error">{error}</p>}</div><footer className="staff-modal-actions"><button onClick={()=>setConfirm(null)}>انصراف</button><button className={confirm.action==="delete"?"staff-danger-action":"staff-primary-action"} disabled={saving} onClick={()=>void mutate()}>{saving?"در حال اجرا…":"تأیید"}</button></footer></section></div>}
  </main>;
}

function Input({ label, name, value, onChange, error, required=false, dir }: { label:string; name:string; value:string; onChange:(value:string)=>void; error?:string; required?:boolean; dir?:"ltr" }) {
  return <label><span>{label}{required&&" *"}</span><input name={name} value={value} onChange={(event)=>onChange(event.target.value)} required={required} dir={dir} aria-invalid={Boolean(error)}/>{error&&<em>{error}</em>}</label>;
}

function CategoryFields({value,setValue,errors,categories,preview,onFile}:{value:CategoryForm;setValue:(value:CategoryForm)=>void;errors:FieldErrors;categories:Category[];preview:string;onFile:(file?:File)=>void}) {
  const set=(key:keyof CategoryForm,next:string)=>setValue({...value,[key]:next});
  return <><Input label="نام دری" name="name_dari" value={value.name_dari} onChange={(v)=>set("name_dari",v)} error={fieldMessage(errors,"name_dari")}/><Input label="نام انگلیسی / اصلی" name="name" value={value.name} onChange={(v)=>set("name",v)} error={fieldMessage(errors,"name")} required dir="ltr"/><Input label="نامک (slug)" name="slug" value={value.slug} onChange={(v)=>set("slug",v)} error={fieldMessage(errors,"slug")} required dir="ltr"/><label><span>دسته والد</span><select value={value.parent_id} onChange={(e)=>set("parent_id",e.target.value)}><option value="">بدون والد</option>{categories.map((item)=><option value={item.id} key={item.id}>{item.name_dari||item.name}</option>)}</select></label><Input label="ترتیب نمایش" name="display_order" value={value.display_order} onChange={(v)=>set("display_order",v)} error={fieldMessage(errors,"display_order")}/><label><span>وضعیت</span><select value={value.status} onChange={(e)=>set("status",e.target.value)}><option value="ACTIVE">فعال</option><option value="INACTIVE">غیرفعال</option></select></label><label className="staff-cms-file staff-form-wide"><span>تصویر دسته‌بندی</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e)=>onFile(e.target.files?.[0])}/><small>JPEG، PNG یا WebP؛ ۱۲۸ تا ۶۰۰۰ پیکسل؛ حداکثر ۵ مگابایت</small>{fieldMessage(errors,"image")&&<em>{fieldMessage(errors,"image")}</em>}</label>{preview&&<Image className="staff-cms-form-preview staff-form-wide" src={preview} width={720} height={320} alt="پیش‌نمایش دسته‌بندی" unoptimized/>}</>;
}

function MedicineFields({value,setValue,errors,categories,manufacturers,dosageForms}:{value:MedicineForm;setValue:(value:MedicineForm)=>void;errors:FieldErrors;categories:Category[];manufacturers:Manufacturer[];dosageForms:DosageForm[]}) {
  const set=(key:keyof MedicineForm,next:string|boolean)=>setValue({...value,[key]:next});
  return <><Input label="نام دری" name="brand_name_dari" value={value.brand_name_dari} onChange={(v)=>set("brand_name_dari",v)} error={fieldMessage(errors,"brand_name_dari")}/><Input label="نام انگلیسی / اصلی" name="brand_name" value={value.brand_name} onChange={(v)=>set("brand_name",v)} error={fieldMessage(errors,"brand_name")} required dir="ltr"/><Input label="SKU" name="sku" value={value.sku} onChange={(v)=>set("sku",v)} error={fieldMessage(errors,"sku")} required dir="ltr"/><Input label="بارکد" name="barcode" value={value.barcode} onChange={(v)=>set("barcode",v)} error={fieldMessage(errors,"barcode")} dir="ltr"/><Input label="نام عمومی" name="generic_name" value={value.generic_name} onChange={(v)=>set("generic_name",v)} error={fieldMessage(errors,"generic_name")} dir="ltr"/><Input label="قدرت" name="strength" value={value.strength} onChange={(v)=>set("strength",v)} error={fieldMessage(errors,"strength")}/><Input label="اندازه بسته" name="pack_size" value={value.pack_size} onChange={(v)=>set("pack_size",v)} error={fieldMessage(errors,"pack_size")}/><label><span>شرکت سازنده</span><select value={value.manufacturer_id} onChange={(e)=>set("manufacturer_id",e.target.value)}><option value="">انتخاب نشده</option>{manufacturers.map((item)=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label><span>دسته‌بندی</span><select value={value.category_id} onChange={(e)=>set("category_id",e.target.value)}><option value="">انتخاب نشده</option>{categories.map((item)=><option value={item.id} key={item.id}>{item.name_dari||item.name}</option>)}</select></label><label><span>شکل دارویی *</span><select required value={value.dosage_form_id} onChange={(e)=>set("dosage_form_id",e.target.value)} aria-invalid={Boolean(fieldMessage(errors,"dosage_form_id"))}><option value="">انتخاب کنید</option>{dosageForms.map((item)=><option value={item.id} key={item.id}>{item.name_dari||item.name}</option>)}</select>{fieldMessage(errors,"dosage_form_id")&&<em>{fieldMessage(errors,"dosage_form_id")}</em>}</label><label><span>وضعیت</span><select value={value.status} onChange={(e)=>set("status",e.target.value)}>{["DRAFT","ACTIVE","INACTIVE","RECALLED"].map((item)=><option value={item} key={item}>{catalogueStatusLabel(item)}</option>)}</select></label><label className="staff-cms-checkbox"><input type="checkbox" checked={value.prescription_required} onChange={(e)=>set("prescription_required",e.target.checked)}/><span>نیازمند نسخه<small>فقط نسخه تأییدشده اجازه خرید می‌دهد.</small></span></label><label className="staff-form-wide"><span>توضیحات دری</span><textarea value={value.description_dari} onChange={(e)=>set("description_dari",e.target.value)}/></label><label className="staff-form-wide"><span>توضیحات انگلیسی</span><textarea dir="ltr" value={value.description} onChange={(e)=>set("description",e.target.value)}/></label></>;
}

function MedicineImages({medicine,saving,error,imageFile,setImageFile,imageAlt,setImageAlt,imagePrimary,setImagePrimary,upload,mutate}:{medicine:Medicine;saving:boolean;error:string;imageFile:File|null;setImageFile:(file:File|null)=>void;imageAlt:string;setImageAlt:(value:string)=>void;imagePrimary:boolean;setImagePrimary:(value:boolean)=>void;upload:(event:FormEvent)=>void;mutate:(id:string,action:"primary"|"delete")=>void}) {
  return <section className="staff-media-manager"><header><h3>تصاویر دارو</h3><span>{medicine.images.length.toLocaleString("fa-AF")} تصویر</span></header><div className="staff-media-grid">{medicine.images.length ? medicine.images.map((item)=><article key={item.id}><Image src={apiAssetUrl(item.image_url)} width={240} height={180} alt={item.alt_text||medicine.brand_name} unoptimized/><strong>{item.is_primary?"تصویر اصلی":"تصویر اضافی"}</strong><div className="staff-row-actions">{!item.is_primary&&<button onClick={()=>mutate(item.id,"primary")} disabled={saving}>انتخاب اصلی</button>}<button className="danger" onClick={()=>mutate(item.id,"delete")} disabled={saving}>حذف</button></div></article>) : <p>هنوز تصویری ثبت نشده است؛ مشتری fallback استاندارد را می‌بیند.</p>}</div><form className="staff-media-upload" onSubmit={upload}><label><span>تصویر تازه *</span><input type="file" accept="image/jpeg,image/png,image/webp" required={!imageFile} onChange={(e)=>setImageFile(e.target.files?.[0]||null)}/></label><label><span>توضیح تصویر</span><input value={imageAlt} onChange={(e)=>setImageAlt(e.target.value)}/></label><label className="staff-cms-checkbox"><input type="checkbox" checked={imagePrimary} onChange={(e)=>setImagePrimary(e.target.checked)}/><span>تصویر اصلی</span></label>{error&&<p className="form-error">{error}</p>}<button className="staff-primary-action" disabled={saving}>{saving?"در حال بارگذاری…":"بارگذاری تصویر"}</button></form></section>;
}
