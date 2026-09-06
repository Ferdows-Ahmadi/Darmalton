import { notFound } from "next/navigation";

import { AddToCart } from "@/components/AddToCart";
import { MedicineMedia } from "@/components/MedicineMedia";
import { formatMoney, productName, textFor } from "@/lib/locale";
import { publicApi } from "@/lib/server-api";
import { serverLocale } from "@/lib/server-locale";
import type { Medicine } from "@/lib/types";

export default async function MedicinePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await serverLocale();
  let medicine: Medicine;
  try {
    medicine = await publicApi<Medicine>(`medicines/${id}/`);
  } catch {
    notFound();
  }

  const name = productName(medicine, locale);
  const copy = locale === "en"
    ? { product: "Medicine", manufacturer: "Manufacturer", unavailable: "Unavailable", rxYes: "Required", rxNo: "Not required", current: "Current price", available: "available", missing: "Product information has not been supplied." }
    : locale === "fa-AF"
      ? { product: "دارو", manufacturer: "تولیدکننده", unavailable: "ناموجود", rxYes: "الزامی است", rxNo: "لازم نیست", current: "قیمت فعلی", available: "عدد موجود", missing: "معلومات این محصول هنوز ثبت نشده است." }
      : { product: "درمل", manufacturer: "جوړوونکی", unavailable: "نشته", rxYes: "اړینه ده", rxNo: "اړینه نه ده", current: "اوسنۍ بیه", available: "شته", missing: "د دې توکي معلومات نه دي ورکړل شوي." };
  return (
    <section className="page-section product-detail">
      <div>
        <div className="detail-image">
          <MedicineMedia
            imageUrl={medicine.image_url}
            alt={name}
            width={640}
            height={480}
            sizes="(max-width: 900px) 100vw, 50vw"
            priority
          />
        </div>
      </div>
      <div className="detail-copy">
        <p className="eyebrow">
          {(locale === "en" ? medicine.category?.name : medicine.category?.name_dari || medicine.category?.name) || copy.product}{" "}
          · <bdi dir="ltr">{medicine.sku}</bdi>
        </p>
        <h1>{name}</h1>
        <p className="generic" dir="ltr">
          {medicine.brand_name} · {medicine.generic_name} ·{" "}
          {medicine.strength}
        </p>
        <span className={medicine.in_stock ? "availability good" : "availability"}>
          {medicine.in_stock ? `✓ ${textFor(locale, "inStock")}` : copy.unavailable}
        </span>
        <p className="description">
          {medicine.description_dari ||
            medicine.description ||
            copy.missing}
        </p>
        <dl className="facts">
          <div>
            <dt>{copy.manufacturer}</dt>
            <dd>{medicine.manufacturer?.name || textFor(locale, "unspecified")}</dd>
          </div>
          <div>
            <dt>{textFor(locale, "form")}</dt>
            <dd>
              {locale === "en" ? medicine.dosage_form.name : medicine.dosage_form.name_dari || medicine.dosage_form.name}
            </dd>
          </div>
          <div>
            <dt>{textFor(locale, "pack")}</dt>
            <dd>{medicine.pack_size || textFor(locale, "unspecified")}</dd>
          </div>
          <div>
            <dt>{textFor(locale, "requiresRx")}</dt>
            <dd>{medicine.prescription_required ? copy.rxYes : copy.rxNo}</dd>
          </div>
        </dl>
        <div className="purchase-panel">
          <div>
            <span>{copy.current}</span>
            <strong>{formatMoney(medicine.price, locale)}</strong>
            <small>
              {medicine.available_quantity.toLocaleString(locale)} {copy.available}
            </small>
          </div>
          <AddToCart
            medicine={medicine}
            disabled={!medicine.in_stock}
            prescriptionRequired={medicine.prescription_required}
          />
        </div>
      </div>
    </section>
  );
}
