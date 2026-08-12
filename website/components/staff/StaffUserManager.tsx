"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import { canManageUsers, staffRoles, userRoleLabels, validateTemporaryPassword, type StaffUser } from "@/lib/staff-users";
import type { PageResult, User } from "@/lib/types";

type FieldErrors = Record<string, string[] | string>;
type FormValues = { email:string; phone:string; first_name:string; last_name:string; role:string; preferred_language:string; is_active:boolean; password:string };
const emptyForm: FormValues = { email:"", phone:"", first_name:"", last_name:"", role:"STAFF", preferred_language:"FA", is_active:true, password:"" };

function message(error: unknown) { return error instanceof Error ? error.message : "درخواست انجام نشد."; }
function fieldMessage(errors:FieldErrors,name:string){const value=errors[name];return Array.isArray(value)?value.join(" "):value||"";}
function toForm(user:StaffUser):FormValues{return {email:user.email,phone:user.phone||"",first_name:user.first_name,last_name:user.last_name,role:user.role,preferred_language:user.preferred_language,is_active:user.is_active,password:""};}

export function StaffUserManager() {
  const [viewer,setViewer]=useState<User|null>(null);
  const [users,setUsers]=useState<StaffUser[]>([]);
  const [count,setCount]=useState(0);
  const [page,setPage]=useState(1);
  const [query,setQuery]=useState("");
  const [appliedQuery,setAppliedQuery]=useState("");
  const [role,setRole]=useState("");
  const [active,setActive]=useState("");
  const [busy,setBusy]=useState(true);
  const [saving,setSaving]=useState(false);
  const [listError,setListError]=useState("");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [selected,setSelected]=useState<StaffUser|null>(null);
  const [modal,setModal]=useState<"create"|"edit"|"view"|null>(null);
  const [confirm,setConfirm]=useState<StaffUser|null>(null);
  const [form,setForm]=useState<FormValues>(emptyForm);
  const [fieldErrors,setFieldErrors]=useState<FieldErrors>({});

  const load=useCallback(async()=>{
    setBusy(true);setListError("");
    const params=new URLSearchParams({page:String(page),ordering:"-created_at"});
    if(appliedQuery)params.set("search",appliedQuery);if(role)params.set("role",role);if(active)params.set("is_active",active);
    try{const [profile,payload]=await Promise.all([apiFetch<User>("auth/me/"),apiFetch<PageResult<StaffUser>>(`auth/staff/users/?${params}`)]);setViewer(profile);setUsers(payload.results);setCount(payload.count);}catch(caught){setListError(message(caught));}finally{setBusy(false);}
  },[active,appliedQuery,page,role]);
  useEffect(()=>{void load();},[load]);
  const pages=Math.max(1,Math.ceil(count/20));
  function title(user:StaffUser){return `${user.first_name} ${user.last_name}`.trim()||user.email;}
  function openCreate(){setSelected(null);setForm(emptyForm);setModal("create");setError("");setFieldErrors({});}
  function open(user:StaffUser,mode:"view"|"edit"){setSelected(user);setForm(toForm(user));setModal(mode);setError("");setFieldErrors({});}
  function close(){setModal(null);setSelected(null);setError("");setFieldErrors({});}
  function setValue<K extends keyof FormValues>(key:K,value:FormValues[K]){setForm(current=>({...current,[key]:value}));}

  async function save(event:FormEvent){
    event.preventDefault();setError("");setFieldErrors({});
    const passwordError=validateTemporaryPassword(form.password,Boolean(selected));if(passwordError){setFieldErrors({password:passwordError});return;}
    setSaving(true);
    const payload={...form,phone:form.phone||null,...(form.password?{}:{password:undefined})};
    try{await apiFetch(selected?`auth/staff/users/${selected.id}/`:"auth/staff/users/",{method:selected?"PATCH":"POST",body:JSON.stringify(payload)});setNotice(selected?"حساب با موفقیت به‌روزرسانی شد.":"حساب کارمند ایجاد شد.");close();await load();}
    catch(caught){if(caught instanceof ApiError)setFieldErrors(caught.fields);setError(message(caught));}finally{setSaving(false);}
  }
  async function toggle(){if(!confirm)return;setSaving(true);setError("");try{await apiFetch(`auth/staff/users/${confirm.id}/`,{method:"PATCH",body:JSON.stringify({is_active:!confirm.is_active})});setNotice(confirm.is_active?"حساب غیرفعال شد.":"حساب فعال شد.");setConfirm(null);await load();}catch(caught){setError(message(caught));}finally{setSaving(false);}}

  if(!busy&&viewer&&!canManageUsers(viewer.role))return <main className="staff-page"><header className="staff-page-heading"><div><span>مدیریت</span><h1>کاربران و کارکنان</h1></div></header><section className="staff-access-denied"><strong>دسترسی محدود</strong><p>تنها مدیر سیستم می‌تواند نقش‌ها و وضعیت حساب‌ها را تغییر دهد.</p></section></main>;

  return <main className="staff-page staff-users-page"><header className="staff-page-heading"><div><span>مدیریت</span><h1>کاربران و کارکنان</h1><p>حساب‌ها، نقش‌ها و دسترسی عملیاتی را با حفظ سابقه مدیریت کنید.</p></div><button className="staff-primary-link" onClick={openCreate}>ایجاد حساب کارمند</button></header>
    {notice&&<div className="staff-cms-notice" role="status">{notice}<button onClick={()=>setNotice("")} aria-label="بستن پیام">×</button></div>}
    {error&&!modal&&!confirm&&<p className="form-error" role="alert">{error}</p>}
    <div className="staff-toolbar staff-user-toolbar"><form onSubmit={(event)=>{event.preventDefault();setPage(1);setAppliedQuery(query.trim());}}><input aria-label="جستجوی کاربران" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="نام، ایمیل یا شماره تلفن…"/><button>جستجو</button></form><select aria-label="فیلتر نقش" value={role} onChange={(event)=>{setPage(1);setRole(event.target.value);}}><option value="">همه نقش‌ها</option>{["CUSTOMER",...staffRoles].map(item=><option value={item} key={item}>{userRoleLabels[item]}</option>)}</select><select aria-label="فیلتر وضعیت حساب" value={active} onChange={(event)=>{setPage(1);setActive(event.target.value);}}><option value="">همه وضعیت‌ها</option><option value="true">فعال</option><option value="false">غیرفعال</option></select></div>
    <section className="staff-table-card">{busy?<div className="staff-table-state"><span className="staff-loader"/>در حال دریافت کاربران…</div>:listError?<div className="staff-table-state error"><strong>دریافت کاربران ناموفق بود</strong><span>{listError}</span><button onClick={()=>void load()}>تلاش دوباره</button></div>:!users.length?<div className="staff-table-state"><strong>کاربری پیدا نشد</strong><span>فیلترها را تغییر دهید.</span></div>:<div className="staff-table-scroll"><table><thead><tr><th>کاربر</th><th>تماس</th><th>نقش</th><th>وضعیت</th><th>آخرین ورود</th><th>عملیات</th></tr></thead><tbody>{users.map(user=><tr key={user.id}><td><strong>{title(user)}</strong><small className="staff-cms-latin">{user.email}</small></td><td><bdi>{user.phone||"—"}</bdi></td><td>{userRoleLabels[user.role]||user.role}</td><td><span className={`status-pill status-${user.is_active?"ACTIVE":"INACTIVE"}`}>{user.is_active?"فعال":"غیرفعال"}</span></td><td>{user.last_login?new Date(user.last_login).toLocaleString("fa-AF"):"هرگز"}</td><td><div className="staff-row-actions"><button onClick={()=>open(user,"view")}>مشاهده</button><button onClick={()=>open(user,"edit")}>ویرایش</button><button className={user.is_active?"danger":""} disabled={user.id===viewer?.id} title={user.id===viewer?.id?"حساب خود را نمی‌توانید غیرفعال کنید.":undefined} onClick={()=>setConfirm(user)}>{user.is_active?"غیرفعال":"فعال"}</button></div></td></tr>)}</tbody></table></div>}</section>
    <div className="staff-pagination"><button disabled={page<=1||busy} onClick={()=>setPage(value=>value-1)}>صفحه قبل</button><span>صفحه {page} از {pages} · {count.toLocaleString("fa-AF")} حساب</span><button disabled={page>=pages||busy} onClick={()=>setPage(value=>value+1)}>صفحه بعد</button></div>
    {modal&&<div className="staff-modal-backdrop"><section className="staff-modal staff-user-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title"><header><div><span className="staff-eyebrow">{modal==="create"?"حساب تازه":modal==="edit"?"ویرایش حساب":"جزئیات حساب"}</span><h2 id="user-modal-title">{selected?title(selected):"کارمند تازه"}</h2></div><button aria-label="بستن پنجره" onClick={close} disabled={saving}>×</button></header>{modal==="view"&&selected?<div className="staff-user-detail"><dl>{Object.entries({"نام":title(selected),"ایمیل":selected.email,"تلفن":selected.phone||"—","نقش":userRoleLabels[selected.role],"وضعیت":selected.is_active?"فعال":"غیرفعال","عضویت":new Date(selected.date_joined).toLocaleString("fa-AF"),"آخرین ورود":selected.last_login?new Date(selected.last_login).toLocaleString("fa-AF"):"هرگز"}).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></div>:<form className="staff-cms-form" onSubmit={save}><Input label="نام" name="first_name" value={form.first_name} set={value=>setValue("first_name",value)} error={fieldMessage(fieldErrors,"first_name")}/><Input label="نام خانوادگی" name="last_name" value={form.last_name} set={value=>setValue("last_name",value)} error={fieldMessage(fieldErrors,"last_name")}/><Input label="ایمیل" name="email" value={form.email} set={value=>setValue("email",value)} error={fieldMessage(fieldErrors,"email")} required dir="ltr"/><Input label="شماره تلفن" name="phone" value={form.phone} set={value=>setValue("phone",value)} error={fieldMessage(fieldErrors,"phone")} dir="ltr"/><label><span>نقش *</span><select value={form.role} onChange={(event)=>setValue("role",event.target.value)} disabled={selected?.id===viewer?.id}>{staffRoles.map(item=><option value={item} key={item}>{userRoleLabels[item]}</option>)}</select>{fieldMessage(fieldErrors,"role")&&<em>{fieldMessage(fieldErrors,"role")}</em>}</label><label><span>زبان ترجیحی</span><select value={form.preferred_language} onChange={(event)=>setValue("preferred_language",event.target.value)}><option value="FA">دری</option><option value="EN">English</option></select></label><Input label={selected?"رمز موقت تازه (اختیاری)":"رمز موقت"} name="password" value={form.password} set={value=>setValue("password",value)} error={fieldMessage(fieldErrors,"password")} required={!selected} dir="ltr"/><label className="staff-cms-checkbox"><input type="checkbox" checked={form.is_active} disabled={selected?.id===viewer?.id} onChange={(event)=>setValue("is_active",event.target.checked)}/><span>حساب فعال<small>برای حفظ سابقه، حساب‌ها حذف نمی‌شوند.</small></span></label>{error&&<p className="form-error staff-form-wide" role="alert">{error}</p>}<footer className="staff-modal-actions staff-form-wide"><button type="button" onClick={close}>انصراف</button><button className="staff-primary-action" disabled={saving}>{saving?"در حال ذخیره…":"ذخیره حساب"}</button></footer></form>}</section></div>}
    {confirm&&<div className="staff-modal-backdrop"><section className="staff-modal staff-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="user-confirm-title"><header><div><span className="staff-eyebrow">تأیید دسترسی</span><h2 id="user-confirm-title">{confirm.is_active?"غیرفعال‌کردن حساب":"فعال‌کردن حساب"}</h2></div><button onClick={()=>setConfirm(null)} aria-label="بستن">×</button></header><div className="staff-confirm-copy"><strong>{title(confirm)}</strong><p>{confirm.is_active?"کاربر دیگر نمی‌تواند وارد شود، اما سابقه عملیاتی او حفظ می‌گردد.":"کاربر دوباره امکان ورود خواهد داشت."}</p>{error&&<p className="form-error">{error}</p>}</div><footer className="staff-modal-actions"><button onClick={()=>setConfirm(null)}>انصراف</button><button className={confirm.is_active?"staff-danger-action":"staff-primary-action"} disabled={saving} onClick={()=>void toggle()}>{saving?"در حال اجرا…":"تأیید"}</button></footer></section></div>}
  </main>;
}

function Input({label,name,value,set,error,required=false,dir}:{label:string;name:string;value:string;set:(value:string)=>void;error?:string;required?:boolean;dir?:"ltr"}){return <label><span>{label}{required&&" *"}</span><input name={name} value={value} onChange={(event)=>set(event.target.value)} required={required} dir={dir} aria-invalid={Boolean(error)}/>{error&&<em>{error}</em>}</label>;}
