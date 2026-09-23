import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { publicApi } from "@/lib/server-api";
import { serverLocale } from "@/lib/server-locale";
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
  return <ProductDetail locale={locale} medicine={medicine} variants={variants}/>;
}
