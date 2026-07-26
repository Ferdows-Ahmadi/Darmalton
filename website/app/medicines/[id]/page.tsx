import Image from "next/image";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/AddToCart";
import { money } from "@/lib/api";
import { publicApi } from "@/lib/server-api";
import type { Medicine } from "@/lib/types";

export default async function MedicinePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let medicine: Medicine;
  try {
    medicine = await publicApi<Medicine>(`medicines/${id}/`);
  } catch {
    notFound();
  }

  const name = medicine.brand_name_dari || medicine.brand_name;
  return (
    <section className="page-section detail-layout">
      <div>
        <div className="detail-image">
          <Image
            src={medicine.image_url}
            alt={name}
            width={640}
            height={480}
            unoptimized
            priority
          />
        </div>
        <div className="pharmacist-note">
          <span aria-hidden="true">⚕</span>
          <p>
            <strong>یادداشت فارمسست</strong>
            دوا را مطابق روش توصیه‌شده مصرف کنید. در صورت ادامه علایم، با داکتر
            مشورت کنید.
          </p>
        </div>
      </div>
      <div className="detail-copy">
        <p className="eyebrow">
          {medicine.category?.name_dari ||
            medicine.category?.name ||
            "دوا"}{" "}
          · <bdi dir="ltr">{medicine.sku}</bdi>
        </p>
        <h1>{name}</h1>
        <p className="generic" dir="ltr">
          {medicine.brand_name} · {medicine.generic_name} ·{" "}
          {medicine.strength}
        </p>
        <span className={medicine.in_stock ? "availability good" : "availability"}>
          {medicine.in_stock ? "✓ موجود در انبار" : "ناموجود"}
        </span>
        <p className="description">
          {medicine.description_dari ||
            medicine.description ||
            "توضیحات این محصول هنوز ثبت نشده است."}
        </p>
        <dl className="facts">
          <div>
            <dt>تولیدکننده</dt>
            <dd>{medicine.manufacturer?.name || "ثبت نشده"}</dd>
          </div>
          <div>
            <dt>نوع محصول</dt>
            <dd>
              {medicine.dosage_form.name_dari || medicine.dosage_form.name}
            </dd>
          </div>
          <div>
            <dt>اندازه بسته</dt>
            <dd>{medicine.pack_size || "ثبت نشده"}</dd>
          </div>
          <div>
            <dt>نسخه داکتر</dt>
            <dd>{medicine.prescription_required ? "الزامی است" : "لازم نیست"}</dd>
          </div>
        </dl>
        <div className="purchase-panel">
          <div>
            <span>قیمت فعلی</span>
            <strong>{money(medicine.price)}</strong>
            <small>
              {medicine.available_quantity.toLocaleString("fa-AF")} عدد موجود
            </small>
          </div>
          <AddToCart
            medicineId={medicine.id}
            disabled={!medicine.in_stock}
            prescriptionRequired={medicine.prescription_required}
          />
        </div>
      </div>
    </section>
  );
}
