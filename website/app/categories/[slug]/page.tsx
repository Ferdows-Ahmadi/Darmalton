import { Catalogue } from "@/components/Catalogue";
import { State } from "@/components/StoreUI";
import { textFor } from "@/lib/locale";
import { publicApi } from "@/lib/server-api";
import { serverLocale } from "@/lib/server-locale";
import type { Category, Medicine, PageResult } from "@/lib/types";

export default async function CategoryPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await serverLocale();
  const { slug } = await params;
  const data = await Promise.all([
    publicApi<Category[]>("categories/"),
    publicApi<PageResult<Medicine>>(
      `medicines/?category=${encodeURIComponent(slug)}&ordering=name`
    )
  ]).catch(() => null);
  const category = data?.[0].find((item) => item.slug === slug);
  const title = category
    ? locale === "en"
      ? category.name
      : category.name_dari || category.name
    : textFor(locale, "categories");

  return (
    <>
      <header className="page-heading">
        <div className="wrap">
          <h1>{title}</h1>
          <p>{textFor(locale, "browse")}</p>
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
