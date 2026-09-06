import { CategoryDirectory } from "@/components/DirectoryPage";
import { textFor } from "@/lib/locale";
import { publicApi } from "@/lib/server-api";
import { serverLocale } from "@/lib/server-locale";
import type { Category } from "@/lib/types";

export default async function CategoriesPage() {
  const locale = await serverLocale();
  const categories = await publicApi<Category[]>("categories/").catch(() => []);
  return (
    <CategoryDirectory
      categories={categories}
      locale={locale}
      title={textFor(locale, "categories")}
      intro={textFor(locale, "browse")}
    />
  );
}
