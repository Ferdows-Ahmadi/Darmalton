"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MedicineCard } from "./MedicineCard";
import { useLocale } from "./LocaleProvider";
import { formatNumber } from "@/lib/locale";
import { groupMedicineFamilies, shopperHealthNeeds } from "@/lib/storefront";
import { State } from "./StoreUI";
import type { Category, Medicine, PageResult } from "@/lib/types";
export function Catalogue({categories,medicines}:{categories:Category[];medicines:PageResult<Medicine>}){
 const {locale,t}=useLocale();const params=useSearchParams();const router=useRouter();const [open,setOpen]=useState(false);
 function url(key:string,value:string){const p=new URLSearchParams(params);if(value)p.set(key,value);else p.delete(key);if(key!=="page")p.delete("page");return `/shop?${p}`;}
 const families=groupMedicineFamilies(medicines.results);
 const healthNeeds=shopperHealthNeeds(categories,locale);
 return <div className="catalogue-layout"><button className="secondary mobile-filter" aria-expanded={open} onClick={()=>setOpen(!open)}>{t("filters")}</button><form className={`filters ${open?"is-open":""}`} action="/shop"><strong>{t("filters")}</strong><label>{t("searchButton")}<input name="search" defaultValue={params.get("search")||""}/></label><label>{t("categories")}<select name="category" defaultValue={params.get("category")||""}><option value="">{t("allCategories")}</option>{healthNeeds.filter(need=>need.filterCategory).map(need=><option key={need.key} value={need.filterCategory}>{need.label}</option>)}</select></label>{params.get("shopper_category")&&<input type="hidden" name="shopper_category" value={params.get("shopper_category")||""}/>}<label className="check-label"><input type="checkbox" name="in_stock" value="true" defaultChecked={params.get("in_stock")==="true"}/>{t("inStock")}</label><label>{t("minimum")}<input type="number" name="min_price" min="0" defaultValue={params.get("min_price")||""}/></label><label>{t("maximum")}<input type="number" name="max_price" min="0" defaultValue={params.get("max_price")||""}/></label><button>{t("searchButton")}</button><Link href="/shop">{t("clear")}</Link></form><div><div className="catalogue-top"><span>{formatNumber(families.length,locale)} {t("results")}</span><label className="check-label">{t("sort")}<select value={params.get("ordering")||"name"} onChange={e=>router.push(url("ordering",e.target.value))}><option value="name">{t("name")}</option><option value="price">{t("priceLow")}</option><option value="-price">{t("priceHigh")}</option></select></label></div>{families.length?<div className="medicine-grid">{families.map(family=><MedicineCard key={family.code} medicine={family.medicine} variants={family.variants}/>)}</div>:<State title="noResults" body="trySearch"/>}<nav className="pagination">{medicines.previous&&<Link className="button secondary" href={url("page",String(Math.max(1,Number(params.get("page")||1)-1)))}>{t("previous")}</Link>}{medicines.next&&<Link className="button secondary" href={url("page",String(Number(params.get("page")||1)+1))}>{t("next")}</Link>}</nav></div></div>;
}
