import { LegacyHome } from "@/components/LegacyHome";
import { MarketplaceHome } from "@/components/home/MarketplaceHome";
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
  if (locale === "en") return legacy;
  const [categories, manufacturers] = await Promise.all([
    publicApi<Category[]>("categories/").catch(() => []),
    publicApi<Manufacturer[]>("manufacturers/").catch(() => [])
  ]);
  return <MarketplaceHome locale={locale} cms={cms} medicines={pages.flatMap(page => page.results)}
    categories={categories} manufacturers={manufacturers} />;
}
