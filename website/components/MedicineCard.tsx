"use client";
import Link from "next/link";
import { useLocale } from "./LocaleProvider";
import { formatMoney, productName } from "@/lib/locale";
import type { Medicine } from "@/lib/types";
import { MedicineMedia } from "./MedicineMedia";
import { AddToCart } from "./AddToCart";
export function MedicineCard({medicine}:{medicine:Medicine}) {const {locale,t}=useLocale();const name=productName(medicine,locale);return <article className="product-card"><Link className="product-photo" href={`/medicines/${medicine.id}`}><MedicineMedia imageUrl={medicine.image_url} alt={`${name} ${medicine.strength}`} fill sizes="(max-width:767px) 160px, (max-width:1100px) 180px, 210px"/></Link><div className="product-info"><h2><Link href={`/medicines/${medicine.id}`}>{name}</Link></h2><p><bdi>{medicine.strength}</bdi> · {medicine.pack_size}</p>{medicine.prescription_required&&<span className="badge">{t("requiresRx")}</span>}<strong>{formatMoney(medicine.price,locale)}</strong><span className={`stock ${medicine.in_stock?"good":""}`}>{t(medicine.in_stock?"inStock":"outOfStock")}</span><div className="product-buy"><AddToCart medicine={medicine} disabled={!medicine.in_stock} prescriptionRequired={medicine.prescription_required}/></div></div></article>;}
