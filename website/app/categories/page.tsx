import { CategoryDirectory } from "@/components/DirectoryPage";
import { textFor } from "@/lib/locale";
import { publicApi } from "@/lib/server-api";
import { serverLocale } from "@/lib/server-locale";
import type { Category } from "@/lib/types";
import styles from "./categories.module.css";

export default async function CategoriesPage() {
  const locale = await serverLocale();
  const categories = await publicApi<Category[]>("categories/").catch(() => []);
  return (
    <div className={styles.categories}>
    <CategoryDirectory
      categories={categories}
      locale={locale}
      title={textFor(locale, "categories")}
      intro={textFor(locale, "browse")}
    />
    </div>
  );
}
