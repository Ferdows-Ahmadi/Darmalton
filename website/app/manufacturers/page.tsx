import { ManufacturerDirectory } from "@/components/DirectoryPage";
import { textFor } from "@/lib/locale";
import { publicApi } from "@/lib/server-api";
import { serverLocale } from "@/lib/server-locale";
import type { Manufacturer } from "@/lib/types";
import styles from "./manufacturers.module.css";

export default async function ManufacturersPage() {
  const locale = await serverLocale();
  const manufacturers = await publicApi<Manufacturer[]>("manufacturers/").catch(
    () => []
  );
  return (
    <div className={locale === "fa-AF" ? styles.manufacturers : undefined}>
    <ManufacturerDirectory
      manufacturers={manufacturers}
      locale={locale}
      title={textFor(locale, "manufacturers")}
      intro={textFor(locale, "browse")}
    />
    </div>
  );
}
