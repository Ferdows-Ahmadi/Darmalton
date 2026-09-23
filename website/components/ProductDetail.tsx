import Link from "next/link";
import { customerText } from "@/lib/customer-copy";

import { formatMoney, formatNumber, productName, textFor, type Locale } from "@/lib/locale";
import { categoryName, dosageFormName, localizedGenericName, localizedPackSize, manufacturerName } from "@/lib/storefront";
import type { Medicine } from "@/lib/types";
import { AddToCart } from "./AddToCart";
import { MedicineMedia } from "./MedicineMedia";
import styles from "./ProductDetail.module.css";

// Presentation only: selection remains a route to the exact server-provided SKU.
export function ProductDetail({ medicine, variants, locale }: { medicine: Medicine; variants: Medicine[]; locale: Exclude<Locale, "en"> }) {
  const name = productName(medicine, locale);
  const generic = localizedGenericName(medicine, locale);
  const manufacturer = medicine.manufacturer ? manufacturerName(medicine.manufacturer, locale) : textFor(locale, "unspecified");
  const pack = localizedPackSize(medicine.pack_size, locale) || textFor(locale, "unspecified");

  return <section className={styles.page}>
    <nav className={styles.breadcrumb} aria-label={customerText(locale, "مسیر صفحه")}>
      <Link href="/">{textFor(locale, "home")}</Link><span aria-hidden="true">/</span>
      <Link href="/shop">{textFor(locale, "shop")}</Link><span aria-hidden="true">/</span>
      <span aria-current="page">{name}</span>
    </nav>
    <div className={styles.product}>
      <div className={styles.gallery}>
        <div className={styles.image}>
          <MedicineMedia imageUrl={medicine.image_url} alt={`${name} ${medicine.strength}`} fill sizes="(max-width: 767px) 240px, (max-width: 1199px) 320px, 380px" priority/>
        </div>
        <span className={styles.sku}>{customerText(locale, "کد محصول")} <bdi dir="ltr">{medicine.sku}</bdi></span>
      </div>
      <div className={styles.information}>
        <p className={styles.category}>{medicine.category ? categoryName(medicine.category, locale) : customerText(locale, "دارو")}</p>
        <h1>{name}</h1>
        {generic && <p className={styles.generic}>{generic}</p>}
        <p className={styles.manufacturer}><span>{customerText(locale, "تولیدکننده")}</span> <bdi>{manufacturer}</bdi></p>
        <div className={styles.priceRow}>
          <div className={styles.price}><span>{customerText(locale, "قیمت فعلی")}</span><strong>{formatMoney(medicine.price, locale)}</strong></div>
          <div className={styles.stock}>
            <span className={medicine.in_stock ? styles.available : styles.unavailable}>{textFor(locale, medicine.in_stock ? "inStock" : "outOfStock")}</span>
            <small>{formatNumber(medicine.available_quantity, locale)} {customerText(locale, "عدد موجود")}</small>
          </div>
        </div>
        {variants.length > 1 ? <div className={styles.variants}>
          <strong>{customerText(locale, "مقدار / بسته را انتخاب کنید")}</strong>
          <div>{variants.map(variant => <Link
            href={`/medicines/${variant.id}`}
            aria-current={variant.id === medicine.id ? "true" : undefined}
            key={variant.id}
          ><bdi>{variant.strength || dosageFormName(variant, locale)}</bdi><small>{localizedPackSize(variant.pack_size, locale) || textFor(locale, "unspecified")}</small></Link>)}</div>
        </div> : <p className={styles.singleVariant}><bdi>{medicine.strength}</bdi><span>{dosageFormName(medicine, locale)} · {pack}</span></p>}
        <div className={styles.purchase}>
          <p className={medicine.prescription_required ? styles.rx : styles.nonRx}>
            <span aria-hidden="true">{medicine.prescription_required ? "Rx" : "✓"}</span>
            <span>{textFor(locale, "requiresRx")} <strong>{medicine.prescription_required ? customerText(locale, "الزامی است") : customerText(locale, "لازم نیست")}</strong></span>
          </p>
          <AddToCart medicine={medicine} disabled={!medicine.in_stock} prescriptionRequired={medicine.prescription_required}/>
        </div>
        <dl className={styles.facts}>
          <div><dt>{textFor(locale, "form")}</dt><dd>{dosageFormName(medicine, locale)}</dd></div>
          <div><dt>{customerText(locale, "مقدار")}</dt><dd><bdi>{medicine.strength || textFor(locale, "unspecified")}</bdi></dd></div>
          <div><dt>{textFor(locale, "pack")}</dt><dd>{pack}</dd></div>
          <div><dt>{customerText(locale, "تولیدکننده")}</dt><dd><bdi>{manufacturer}</bdi></dd></div>
        </dl>
      </div>
    </div>
    <section className={styles.description} aria-labelledby="product-information">
      <h2 id="product-information">{customerText(locale, "معلومات محصول")}</h2>
      <p>{(locale === "ps-AF" ? medicine.description_pashto || medicine.description_dari : medicine.description_dari) || customerText(locale, "معلومات این محصول هنوز ثبت نشده است.")}</p>
    </section>
  </section>;
}
