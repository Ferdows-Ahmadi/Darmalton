import Image from "next/image";
import Link from "next/link";

import { money } from "@/lib/api";
import type { Medicine } from "@/lib/types";

export function MedicineCard({ medicine }: { medicine: Medicine }) {
  const name = medicine.brand_name_dari || medicine.brand_name;
  return (
    <article className="medicine-card">
      <Link href={`/medicines/${medicine.id}`} className="medicine-image">
        <Image
          src={medicine.image_url}
          alt={name}
          width={320}
          height={240}
          unoptimized
        />
        {medicine.prescription_required && (
          <span className="rx-badge">نیازمند نسخه</span>
        )}
      </Link>
      <div className="medicine-card-content">
        <p className="eyebrow">
          {medicine.category?.name_dari ||
            medicine.category?.name ||
            "دوا"}
        </p>
        <h2>
          <Link href={`/medicines/${medicine.id}`}>{name}</Link>
        </h2>
        <p className="latin-name" dir="ltr">
          {medicine.brand_name} · {medicine.strength}
        </p>
        <div className="card-footer">
          <strong>{money(medicine.price)}</strong>
          <span className={medicine.in_stock ? "stock good" : "stock"}>
            {medicine.in_stock
              ? `${medicine.available_quantity.toLocaleString("fa-AF")} عدد موجود`
              : "ناموجود"}
          </span>
        </div>
        <Link className="card-action" href={`/medicines/${medicine.id}`}>
          مشاهده محصول
        </Link>
      </div>
    </article>
  );
}
