import Image from "next/image";
import Link from "next/link";

import { textFor, type Locale } from "@/lib/locale";
import {
  categoryImage,
  manufacturerName,
  shopperHealthNeeds,
  shopperCategories,
  shopperCategoryLabel
} from "@/lib/storefront";
import type { Category, Manufacturer } from "@/lib/types";
import { State } from "./StoreUI";

export function CategoryDirectory({
  categories,
  locale,
  title,
  intro
}: {
  categories: Category[];
  locale: Locale;
  title: string;
  intro: string;
}) {
  const healthNeeds = shopperHealthNeeds(categories, locale);
  return <>
    <header className="page-heading page-heading-categories category-page-heading">
      <div className="wrap"><div className="crumb"><Link href="/">{textFor(locale, "home")}</Link><span aria-hidden="true"> / </span><span>{title}</span></div><p className="page-heading-eyebrow">Darmalton</p><h1>{title}</h1><p>{intro}</p></div>
    </header>
    <section className="page-section category-directory">
      <div className="section-heading"><h2>{textFor(locale, "shopperCategories")}</h2></div>
      <div className="shopper-category-grid">
        {shopperCategories.map(category => <Link
          className="category-tile shopper-category-tile"
          href={`/shop?shopper_category=${category.slug}`}
          key={category.slug}
        >
          <Image className="media-editorial" src={category.image} alt="" width={420} height={260} sizes="(max-width: 767px) 50vw, 18vw"/>
          <strong>{shopperCategoryLabel(category, locale)}</strong>
        </Link>)}
      </div>
      <div className="section-heading health-need-heading"><h2>{textFor(locale, "healthNeeds")}</h2></div>
      {healthNeeds.length ? <div className="health-need-grid">
        {healthNeeds.map(need => <Link className="health-need-card" href={need.href} key={need.key}>
          <span className="health-need-image"><Image src={need.image || categoryImage(need.category.name)} alt="" fill sizes="72px"/></span>
          <strong>{need.label}</strong>
          <span aria-hidden="true">›</span>
        </Link>)}
      </div> : <State title="noResults" body="trySearch"/>}
    </section>
  </>;
}

export function ManufacturerDirectory({
  manufacturers,
  locale,
  title,
  intro
}: {
  manufacturers: Manufacturer[];
  locale: Locale;
  title: string;
  intro: string;
}) {
  return <>
    <header className="page-heading page-heading-manufacturers"><div className="wrap"><div className="crumb"><Link href="/">{textFor(locale, "home")}</Link><span aria-hidden="true"> / </span><span>{title}</span></div><p className="page-heading-eyebrow">Darmalton</p><h1>{title}</h1><p>{intro}</p></div></header>
    <section className="page-section">
      {manufacturers.length ? <div className="manufacturer-grid">
        {manufacturers.map(manufacturer => <Link
          className="panel manufacturer-card"
          href={`/manufacturers/${encodeURIComponent(manufacturer.name)}`}
          key={manufacturer.id}
        >
          {manufacturer.logo_url
            ? <span className="manufacturer-logo"><Image className="media-logo" src={manufacturer.logo_url} alt="" fill sizes="52px"/></span>
            : <span className="manufacturer-mark" aria-hidden="true">{manufacturer.name.slice(0, 1).toUpperCase()}</span>}
          <span><strong><bdi>{manufacturerName(manufacturer, locale)}</bdi></strong><small>{manufacturer.product_count} {textFor(locale, "results")}</small></span>
        </Link>)}
      </div> : <State title="noResults" body="trySearch"/>}
    </section>
  </>;
}
