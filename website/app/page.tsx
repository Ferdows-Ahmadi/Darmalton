import Image from "next/image";
import Link from "next/link";

import { HeroCarousel } from "@/components/HeroCarousel";
import { MedicineCard } from "@/components/MedicineCard";
import { PublicAnnouncements } from "@/components/PublicAnnouncements";
import { State } from "@/components/StoreUI";
import { textFor, type Locale, type TextKey } from "@/lib/locale";
import { publicHomeCms } from "@/lib/public-cms";
import { publicApi } from "@/lib/server-api";
import { serverLocale } from "@/lib/server-locale";
import {
  groupMedicineFamilies,
  shopperCategories,
  shopperCategoryLabel,
  type MedicineFamily
} from "@/lib/storefront";
import type { Medicine, PageResult } from "@/lib/types";

function ProductRail({ title, families, href = "/shop" }: {
  title: string;
  families: MedicineFamily[];
  href?: string;
}) {
  if (!families.length) return null;
  return <section className="section merchandise-section">
    <div className="section-heading">
      <h2>{title}</h2>
      <Link href={href} aria-label={title}><span aria-hidden="true">↗</span></Link>
    </div>
    <div className="product-rail">
      {families.slice(0, 6).map((family) => <MedicineCard
        key={family.code}
        medicine={family.medicine}
        variants={family.variants}
      />)}
    </div>
  </section>;
}

function takeUnused(
  source: MedicineFamily[],
  used: Set<string>,
  count = 6,
  predicate: (family: MedicineFamily) => boolean = () => true
) {
  const selected = source.filter(
    (family) => !used.has(family.code) && predicate(family)
  ).slice(0, count);
  selected.forEach((family) => used.add(family.code));
  return selected;
}

function editorialCopy(locale: Locale) {
  if (locale === "en") return {
    prescriptionTitle: "Your prescription, reviewed privately",
    prescriptionBody: "Send a clear photo or PDF to the pharmacy team.",
    vitaminsTitle: "Daily vitamins & supplements",
    vitaminsBody: "Browse the current wellness range.",
    familyTitle: "Care for every day",
    familyBody: "Explore practical pharmacy essentials for home and family.",
    appBody: "Browse products and keep orders together on Android.",
    coming: "iOS coming soon"
  };
  if (locale === "ps-AF") return {
    prescriptionTitle: "ستاسو نسخه، په محرم ډول ارزول کېږي",
    prescriptionBody: "روښانه انځور یا PDF د درملتون ډلې ته واستوئ.",
    vitaminsTitle: "ورځني ویټامینونه او بشپړوونکي",
    vitaminsBody: "د هوساینې اوسني توکي وګورئ.",
    familyTitle: "د هرې ورځې پاملرنه",
    familyBody: "د کور او کورنۍ لپاره د درملتون عملي توکي وګورئ.",
    appBody: "په اندروید کې توکي وګورئ او فرمایشونه یوځای وساتئ.",
    coming: "iOS ژر راځي"
  };
  return {
    prescriptionTitle: "نسخه شما، با بررسی محرمانه",
    prescriptionBody: "عکس واضح یا PDF را برای تیم داروخانه بفرستید.",
    vitaminsTitle: "ویتامین‌ها و مکمل‌های روزانه",
    vitaminsBody: "مجموعه فعلی تندرستی را ببینید.",
    familyTitle: "مراقبت برای هر روز",
    familyBody: "لوازم کاربردی داروخانه برای خانه و خانواده را ببینید.",
    appBody: "در اندروید محصولات را ببینید و سفارش‌ها را یک‌جا نگه دارید.",
    coming: "نسخه iOS به‌زودی"
  };
}

export default async function Home() {
  const locale = await serverLocale();
  const t = (key: TextKey) => textFor(locale, key);
  const [{ heroes, announcements, featuredMedicines, articles }, ...pages] =
    await Promise.all([
      publicHomeCms(),
      ...[1, 2, 3, 4, 5].map((page) =>
        publicApi<PageResult<Medicine>>(`medicines/?family_listing=true&ordering=name&page=${page}`).catch(() => null)
      )
    ]);
  const allFamilies = groupMedicineFamilies(pages.flatMap((page) => page?.results || []));
  const used = new Set<string>();
  const cmsFamilies = groupMedicineFamilies(featuredMedicines.map(({ medicine }) => medicine))
    .map((family) => allFamilies.find(({ code }) => code === family.code) || family);
  const featured = cmsFamilies.length ? takeUnused(cmsFamilies, used) : takeUnused(allFamilies, used);
  const popular = takeUnused(allFamilies, used);
  const vitamins = takeUnused(allFamilies, used, 6, ({ medicine }) => medicine.shopper_category === "vitamins-supplements");
  const familyCare = takeUnused(allFamilies, used, 6, ({ medicine }) =>
    ["personal-care", "baby-care", "skin-care", "medicines"].includes(medicine.shopper_category)
  );
  const more = takeUnused(allFamilies, used);
  const copy = editorialCopy(locale);

  return <>
    <PublicAnnouncements announcements={announcements} />
    <HeroCarousel slides={heroes} />
    <div className="wrap home-content">
      <section className="rx-strip home-rx-strip">
        <span className="rx-icon-orbit"><Image src="/icons/ICON-005_Prescription-Upload.webp" alt="" width={58} height={58} /></span>
        <div><p className="eyebrow">{t("privateRx")}</p><h2>{t("haveRx")}</h2><p>{t("rxBody")}</p></div>
        <Link href="/prescriptions/upload" className="button">{t("rx")}</Link>
      </section>

      <section className="section category-section">
        <div className="section-heading"><h2>{t("shopperCategories")}</h2><Link href="/categories">{t("viewAll")}</Link></div>
        <div className="category-rail">
          {shopperCategories.map((category) => <Link className="category-tile" key={category.slug} href={`/shop?shopper_category=${category.slug}`}>
            <Image src={category.image} alt="" width={260} height={180} sizes="(max-width: 767px) 116px, 16vw" />
            <strong>{shopperCategoryLabel(category, locale)}</strong>
          </Link>)}
        </div>
      </section>

      {allFamilies.length ? <>
        <ProductRail title={t("products")} families={featured} />
        <section className="editorial-mosaic section">
          <Link className="editorial-card editorial-rx" href="/prescriptions/upload">
            <Image src="/campaigns/WEB-022_Prescription-Support_Campaign-Banner.webp" alt="" fill sizes="(max-width: 767px) 100vw, 55vw" />
            <span><strong>{copy.prescriptionTitle}</strong><small>{copy.prescriptionBody}</small></span>
          </Link>
          <Link className="editorial-card editorial-vitamins" href="/shop?shopper_category=vitamins-supplements">
            <Image src="/campaigns/WEB-021_Daily-Wellness_Campaign-Banner.webp" alt="" fill sizes="(max-width: 767px) 100vw, 45vw" />
            <span><strong>{copy.vitaminsTitle}</strong><small>{copy.vitaminsBody}</small></span>
          </Link>
        </section>
        <ProductRail title={t("popularMedicines")} families={popular} />
        <ProductRail title={t("vitaminsSupplements")} families={vitamins} href="/shop?shopper_category=vitamins-supplements" />
        <Link className="wide-campaign section" href="/categories">
          <Image src="/campaigns/WEB-024_Home-and-Family_Campaign-Banner.webp" alt="" fill sizes="100vw" />
          <span><strong>{copy.familyTitle}</strong><small>{copy.familyBody}</small><b>{t("viewAll")} <span aria-hidden="true">↗</span></b></span>
        </Link>
        <ProductRail title={t("personalFamilyCare")} families={familyCare} />
        <ProductRail title={t("related")} families={more} />
      </> : <State kind="error" title="unavailable" body="connection" />}

      {articles.length > 0 && <section className="section">
        <div className="section-heading"><h2>{t("health")}</h2><Link href="/health">{t("viewAll")}</Link></div>
        <div className="content-grid">{articles.map((article) => <Link href={`/health/${article.slug}`} key={article.id} className="panel article-teaser">
          <p className="eyebrow">{t("health")}</p><h3>{locale === "en" ? article.title : article.title_dari || article.title}</h3>
        </Link>)}</div>
      </section>}

      <section className="home-app-promo section">
        <div><p className="eyebrow">{t("app")}</p><h2>{t("appTitle")}</h2><p>{copy.appBody}</p><div className="actions"><Link className="button" href="/app">{t("android")}</Link><span>{copy.coming}</span></div></div>
        <Image className="home-app-phones" src="/app/APP-01_Hero_Dual_Phones.png" alt="" width={488} height={404} />
      </section>
    </div>
  </>;
}
