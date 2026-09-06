import Image from "next/image";
import Link from "next/link";

import { State } from "./StoreUI";
import type { Locale } from "@/lib/locale";
import { categoryImage } from "@/lib/storefront";
import type { Category, Manufacturer } from "@/lib/types";

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
  return (
    <>
      <header className="page-heading">
        <div className="wrap">
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </header>
      <section className="page-section">
        {categories.length ? (
          <div className="content-grid directory-grid">
            {categories.map((category) => (
              <Link
                className="category-tile"
                href={`/categories/${category.slug}`}
                key={category.id}
              >
                <Image
                  src={category.image_url || categoryImage(category.name)}
                  alt=""
                  width={420}
                  height={260}
                  sizes="(max-width: 767px) 50vw, 33vw"
                />
                <strong>
                  {locale === "en"
                    ? category.name
                    : category.name_dari || category.name}
                </strong>
              </Link>
            ))}
          </div>
        ) : (
          <State title="noResults" body="trySearch" />
        )}
      </section>
    </>
  );
}

export function ManufacturerDirectory({
  manufacturers,
  title,
  intro
}: {
  manufacturers: Manufacturer[];
  title: string;
  intro: string;
}) {
  return (
    <>
      <header className="page-heading">
        <div className="wrap">
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </header>
      <section className="page-section">
        {manufacturers.length ? (
          <div className="manufacturer-grid">
            {manufacturers.map((manufacturer) => (
              <Link
                className="panel manufacturer-card"
                href={`/manufacturers/${encodeURIComponent(manufacturer.name)}`}
                key={manufacturer.id}
              >
                <span className="manufacturer-mark" aria-hidden="true">
                  {manufacturer.name.slice(0, 1).toUpperCase()}
                </span>
                <strong>{manufacturer.name}</strong>
                {manufacturer.country_code && <small>{manufacturer.country_code}</small>}
              </Link>
            ))}
          </div>
        ) : (
          <State title="noResults" body="trySearch" />
        )}
      </section>
    </>
  );
}
