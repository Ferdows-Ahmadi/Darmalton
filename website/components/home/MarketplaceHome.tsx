import { marketplaceText, type MarketplaceLocale, type MarketplaceTextKey } from "@/lib/marketplace-copy";
import { cmsText } from "@/lib/cms-locale";
import Image from "next/image";
import Link from "next/link";
import { HeroCarousel } from "@/components/HeroCarousel";
import { MedicineCard } from "@/components/MedicineCard";
import { PublicAnnouncements } from "@/components/PublicAnnouncements";
import { State } from "@/components/StoreUI";
import type { publicHomeCms } from "@/lib/public-cms";
import { groupMedicineFamilies, manufacturerName, shopperCategories, shopperCategoryLabel,
  shopperHealthNeeds, type MedicineFamily } from "@/lib/storefront";
import type { Category, Manufacturer, Medicine } from "@/lib/types";
import styles from "./MarketplaceHome.module.css";

type Campaign = { title: string; detail: string; href: string; image: string; tone?: string };


function CampaignTile({ campaign, locale }: { campaign: Campaign; locale: MarketplaceLocale }) {
  const t = (key: MarketplaceTextKey) => marketplaceText(locale, key);
  return <Link href={campaign.href} className={`${styles.campaign} ${styles[campaign.tone || "cream"]}`}>
    <Image src={campaign.image} alt="" fill sizes="44vw" />
    <span><strong>{campaign.title}</strong><small>{campaign.detail}</small><b aria-hidden="true">{t("view")} ←</b></span>
  </Link>;
}

function Rail({ title, families, tone = "plain", href = "/shop", subtitle, locale }: {
  title: string; families: MedicineFamily[]; tone?: "rose" | "cream" | "green" | "plain";
  href?: string; subtitle?: string; locale: MarketplaceLocale;
}) {
  const t = (key: MarketplaceTextKey) => marketplaceText(locale, key);
  if (!families.length) return null;
  const band = tone === "rose" || tone === "green";
  return <section aria-label={title} className={`${styles.rail} ${styles[tone]} ${band ? styles.band : ""} ${families.length > 8 ? styles.nine : ""} ${families.length < 4 ? styles.sparse : ""}`}>
    <header className={styles.railHeading}>
      {band && <span className={styles.railSymbol} aria-hidden="true">✚</span>}
      <h2>{title}</h2>{subtitle && <p>{subtitle}</p>}
      <Link href={href}>{t("viewAll")} <span aria-hidden="true">←</span></Link>
    </header>
    <div className={styles.track}>
      {families.map(family => <MedicineCard key={family.code} medicine={family.medicine}
        variants={family.variants} presentation="marketplace" />)}
    </div>
  </section>;
}

export function MarketplaceHome({ cms, medicines, categories, manufacturers, locale }: {
  cms: Awaited<ReturnType<typeof publicHomeCms>>; medicines: Medicine[];
  categories: Category[]; manufacturers: Manufacturer[]; locale: MarketplaceLocale;
}) {
  const t = (key: MarketplaceTextKey) => marketplaceText(locale, key);
  const campaigns: Campaign[] = [
  { title: t("sendPrescription"), detail: t("privateReview"), href: "/prescriptions/upload", image: "/campaigns/WEB-022_Prescription-Support_Campaign-Banner.webp", tone: "blue" },
  { title: t("vitamins"), detail: t("currentRange"), href: "/shop?shopper_category=vitamins-supplements", image: "/campaigns/WEB-021_Daily-Wellness_Campaign-Banner.webp", tone: "cream" },
  { title: t("pharmacyWithYou"), detail: t("browseAndroid"), href: "/app", image: "/app/APP-01_Hero_Dual_Phones.png", tone: "navy" },
  { title: t("orderPharmacy"), detail: t("products"), href: "/shop", image: "/campaigns/WEB-023_Pharmacy-Essentials_Campaign-Banner.webp", tone: "rose" }
];
  const families = groupMedicineFamilies(medicines);
  const used = new Set<string>();
  const take = (source: MedicineFamily[], count: number) => {
    const selected = source.filter(family => !used.has(family.code)).slice(0, count);
    selected.forEach(family => used.add(family.code));
    return selected;
  };
  const cmsFamilies = groupMedicineFamilies(cms.featuredMedicines.map(item => item.medicine))
    .map(family => families.find(item => item.code === family.code) || family);
  const drugFamilies = families.filter(family => family.medicine.shopper_category === "medicines");
  const supplementFamilies = families.filter(family => family.medicine.shopper_category === "vitamins-supplements");
  const featured = take(cmsFamilies.length ? cmsFamilies : drugFamilies, 7);
  const supplements = take(supplementFamilies, 8);
  const nonRx = take(families.filter(family => family.variants.every(variant => !variant.prescription_required)), 7);
  const additional = take(families, families.length);
  const remainingRails = Array.from({ length: Math.ceil(additional.length / 9) }, (_, i) => additional.slice(i * 9, i * 9 + 9));
  const activeCategories = shopperCategories.filter(category => families.some(family => family.medicine.shopper_category === category.slug));
  const needs = shopperHealthNeeds(categories, locale);
  const brands = manufacturers.filter(manufacturer => manufacturer.product_count > 0);
  const shortcuts = [
    ...activeCategories.map(category => ({ title: shopperCategoryLabel(category, locale), href: `/shop?shopper_category=${category.slug}`, image: category.image })),
    { title: t("rx"), href: "/prescriptions/upload", image: "/icons/ICON-005_Prescription-Upload.webp" },
    { title: t("manufacturers"), href: "/manufacturers", image: "/icons/ICON-006_Licensed-Pharmacy.webp" },
    { title: t("trackOrder"), href: "/orders", image: "/icons/ICON-002_Account.webp" },
    { title: t("shoppingHelp"), href: "/help", image: "/icons/ICON-010_Customer-Support.webp" },
    { title: t("app"), href: "/app", image: "/brand/android-icon.png" },
    { title: t("allCategories"), href: "/categories", image: "/icons/ICON-001_Search.webp" }
  ];

  return <div className={styles.home}>
    <PublicAnnouncements locale={locale} announcements={cms.announcements} />
    <div className={`${styles.hero} ${cms.heroes.length ? "" : styles.fallbackHero}`}><HeroCarousel slides={cms.heroes} imageSizes={cms.heroes.length ? "100vw" : "78vw"} /></div>
    <div className={styles.content}>
      <nav className={styles.shortcuts} aria-label={t("shortcuts")}>
        {shortcuts.map((item, i) => <Link href={item.href} key={item.href}>
          <span className={styles.shortcutIcon} data-tone={i % 4}><Image src={item.image} alt="" width={48} height={48} /></span>
          <strong>{item.title}</strong>
        </Link>)}
      </nav>

      {families.length ? <>
        <Rail locale={locale} title={t("products")} subtitle={t("fromRange")} families={featured} tone="rose" />
        <div className={styles.fourBanners}>{campaigns.map(campaign => <CampaignTile locale={locale} key={campaign.href} campaign={campaign} />)}</div>
        <Rail locale={locale} title={t("vitamins")} href="/shop?shopper_category=vitamins-supplements" families={supplements} tone="cream" />
        <div className={styles.serviceBanners}>
          <Link href="/prescription-help"><Image src="/icons/ICON-005_Prescription-Upload.webp" alt="" width={65} height={65} /><span><strong>{t("haveRx")}</strong><small>{t("rxGuideBody")}</small></span><b aria-hidden="true">←</b></Link>
          <Link href="/delivery-policy"><Image src="/icons/ICON-009_Secure-Checkout.webp" alt="" width={65} height={65} /><span><strong>{t("delivery")}</strong><small>{t("deliveryBody")}</small></span><b aria-hidden="true">←</b></Link>
          <Link href="/account/orders"><Image src="/icons/ICON-002_Account.webp" alt="" width={65} height={65} /><span><strong>{t("orders")}</strong><small>{t("ordersBody")}</small></span><b aria-hidden="true">←</b></Link>
        </div>
        <Rail locale={locale} title={t("nonRx")} subtitle={t("chooseProduct")} families={nonRx} tone="green" />
      </> : <State kind="error" title="unavailable" body="connection" />}

      {needs.length > 0 && <section className={styles.discovery} aria-label={t("pharmacyCategories")}>
        <div className={styles.smallHeading}><h2>{t("browsePharmacy")}</h2><Link href="/categories">{t("allCategories")} ←</Link></div>
        <div>{needs.map(need => <Link href={need.href} key={need.key}><span><Image src={need.image} alt="" fill sizes="76px" /></span><strong>{need.label}</strong></Link>)}</div>
      </section>}

      <div className={styles.twoBanners}>
        <CampaignTile locale={locale} campaign={{ title: t("dailyCare"), detail: t("findByCategory"), href: "/categories", image: "/campaigns/WEB-024_Home-and-Family_Campaign-Banner.webp", tone: "cream" }} />
        <CampaignTile locale={locale} campaign={{ ...campaigns[0], title: t("privatePrescription"), detail: t("sendClearPhoto") }} />
      </div>

      {remainingRails.map((rail, index) => <div className={styles.merchandiseGroup} key={rail[0].code}>
        <Rail locale={locale} title={index === 0 ? t("moreProducts") : t("continuedProducts")} families={rail} />
        {index === 0 && brands.length > 0 && <section className={styles.brands} aria-label={t("manufacturers")}>
          <div className={styles.smallHeading}><h2>{t("manufacturers")}</h2><Link href="/manufacturers">{t("viewAll")} ←</Link></div>
          <div>{brands.slice(0, 8).map(brand => <Link href={`/manufacturers/${encodeURIComponent(brand.name)}`} key={brand.id}>
            {brand.logo_url ? <Image src={brand.logo_url} alt="" width={75} height={35} /> : <bdi>{manufacturerName(brand, locale)}</bdi>}
          </Link>)}</div>
        </section>}
        {index === 1 && <div className={styles.twoBanners}>
          <CampaignTile locale={locale} campaign={{ ...campaigns[1], title: t("supplementRange") }} />
          <CampaignTile locale={locale} campaign={{ ...campaigns[3], title: t("findProduct") }} />
        </div>}
      </div>)}

      <section className={styles.helpGrid} aria-label={t("services")}>
        {[
          { title: t("rxPharmacy"), links: [[t("rx"), "/prescriptions/upload"], [t("myPrescriptions"), "/account/prescriptions"], [t("rxHelp"), "/prescription-help"]] },
          { title: t("shoppingOrders"), links: [[t("searchProducts"), "/shop"], [t("cart"), "/cart"], [t("delivery"), "/delivery-policy"]] },
          { title: t("yourAccount"), links: [[t("signIn"), "/login"], [t("orders"), "/account/orders"], [t("myAddresses"), "/account/addresses"]] },
          { title: t("answers"), links: [[t("shoppingHelp"), "/help"], [t("faq"), "/faq"], [t("contactUs"), "/contact"]] }
        ].map(group => <div key={group.title}><h2>{group.title}</h2>{group.links.map(([label, href]) => <Link href={href} key={href}>{label}<span aria-hidden="true">←</span></Link>)}</div>)}
      </section>

      {cms.articles.length > 0 && <section className={styles.articles} aria-label={t("healthArticles")}>
        {cms.articles.map(article => <Link href={`/health/${article.slug}`} key={article.id}>{cmsText(article.title, article.title_dari, locale)}<span aria-hidden="true">←</span></Link>)}
      </section>}

      <Link href="/app" className={styles.appBar}>
        <Image src="/brand/android-icon.png" alt="" width={44} height={44} />
        <strong>{t("mobileApp")}</strong><span>{t("appBody")}</span><b>{t("getAndroid")} ←</b>
      </Link>
    </div>
  </div>;
}
