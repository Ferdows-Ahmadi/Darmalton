"use client";
import Link from "next/link";
import { useLocale } from "./LocaleProvider";
import { formatMoney, productName } from "@/lib/locale";
import { dosageFormName, localizedGenericName, localizedPackSize } from "@/lib/storefront";
import type { Medicine } from "@/lib/types";
import { MedicineMedia } from "./MedicineMedia";
import { AddToCart } from "./AddToCart";
export function MedicineCard({medicine,variants=[medicine]}:{medicine:Medicine;variants?:Medicine[]}) {
  const {locale,t}=useLocale();
  const name=productName(medicine,locale);
  const generic=localizedGenericName(medicine,locale);
  const prices=variants.map(({price})=>price).filter((price):price is string=>price!==null).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
  const price=prices.length>1&&prices[0]!==prices.at(-1)?`${formatMoney(String(prices[0]),locale)} – ${formatMoney(String(prices.at(-1)),locale)}`:formatMoney(medicine.price,locale);
  const inStock=variants.some((variant)=>variant.in_stock);
  const requiresRx=variants.some((variant)=>variant.prescription_required);
  return <article className="product-card"><Link className="product-photo" href={`/medicines/${medicine.id}`}><MedicineMedia imageUrl={medicine.image_url} alt={`${name} ${medicine.strength}`} fill sizes="(max-width:767px) 160px, (max-width:1100px) 180px, 210px"/></Link><div className="product-info"><h2><Link href={`/medicines/${medicine.id}`}>{name}</Link></h2><p className="product-variant">{variants.length>1?`${variants.length} ${t("variantsAvailable")}`:<><bdi>{medicine.strength}</bdi> · {localizedPackSize(medicine.pack_size,locale)}</>}</p><p className={`product-generic ${generic?"":"is-placeholder"}`} aria-hidden={generic?undefined:"true"}>{generic||"\u00a0"}</p><p className="product-form">{dosageFormName(medicine,locale)}</p><div className="badge-slot">{requiresRx&&<span className="badge">{t("requiresRx")}</span>}</div><strong>{price}</strong><span className={`stock ${inStock?"good":""}`}>{t(inStock?"inStock":"outOfStock")}</span><div className="product-buy">{variants.length>1?<Link className="button" href={`/medicines/${medicine.id}`}>{t("chooseStrength")}</Link>:<AddToCart medicine={medicine} disabled={!inStock} prescriptionRequired={medicine.prescription_required}/>}</div></div></article>;
}
