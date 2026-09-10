"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { Icon } from "./StoreUI";
import { Locale, productName, TextKey } from "@/lib/locale";
import { apiFetch } from "@/lib/api";
import type { Medicine, PageResult } from "@/lib/types";
import { groupMedicineFamilies, localizedGenericName } from "@/lib/storefront";
import { MedicineMedia } from "./MedicineMedia";
const primaryLinks: [string,TextKey][]=[["/","home"],["/shop","shop"],["/categories","categories"],["/manufacturers","manufacturers"],["/prescriptions/upload","rx"],["/health","health"],["/app","app"]];
export function Header({authenticated,hasHealthContent}:{authenticated:boolean;hasHealthContent:boolean}) {
 const {locale,setLocale,t}=useLocale();const path=usePathname();const router=useRouter();
 const dialog=useRef<HTMLDialogElement>(null);const opener=useRef<HTMLButtonElement>(null);
 const [query,setQuery]=useState("");const [results,setResults]=useState<Medicine[]>([]);const [active,setActive]=useState(-1);const [open,setOpen]=useState(false);const [compressed,setCompressed]=useState(false);
 useEffect(()=>{if(query.trim().length<2){setResults([]);return;}const controller=new AbortController();const timer=setTimeout(()=>{apiFetch<PageResult<Medicine>>(`medicines/?family_listing=true&search=${encodeURIComponent(query)}`,{signal:controller.signal}).then(r=>setResults(r.results.slice(0,6))).catch(()=>setResults([]));},220);return()=>{clearTimeout(timer);controller.abort();};},[query]);
 useEffect(()=>{dialog.current?.close();setOpen(false);},[path]);
 useEffect(()=>{const update=()=>setCompressed(window.scrollY>96);update();window.addEventListener("scroll",update,{passive:true});return()=>window.removeEventListener("scroll",update);},[]);
 function close(){dialog.current?.close();opener.current?.focus();}
 async function logout(){await fetch("/api/auth/logout",{method:"POST"});window.google?.accounts.id.disableAutoSelect();router.push("/");router.refresh();}
 const links=primaryLinks.filter(([href])=>href!=="/health"||hasHealthContent);
 const families=groupMedicineFamilies(results);
 return <header className={`store-header${compressed?" is-compressed":""}`}>
 <div className="header-main wrap"><button ref={opener} className="icon-button menu-toggle" aria-label={t("menu")} onClick={()=>dialog.current?.showModal()}>☰</button><Link className="brand" href="/" aria-label={t("home")}><Image src="/brand/darmalton-logo.png" width={160} height={64} alt="درملتون" priority sizes="160px"/></Link>
 <form className="header-search" role="search" action="/shop" onSubmit={e=>{if(active>=0&&families[active]){e.preventDefault();router.push(`/medicines/${families[active].medicine.id}`);}setOpen(false);}}><input aria-label={t("searchButton")} name="search" value={query} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),160)} onChange={e=>{setQuery(e.target.value);setActive(-1);setOpen(true);}} placeholder={t("search")} role="combobox" aria-expanded={open&&families.length>0} aria-controls="search-results" aria-autocomplete="list" aria-activedescendant={active>=0?`search-option-${active}`:undefined} autoComplete="off" onKeyDown={e=>{if(e.key==="Escape")setOpen(false);if(e.key==="ArrowDown"){e.preventDefault();setActive(v=>Math.min(v+1,families.length-1));setOpen(true);}if(e.key==="ArrowUp"){e.preventDefault();setActive(v=>Math.max(v-1,0));}}}/><button aria-label={t("searchButton")}><Icon name="ICON-001_Search" size={20}/></button>{open&&families.length>0&&<div className="search-results" id="search-results" role="listbox" aria-label={t("products")}>{families.map((family,i)=>{const m=family.medicine;return <Link id={`search-option-${i}`} role="option" aria-selected={i===active} className={`search-result${i===active?" selected":""}`} href={`/medicines/${m.id}`} key={family.code}><span className="search-result-image"><MedicineMedia imageUrl={m.image_url} alt="" fill sizes="58px"/></span><span className="search-result-copy"><strong>{productName(m,locale)}</strong><small><bdi>{family.variants.length>1?`${family.variants.length} ${t("variantsAvailable")}`:m.strength}</bdi>{localizedGenericName(m,locale)?` · ${localizedGenericName(m,locale)}`:""}</small><em>{m.in_stock?t("inStock"):t("outOfStock")}</em></span></Link>;})}</div>}</form>
 <label className="language-switch"><span className="sr-only">{t("language")}</span><select aria-label={t("language")} value={locale} onChange={e=>setLocale(e.target.value as Locale)}><option value="en">English</option><option value="fa-AF">دری</option><option value="ps-AF">پښتو</option></select></label><Link className="header-action" href={authenticated?"/account":"/login"}><Icon name="ICON-002_Account"/><span>{t(authenticated?"account":"login")}</span></Link><Link className="header-action" href="/cart"><Icon name="ICON-004_Cart"/><span>{t("cart")}</span></Link></div>
 <nav className="header-nav wrap" aria-label={t("menu")}>{links.map(([href,key])=><Link key={href} href={href} aria-current={path===href?"page":undefined}>{t(key)}</Link>)}</nav><dialog ref={dialog} className="nav-drawer" onClick={e=>{if(e.target===dialog.current)close();}} onClose={()=>opener.current?.focus()}><div className="drawer-content"><div className="section-heading"><strong>{t("menu")}</strong><button className="secondary" onClick={close}>{t("close")}</button></div><nav>{links.map(([href,key])=><Link onClick={close} key={href} href={href}>{t(key)}</Link>)}{authenticated&&<button onClick={logout}>{t("logout")}</button>}</nav></div></dialog></header>;
}
