import Image from "next/image";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/AddToCart";
import { money } from "@/lib/api";
import { publicApi } from "@/lib/server-api";
import type { Medicine } from "@/lib/types";

export default async function MedicinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let medicine: Medicine;
  try {
    medicine = await publicApi<Medicine>(`medicines/${id}/`);
  } catch {
    notFound();
  }

  return (
    <section className="page-section detail-layout">
      <div className="detail-image">
        <Image src={medicine.image_url} alt="" width={640} height={480} unoptimized priority />
      </div>
      <div className="detail-copy">
        <p className="eyebrow">{medicine.category?.name || "Medicine"} · {medicine.sku}</p>
        <h1>{medicine.brand_name}</h1>
        <p className="generic">{medicine.generic_name} · {medicine.strength}</p>
        <p>{medicine.description}</p>
        <dl className="facts">
          <div><dt>Manufacturer</dt><dd>{medicine.manufacturer?.name || "Not listed"}</dd></div>
          <div><dt>Dosage form</dt><dd>{medicine.dosage_form.name}</dd></div>
          <div><dt>Pack size</dt><dd>{medicine.pack_size || "Not listed"}</dd></div>
          <div><dt>Prescription</dt><dd>{medicine.prescription_required ? "Required" : "Not required"}</dd></div>
        </dl>
        <div className="purchase-panel">
          <div><span>Current price</span><strong>{money(medicine.price)}</strong><small>{medicine.available_quantity} units available</small></div>
          <AddToCart medicineId={medicine.id} disabled={!medicine.in_stock} />
        </div>
      </div>
    </section>
  );
}
