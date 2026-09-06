import Image from "next/image";
import Link from "next/link";

import { MedicineCard } from "@/components/MedicineCard";
import { PublicAnnouncements } from "@/components/PublicAnnouncements";
import { State } from "@/components/StoreUI";
import { textFor } from "@/lib/locale";
import { publicHomeCms } from "@/lib/public-cms";
import { publicApi } from "@/lib/server-api";
import { serverLocale } from "@/lib/server-locale";
import { categoryImage } from "@/lib/storefront";
import type { Category, Medicine, PageResult } from "@/lib/types";

export default async function Home() {
  const locale = await serverLocale();
  const t = (key: Parameters<typeof textFor>[1]) => textFor(locale, key);
  const [{ hero, announcements, featuredMedicines, articles }, categories, catalogue] =
    await Promise.all([
      publicHomeCms(),
      publicApi<Category[]>("categories/").catch(() => []),
      publicApi<PageResult<Medicine>>("medicines/?ordering=name").catch(() => null)
    ]);
  const products =
    featuredMedicines.length > 0
      ? featuredMedicines.map(({ medicine }) => medicine)
      : catalogue?.results.slice(0, 6) || [];
  const heroTitle =
    locale === "en" ? hero?.title : hero?.title_dari || hero?.title;

  return (
    <>
      <PublicAnnouncements announcements={announcements} />
      <section className="hero">
        <div className="hero-photo">
          <Image
            src={hero?.image_url || "/campaigns/health-delivered.webp"}
            alt=""
            fill
            priority
            sizes="(max-width: 767px) 65vw, 60vw"
          />
        </div>
        <div className="wrap">
          <div className="hero-copy">
            <p className="eyebrow">{t("heroKicker")}</p>
            <h1>{heroTitle || t("heroTitle")}</h1>
            <p>{t("heroBody")}</p>
            <div className="actions">
              <Link className="button" href="/shop">
                {t("shop")}
              </Link>
              <Link className="button secondary" href="/prescriptions/upload">
                {t("rx")}
              </Link>
            </div>
          </div>
        </div>
      </section>
      <div className="wrap">
        <section className="rx-strip">
          <Image
            src="/icons/ICON-005_Prescription-Upload.webp"
            alt=""
            width={46}
            height={46}
          />
          <div>
            <h2>{t("haveRx")}</h2>
            <p>{t("rxBody")}</p>
          </div>
          <Link href="/prescriptions/upload" className="button">
            {t("rx")}
          </Link>
        </section>

        {categories.length > 0 && (
          <section className="section">
            <div className="section-heading">
              <h2>{t("categories")}</h2>
              <Link href="/categories">
                {t("viewAll")} <span aria-hidden="true">›</span>
              </Link>
            </div>
            <div className="category-rail">
              {categories.slice(0, 6).map((category) => (
                <Link
                  className="category-tile"
                  key={category.id}
                  href={`/categories/${category.slug}`}
                >
                  <Image
                    src={category.image_url || categoryImage(category.name)}
                    alt=""
                    width={220}
                    height={150}
                    sizes="(max-width: 767px) 76px, 200px"
                  />
                  <strong>
                    {locale === "en"
                      ? category.name
                      : category.name_dari || category.name}
                  </strong>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <div className="section-heading">
            <h2>{t("products")}</h2>
            <Link href="/shop">{t("viewAll")}</Link>
          </div>
          {products.length ? (
            <div className="product-rail">
              {products.map((medicine) => (
                <MedicineCard key={medicine.id} medicine={medicine} />
              ))}
            </div>
          ) : (
            <State kind="error" title="unavailable" body="connection" />
          )}
        </section>

        <section className="campaign-grid section">
          {[
            ["wellness", "WEB-021_Daily-Wellness_Campaign-Banner"],
            ["family", "WEB-024_Home-and-Family_Campaign-Banner"]
          ].map(([key, image]) => (
            <div className="campaign" key={key}>
              <Image
                src={`/campaigns/${image}.webp`}
                alt=""
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
              />
              <div>
                <h2>{t(key as "wellness" | "family")}</h2>
                <p>{t("browse")}</p>
                <Link className="button" href="/shop">
                  {t("shop")}
                </Link>
              </div>
            </div>
          ))}
        </section>

        {(catalogue?.results.length || 0) > 6 && (
          <section className="section">
            <div className="section-heading">
              <h2>{t("related")}</h2>
              <Link href="/shop">{t("viewAll")}</Link>
            </div>
            <div className="product-rail">
              {catalogue!.results.slice(6, 12).map((medicine) => (
                <MedicineCard key={medicine.id} medicine={medicine} />
              ))}
            </div>
          </section>
        )}

        {articles.length > 0 && (
          <section className="section">
            <div className="section-heading">
              <h2>{t("health")}</h2>
              <Link href="/health">{t("viewAll")}</Link>
            </div>
            <div className="content-grid">
              {articles.map((article) => (
                <Link
                  href={`/health/${article.slug}`}
                  key={article.id}
                  className="panel"
                >
                  <h3>
                    {locale === "en"
                      ? article.title
                      : article.title_dari || article.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="rx-strip">
          <div>
            <h2>{t("story")}</h2>
            <p>{t("storyBody")}</p>
          </div>
          <Link className="button secondary" href="/about">
            {t("about")}
          </Link>
        </section>
      </div>
    </>
  );
}
