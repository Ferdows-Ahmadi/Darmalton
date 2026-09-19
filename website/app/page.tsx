import { LegacyHome } from "@/components/LegacyHome";
import { MarketplaceHome } from "@/components/home/MarketplaceHome";
import styles from "@/components/home/MarketplaceHome.module.css";
import { publicHomeCms } from "@/lib/public-cms";
import { publicApi } from "@/lib/server-api";
import { serverLocale } from "@/lib/server-locale";
import type { Category, Manufacturer, Medicine, PageResult } from "@/lib/types";

async function publicMedicinePages() {
  const pages: PageResult<Medicine>[] = [];
  for (let page = 1; page <= 5; page += 1) {
    const result = await publicApi<PageResult<Medicine>>(
      `medicines/?family_listing=true&ordering=name&page=${page}`
    ).catch(() => null);
    if (!result) break;
    pages.push(result);
    if (!result.next) break;
  }
  return pages;
}

export default async function Home() {
  const locale = await serverLocale();
  const [cms, pages] = await Promise.all([publicHomeCms(), publicMedicinePages()]);
  const legacy = <LegacyHome locale={locale} cms={cms} pages={pages} />;
  if (locale !== "fa-AF") return legacy;
  const [categories, manufacturers] = await Promise.all([
    publicApi<Category[]>("categories/").catch(() => []),
    publicApi<Manufacturer[]>("manufacturers/").catch(() => [])
  ]);
  // Scope this review milestone without changing other viewport layouts.
  return <>
    <div className={styles.legacy}>{legacy}</div>
    <div className={styles.desktop}>
      <MarketplaceHome cms={cms} medicines={pages.flatMap(page => page.results)}
        categories={categories} manufacturers={manufacturers} />
    </div>
  </>;
}
