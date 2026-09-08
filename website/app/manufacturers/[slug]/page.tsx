import { Catalogue } from "@/components/Catalogue";
import { State } from "@/components/StoreUI";
import { textFor } from "@/lib/locale";
import { publicApi } from "@/lib/server-api";
import { serverLocale } from "@/lib/server-locale";
import type { Category, Medicine, PageResult } from "@/lib/types";

export default async function ManufacturerPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await serverLocale();
  const name = decodeURIComponent((await params).slug);
  const data = await Promise.all([
    publicApi<Category[]>("categories/"),
    publicApi<PageResult<Medicine>>(
      `medicines/?family_listing=true&manufacturer=${encodeURIComponent(name)}&ordering=name`
    )
  ]).catch(() => null);

  return (
    <>
      <header className="page-heading">
        <div className="wrap">
          <h1>{name}</h1>
          <p>{textFor(locale, "products")}</p>
        </div>
      </header>
      <section className="page-section">
        {data ? (
          <Catalogue categories={data[0]} medicines={data[1]} />
        ) : (
          <State kind="error" title="unavailable" body="connection" />
        )}
      </section>
    </>
  );
}
