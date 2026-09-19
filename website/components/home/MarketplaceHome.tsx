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
const campaigns: Campaign[] = [
  { title: "نسخه‌تان را بفرستید", detail: "بررسی محرمانه توسط تیم داروخانه", href: "/prescriptions/upload", image: "/campaigns/WEB-022_Prescription-Support_Campaign-Banner.webp", tone: "blue" },
  { title: "ویتامین‌ها و مکمل‌ها", detail: "مجموعه فعلی درملتون", href: "/shop?shopper_category=vitamins-supplements", image: "/campaigns/WEB-021_Daily-Wellness_Campaign-Banner.webp", tone: "cream" },
  { title: "داروخانه، همیشه همراه", detail: "محصولات را در اندروید ببینید", href: "/app", image: "/app/APP-01_Hero_Dual_Phones.png", tone: "navy" },
  { title: "سفارش از داروخانه", detail: "داروها و محصولات صحی", href: "/shop", image: "/campaigns/WEB-023_Pharmacy-Essentials_Campaign-Banner.webp", tone: "rose" }
];

function CampaignTile({ campaign }: { campaign: Campaign }) {
  return <Link href={campaign.href} className={`${styles.campaign} ${styles[campaign.tone || "cream"]}`}>
    <Image src={campaign.image} alt="" fill sizes="44vw" />
    <span><strong>{campaign.title}</strong><small>{campaign.detail}</small><b aria-hidden="true">مشاهده ←</b></span>
  </Link>;
}

function Rail({ title, families, tone = "plain", href = "/shop", subtitle }: {
  title: string; families: MedicineFamily[]; tone?: "rose" | "cream" | "green" | "plain";
  href?: string; subtitle?: string;
}) {
  if (!families.length) return null;
  const band = tone === "rose" || tone === "green";
  return <section aria-label={title} className={`${styles.rail} ${styles[tone]} ${band ? styles.band : ""} ${families.length > 8 ? styles.nine : ""} ${families.length < 4 ? styles.sparse : ""}`}>
    <header className={styles.railHeading}>
      {band && <span className={styles.railSymbol} aria-hidden="true">✚</span>}
      <h2>{title}</h2>{subtitle && <p>{subtitle}</p>}
      <Link href={href}>مشاهده همه <span aria-hidden="true">←</span></Link>
    </header>
    <div className={styles.track}>
      {families.map(family => <MedicineCard key={family.code} medicine={family.medicine}
        variants={family.variants} presentation="marketplace" />)}
    </div>
  </section>;
}

export function MarketplaceHome({ cms, medicines, categories, manufacturers }: {
  cms: Awaited<ReturnType<typeof publicHomeCms>>; medicines: Medicine[];
  categories: Category[]; manufacturers: Manufacturer[];
}) {
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
  const needs = shopperHealthNeeds(categories, "fa-AF");
  const brands = manufacturers.filter(manufacturer => manufacturer.product_count > 0);
  const shortcuts = [
    ...activeCategories.map(category => ({ title: shopperCategoryLabel(category, "fa-AF"), href: `/shop?shopper_category=${category.slug}`, image: category.image })),
    { title: "ارسال نسخه", href: "/prescriptions/upload", image: "/icons/ICON-005_Prescription-Upload.webp" },
    { title: "تولیدکنندگان", href: "/manufacturers", image: "/icons/ICON-006_Licensed-Pharmacy.webp" },
    { title: "پیگیری سفارش", href: "/orders", image: "/icons/ICON-002_Account.webp" },
    { title: "راهنمای خرید", href: "/help", image: "/icons/ICON-010_Customer-Support.webp" },
    { title: "اپلیکیشن درملتون", href: "/app", image: "/brand/android-icon.png" },
    { title: "همه دسته‌ها", href: "/categories", image: "/icons/ICON-001_Search.webp" }
  ];

  return <div className={styles.home}>
    <PublicAnnouncements announcements={cms.announcements} />
    <div className={`${styles.hero} ${cms.heroes.length ? "" : styles.fallbackHero}`}><HeroCarousel slides={cms.heroes} imageSizes={cms.heroes.length ? "100vw" : "78vw"} /></div>
    <div className={styles.content}>
      <nav className={styles.shortcuts} aria-label="دسترسی سریع">
        {shortcuts.map((item, i) => <Link href={item.href} key={item.href}>
          <span className={styles.shortcutIcon} data-tone={i % 4}><Image src={item.image} alt="" width={48} height={48} /></span>
          <strong>{item.title}</strong>
        </Link>)}
      </nav>

      {families.length ? <>
        <Rail title="داروها و محصولات صحی" subtitle="از مجموعه درملتون" families={featured} tone="rose" />
        <div className={styles.fourBanners}>{campaigns.map(campaign => <CampaignTile key={campaign.href} campaign={campaign} />)}</div>
        <Rail title="ویتامین‌ها و مکمل‌ها" href="/shop?shopper_category=vitamins-supplements" families={supplements} tone="cream" />
        <div className={styles.serviceBanners}>
          <Link href="/prescription-help"><Image src="/icons/ICON-005_Prescription-Upload.webp" alt="" width={65} height={65} /><span><strong>نسخه دارید؟</strong><small>راهنمای ارسال عکس یا PDF نسخه</small></span><b aria-hidden="true">←</b></Link>
          <Link href="/delivery-policy"><Image src="/icons/ICON-009_Secure-Checkout.webp" alt="" width={65} height={65} /><span><strong>تحویل و سفارش</strong><small>شرایط ارسال و پرداخت را بخوانید</small></span><b aria-hidden="true">←</b></Link>
          <Link href="/account/orders"><Image src="/icons/ICON-002_Account.webp" alt="" width={65} height={65} /><span><strong>سفارش‌های من</strong><small>وضعیت سفارش‌ها در حساب شما</small></span><b aria-hidden="true">←</b></Link>
        </div>
        <Rail title="محصولات بدون نسخه" subtitle="مشاهده و انتخاب محصول" families={nonRx} tone="green" />
      </> : <State kind="error" title="unavailable" body="connection" />}

      {needs.length > 0 && <section className={styles.discovery} aria-label="دسته‌های داروخانه">
        <div className={styles.smallHeading}><h2>در داروخانه جستجو کنید</h2><Link href="/categories">همه دسته‌ها ←</Link></div>
        <div>{needs.map(need => <Link href={need.href} key={need.key}><span><Image src={need.image} alt="" fill sizes="76px" /></span><strong>{need.label}</strong></Link>)}</div>
      </section>}

      <div className={styles.twoBanners}>
        <CampaignTile campaign={{ title: "مراقبت برای هر روز", detail: "محصولات داروخانه را بر اساس دسته‌بندی پیدا کنید", href: "/categories", image: "/campaigns/WEB-024_Home-and-Family_Campaign-Banner.webp", tone: "cream" }} />
        <CampaignTile campaign={{ ...campaigns[0], title: "نسخه شما، با بررسی محرمانه", detail: "عکس واضح یا PDF را برای تیم داروخانه بفرستید" }} />
      </div>

      {remainingRails.map((rail, index) => <div className={styles.merchandiseGroup} key={rail[0].code}>
        <Rail title={index === 0 ? "بیشتر از داروخانه" : "ادامه محصولات درملتون"} families={rail} />
        {index === 0 && brands.length > 0 && <section className={styles.brands} aria-label="تولیدکنندگان">
          <div className={styles.smallHeading}><h2>تولیدکنندگان</h2><Link href="/manufacturers">مشاهده همه ←</Link></div>
          <div>{brands.slice(0, 8).map(brand => <Link href={`/manufacturers/${encodeURIComponent(brand.name)}`} key={brand.id}>
            {brand.logo_url ? <Image src={brand.logo_url} alt="" width={75} height={35} /> : <bdi>{manufacturerName(brand, "fa-AF")}</bdi>}
          </Link>)}</div>
        </section>}
        {index === 1 && <div className={styles.twoBanners}>
          <CampaignTile campaign={{ ...campaigns[1], title: "مجموعه مکمل‌های درملتون" }} />
          <CampaignTile campaign={{ ...campaigns[3], title: "محصول مورد نظر را پیدا کنید" }} />
        </div>}
      </div>)}

      <section className={styles.helpGrid} aria-label="خدمات درملتون">
        {[
          { title: "نسخه و داروخانه", links: [["ارسال نسخه", "/prescriptions/upload"], ["نسخه‌های من", "/account/prescriptions"], ["راهنمای نسخه", "/prescription-help"]] },
          { title: "خرید و سفارش", links: [["جستجوی محصولات", "/shop"], ["سبد خرید", "/cart"], ["تحویل و سفارش", "/delivery-policy"]] },
          { title: "حساب شما", links: [["ورود به حساب", "/login"], ["سفارش‌های من", "/account/orders"], ["آدرس‌های من", "/account/addresses"]] },
          { title: "پاسخ به پرسش‌ها", links: [["راهنمای خرید", "/help"], ["پرسش‌های متداول", "/faq"], ["تماس با ما", "/contact"]] }
        ].map(group => <div key={group.title}><h2>{group.title}</h2>{group.links.map(([label, href]) => <Link href={href} key={href}>{label}<span aria-hidden="true">←</span></Link>)}</div>)}
      </section>

      {cms.articles.length > 0 && <section className={styles.articles} aria-label="مطالب صحی">
        {cms.articles.map(article => <Link href={`/health/${article.slug}`} key={article.id}>{article.title_dari || article.title}<span aria-hidden="true">←</span></Link>)}
      </section>}

      <Link href="/app" className={styles.appBar}>
        <Image src="/brand/android-icon.png" alt="" width={44} height={44} />
        <strong>درملتون در موبایل شما</strong><span>محصولات، نسخه‌ها و سفارش‌ها در یک‌جا</span><b>دریافت اپ اندروید ←</b>
      </Link>
    </div>
  </div>;
}
