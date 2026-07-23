import Image from "next/image";
import Link from "next/link";

import { money } from "@/lib/api";
import type { Medicine } from "@/lib/types";

export function MedicineCard({ medicine }: { medicine: Medicine }) {
  return (
    <article className="medicine-card">
      <Link href={`/medicines/${medicine.id}`} className="medicine-image">
        <Image src={medicine.image_url} alt="" width={320} height={240} unoptimized />
        {medicine.prescription_required && <span className="rx-badge">Rx required</span>}
      </Link>
      <div className="medicine-card-content">
        <p className="eyebrow">{medicine.category?.name || "Medicine"}</p>
        <h2><Link href={`/medicines/${medicine.id}`}>{medicine.brand_name}</Link></h2>
        <p className="muted">{medicine.generic_name} · {medicine.strength}</p>
        <div className="card-footer">
          <strong>{money(medicine.price)}</strong>
          <span className={medicine.in_stock ? "stock good" : "stock"}>
            {medicine.in_stock ? `${medicine.available_quantity} available` : "Out of stock"}
          </span>
        </div>
      </div>
    </article>
  );
}
