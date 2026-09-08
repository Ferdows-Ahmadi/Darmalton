import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/AddToCart";
import { MedicineMedia } from "@/components/MedicineMedia";
import { formatMoney, formatNumber, productName, textFor } from "@/lib/locale";
import { publicApi } from "@/lib/server-api";
import { serverLocale } from "@/lib/server-locale";
import {
  categoryName,
  dosageFormName,
  localizedGenericName,
  localizedPackSize,
  manufacturerName
} from "@/lib/storefront";
import type { Medicine, PageResult } from "@/lib/types";

export default async function MedicinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await serverLocale();
  let medicine: Medicine;
  try {
    medicine = await publicApi<Medicine>(`medicines/${id}/`);
  } catch {
    notFound();
  }

  const family = medicine.family_code
    ? await publicApi<PageResult<Medicine>>(
        `medicines/?family_code=${encodeURIComponent(medicine.family_code)}&ordering=name`
      ).catch(() => null)
    : null;
  const variants = family?.results.length ? family.results : [medicine];
  const name = productName(medicine, locale);
  const copy = locale === "en"
    ? { product: "Medicine", manufacturer: "Manufacturer", unavailable: "Unavailable", rxYes: "Required", rxNo: "Not required", current: "Current price", available: "available", missing: "Product information has not been supplied.", choose: "Choose strength / pack" }
    : locale === "fa-AF"
      ? { product: "دارو", manufacturer: "تولیدکننده", unavailable: "ناموجود", rxYes: "الزامی است", rxNo: "لازم نیست", current: "قیمت فعلی", available: "عدد موجود", missing: "معلومات این محصول هنوز ثبت نشده است.", choose: "مقدار / بسته را انتخاب کنید" }
      : { product: "درمل", manufacturer: "جوړوونکی", unavailable: "نشته", rxYes: "اړینه ده", rxNo: "اړینه نه ده", current: "اوسنۍ بیه", available: "شته", missing: "د دې توکي معلومات نه دي ورکړل شوي.", choose: "قوت / بسته وټاکئ" };
  const description = locale === "en"
    ? medicine.description
    : locale === "ps-AF"
      ? medicine.description_pashto || medicine.description_dari || medicine.description
      : medicine.description_dari || medicine.description;

  return <section className="page-section product-detail-page">
    <div className="product-detail">
      <div className="detail-gallery">
        <div className="detail-image">
          <MedicineMedia imageUrl={medicine.image_url} alt={name} width={640} height={480} sizes="(max-width: 900px) 100vw, 50vw" priority/>
        </div>
      </div>
      <div className="detail-copy">
        <p className="eyebrow">{(medicine.category ? categoryName(medicine.category, locale) : copy.product)} · <bdi dir="ltr">{medicine.sku}</bdi></p>
        <h1>{name}</h1>
        {localizedGenericName(medicine, locale) && <p className="generic">{localizedGenericName(medicine, locale)}</p>}
        <span className={medicine.in_stock ? "availability good" : "availability"}>{medicine.in_stock ? `✓ ${textFor(locale, "inStock")}` : copy.unavailable}</span>
        <p className="description">{description || copy.missing}</p>
        {variants.length > 1 && <div className="variant-picker">
          <strong>{copy.choose}</strong>
          <div>{variants.map(variant => <Link
            href={`/medicines/${variant.id}`}
            aria-current={variant.id === medicine.id ? "true" : undefined}
            className={variant.id === medicine.id ? "selected" : ""}
            key={variant.id}
          ><bdi>{variant.strength}</bdi><small>{localizedPackSize(variant.pack_size, locale)}</small></Link>)}</div>
        </div>}
        <dl className="facts">
          <div><dt>{copy.manufacturer}</dt><dd>{medicine.manufacturer ? manufacturerName(medicine.manufacturer, locale) : textFor(locale, "unspecified")}</dd></div>
          <div><dt>{textFor(locale, "form")}</dt><dd>{dosageFormName(medicine, locale)}</dd></div>
          <div><dt>{textFor(locale, "pack")}</dt><dd>{localizedPackSize(medicine.pack_size, locale) || textFor(locale, "unspecified")}</dd></div>
          <div><dt>{textFor(locale, "requiresRx")}</dt><dd>{medicine.prescription_required ? copy.rxYes : copy.rxNo}</dd></div>
        </dl>
        <div className="purchase-panel"><div><span>{copy.current}</span><strong>{formatMoney(medicine.price, locale)}</strong><small>{formatNumber(medicine.available_quantity, locale)} {copy.available}</small></div><AddToCart medicine={medicine} disabled={!medicine.in_stock} prescriptionRequired={medicine.prescription_required}/></div>
      </div>
    </div>
  </section>;
}
