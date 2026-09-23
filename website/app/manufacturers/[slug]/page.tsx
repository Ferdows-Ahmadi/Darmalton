import { notFound } from "next/navigation";
import { Catalogue } from "@/components/Catalogue";
import { CatalogueHeading } from "@/components/CatalogueHeading";
import { State } from "@/components/StoreUI";
import { catalogueApiQuery, matchesManufacturerRoute, type CatalogueContext } from "@/lib/catalogue-context";
import { publicApi } from "@/lib/server-api";
import { serverLocale } from "@/lib/server-locale";
import type { Category, Manufacturer, Medicine, PageResult } from "@/lib/types";
import styles from "../../shop/shop.module.css";

export default async function DetailPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const locale = await serverLocale();
  const { slug } = await params;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (value) query.set(key, value);
  }
  const [categories, manufacturers] = await Promise.all([
    publicApi<Category[]>("categories/").catch(() => null),
    publicApi<Manufacturer[]>("manufacturers/").catch(() => null)
  ]);
  const manufacturer = manufacturers?.find(item => matchesManufacturerRoute(item.name, slug));
  if (manufacturers && !manufacturer) notFound();
  const title = manufacturer?.name || slug;
  const context: CatalogueContext = { kind: "manufacturer", value: title, label: title };
  const medicines = await publicApi<PageResult<Medicine>>(
    `medicines/?${catalogueApiQuery(query, context)}`
  ).catch(() => null);

  return <div className={styles.shop}>
    <CatalogueHeading title={title} parent="manufacturers" count={medicines?.count} locale={locale}/>
    <section className="page-section">
      {categories && medicines ? <Catalogue
        presentation="marketplace" categories={categories} medicines={medicines} context={context}
      /> : <State kind="error" title="unavailable" body="connection"/>}
    </section>
  </div>;
}
