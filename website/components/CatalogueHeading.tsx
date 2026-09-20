import Link from "next/link";
import { formatNumber, textFor, type Locale } from "@/lib/locale";

export function CatalogueHeading({ title, parent, count, locale }: {
  title: string;
  parent: "categories" | "manufacturers";
  count?: number;
  locale: Locale;
}) {
  return <header className="page-heading"><div className="wrap">
    <div className="crumb">
      <Link href="/">{textFor(locale, "home")}</Link><span aria-hidden="true"> / </span>
      <Link href={`/${parent}`}>{textFor(locale, parent)}</Link><span aria-hidden="true"> / </span>
      <bdi>{title}</bdi>
    </div>
    <h1><bdi>{title}</bdi></h1>
    {count !== undefined && <p>{formatNumber(count, locale)} {textFor(locale, "results")}</p>}
  </div></header>;
}
