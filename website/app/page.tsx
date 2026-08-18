import Image from "next/image";
import Link from "next/link";

import { CmsActionLink } from "@/components/CmsActionLink";
import { CmsImage } from "@/components/CmsImage";
import { HealthArticleCard } from "@/components/HealthArticleCard";
import { MedicineCard } from "@/components/MedicineCard";
import { PublicAnnouncements } from "@/components/PublicAnnouncements";
import { publicHomeCms } from "@/lib/public-cms";

const benefits = [
  {
    icon: "Rx",
    title: "بررسی نسخه توسط فارمسیست",
    text: "نسخه شما به‌صورت محرمانه بررسی می‌شود و نتیجه آن را در حساب خود می‌بینید."
  },
  {
    icon: "۲۴",
    title: "تحویل سریع در کابل",
    text: "سفارش‌های تأییدشده با بسته‌بندی مناسب و وضعیت قابل پیگیری ارسال می‌شوند."
  },
  {
    icon: "✓",
    title: "داروهای معتبر",
    text: "موجودی، شماره بچ و تاریخ انقضا در سیستم داروخانه مدیریت و بررسی می‌شود."
  }
];

const steps = [
  ["۱", "محصول یا نسخه را بفرستید"],
  ["۲", "تأیید فارمسیست را دریافت کنید"],
  ["۳", "سفارش را ثبت و پیگیری کنید"]
];

const faqs = [
  [
    "آیا بدون حساب می‌توانم محصولات را ببینم؟",
    "بله. جستجو و مشاهده محصولات برای همه باز است؛ برای خرید، فرستادن نسخه و پیگیری سفارش وارد حساب شوید."
  ],
  [
    "نسخه من چه کسانی می‌بینند؟",
    "فقط خود شما و فارمسیست یا مدیر مجاز داروخانه. فایل نسخه عمومی نیست و از مسیر محافظت‌شده ارائه می‌شود."
  ],
  [
    "قیمت و موجودی چه زمانی نهایی می‌شود؟",
    "قیمت، موجودی و مجموع سفارش هنگام ثبت نهایی توسط سرور داروخانه دوباره محاسبه می‌شود."
  ],
  [
    "اگر اینترنت قطع شود چه می‌شود؟",
    "اطلاعات عمومی ذخیره‌شده قابل مشاهده می‌ماند؛ اما قیمت، موجودی و وضعیت سفارش همیشه پس از اتصال تازه می‌شوند."
  ]
];

export default async function LandingPage() {
  const { hero, announcements, featuredMedicines, articles } =
    await publicHomeCms();
  const heroTitle = hero?.title_dari || hero?.title;
  const heroBody = hero?.body_dari || hero?.body;
  const heroAction = hero?.action_label_dari || hero?.action_label;

  return (
    <div className="landing-page">
      <PublicAnnouncements announcements={announcements} />
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <span className="landing-kicker">داروخانه آنلاین قابل اعتماد</span>
          <h1 id="landing-title">
            {heroTitle || (
              <>
                سلامتی شما،
                <br />
                نزدیک‌تر از همیشه
              </>
            )}
          </h1>
          <p>
            {heroBody ||
              "دارو و محصولات صحی را جستجو کنید، نسخه داکتر را برای بررسی فارمسیست بفرستید و سفارش خود را از یک تجربه امن و روشن پیگیری کنید."}
          </p>
          <div className="landing-actions">
            {hero?.action_url && heroAction ? (
              <CmsActionLink
                className="button landing-primary"
                href={hero.action_url}
                label={heroAction}
              />
            ) : (
              <Link className="button landing-primary" href="/shop">
                ورود به فروشگاه
              </Link>
            )}
            <Link className="button secondary landing-secondary" href="/prescriptions">
              ارسال نسخه
            </Link>
          </div>
          <dl className="landing-metrics">
            <div>
              <dt>پشتیبانی</dt>
              <dd>۷ روز هفته</dd>
            </div>
            <div>
              <dt>پرداخت</dt>
              <dd>هنگام تحویل</dd>
            </div>
            <div>
              <dt>حریم خصوصی</dt>
              <dd>نسخه محافظت‌شده</dd>
            </div>
          </dl>
        </div>
        <div className="landing-hero-media">
          {hero?.image_url ? (
            <div className="cms-hero-media-frame">
              <CmsImage
                className="cms-hero-image"
                src={hero.image_url}
                alt={hero.alt_text_dari || hero.alt_text || heroTitle || "بنر درملتون"}
                priority
              />
            </div>
          ) : (
            <Image
              src="/branding/landing-hero.png"
              alt="کیسه داروخانه، داروهای عمومی و برگ‌های سبز"
              width={1792}
              height={896}
              priority
              sizes="(max-width: 820px) 100vw, 58vw"
            />
          )}
          <div className="hero-proof">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>بررسی حرفه‌ای</strong>
              <small>توسط فارمسیست مجاز</small>
            </div>
          </div>
        </div>
      </section>

      {featuredMedicines.length > 0 && (
        <section className="landing-section cms-featured-section" aria-labelledby="featured-title">
          <div className="landing-section-heading">
            <span className="landing-kicker">انتخاب درملتون</span>
            <h2 id="featured-title">محصولات ویژه</h2>
            <p>محصولات فعالی که تیم داروخانه برای دسترسی آسان‌تر برجسته کرده است.</p>
          </div>
          <div className="medicine-grid">
            {featuredMedicines.map(({ feature, medicine }) => (
              <div className="cms-featured-item" key={feature.id}>
                {(feature.label_dari || feature.label) && (
                  <span className="cms-feature-label">
                    {feature.label_dari || feature.label}
                  </span>
                )}
                <MedicineCard medicine={medicine} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="brand-proof" aria-label="مزیت‌های درملتون">
        <span>داروهای معتبر</span>
        <span>نسخه محرمانه</span>
        <span>قیمت شفاف</span>
        <span>پیگیری سفارش</span>
        <span>پشتیبانی واقعی</span>
      </section>

      <section className="landing-section" id="why">
        <div className="landing-section-heading">
          <span className="landing-kicker">چرا درملتون؟</span>
          <h2>یک مسیر ساده‌تر برای دریافت خدمات داروخانه</h2>
          <p>
            هر بخش از تجربه، از جستجوی محصول تا بررسی نسخه و ثبت سفارش، با
            مسئولیت‌پذیری و شفافیت طراحی شده است.
          </p>
        </div>
        <div className="benefit-grid">
          {benefits.map((benefit) => (
            <article className="benefit-card" key={benefit.title}>
              <span className="benefit-icon" aria-hidden="true">
                {benefit.icon}
              </span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="prescription-feature" id="features">
        <div className="prescription-visual" aria-hidden="true">
          <div className="document-sheet">
            <span>Rx</span>
            <i />
            <i />
            <i />
          </div>
          <div className="document-check">✓</div>
        </div>
        <div>
          <span className="landing-kicker">نسخه آنلاین</span>
          <h2>نسخه داکتر را بدون رفت‌وآمد اضافی بفرستید</h2>
          <p>
            عکس یا فایل واضح نسخه را بارگذاری کنید. فارمسیست آن را بررسی
            می‌کند، در صورت نیاز توضیح می‌خواهد و داروهای تأییدشده را برای خرید
            آماده می‌سازد.
          </p>
          <ul className="check-list">
            <li>فایل خصوصی و قابل مشاهده فقط برای افراد مجاز</li>
            <li>اعلان روشن در هر مرحله بررسی</li>
            <li>محدودیت مقدار و اعتبار نسخه در سمت سرور</li>
          </ul>
          <Link className="button" href="/prescriptions">
            ارسال نسخه برای بررسی
          </Link>
        </div>
      </section>

      <section className="landing-section how-section" id="delivery">
        <div className="landing-section-heading">
          <span className="landing-kicker">چگونه کار می‌کند؟</span>
          <h2>از نیاز تا تحویل، در سه گام روشن</h2>
        </div>
        <ol className="step-grid">
          {steps.map(([number, title]) => (
            <li key={number}>
              <span>{number}</span>
              <strong>{title}</strong>
            </li>
          ))}
        </ol>
      </section>

      {articles.length > 0 && (
        <section className="landing-section health-articles-section" aria-labelledby="health-title">
          <div className="landing-section-heading">
            <span className="landing-kicker">آگاهی برای سلامت بهتر</span>
            <h2 id="health-title">مقاله‌های سلامت</h2>
            <p>مطالب منتشرشده توسط تیم محتوای درملتون برای استفاده مسئولانه‌تر از خدمات صحی.</p>
          </div>
          <div className="health-article-grid">
            {articles.map((article) => (
              <HealthArticleCard article={article} key={article.id} />
            ))}
          </div>
          <div className="section-action-row">
            <Link className="button secondary" href="/health-articles">
              مشاهده همه مقاله‌ها
            </Link>
          </div>
        </section>
      )}

      <section className="app-download" id="download">
        <div>
          <span className="landing-kicker light">اپلیکیشن اندروید درملتون</span>
          <h2>داروخانه همیشه همراه شما</h2>
          <p>
            جستجوی سریع، نسخه‌ها، سبد خرید و پیگیری سفارش را در یک تجربه
            دری‌محور و مناسب اندروید داشته باشید.
          </p>
                    <a
            className="button"
            href="/downloads/darmalton-android-1.0.0.apk"
            download
          >
            دانلود اپلیکیشن اندروید
          </a>
        </div>
        <Image
          src="/branding/brand-bag-mark.png"
          alt="نشان اپلیکیشن درملتون"
          width={840}
          height={840}
          sizes="220px"
        />
      </section>

      <section className="landing-section" id="faq">
        <div className="landing-section-heading">
          <span className="landing-kicker">پرسش‌های متداول</span>
          <h2>پاسخ‌های کوتاه و روشن</h2>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-contact" id="contact">
        <div>
          <span className="landing-kicker">همراه شما هستیم</span>
          <h2>برای راهنمایی یا همکاری با ما تماس بگیرید</h2>
        </div>
        <div className="contact-actions">
          <a href="tel:+93700123456" dir="ltr">
            +93 700 123 456
          </a>
          <a href="mailto:help@darmalton.af">help@darmalton.af</a>
          <Link className="button" href="/contact">
            راه‌های تماس
          </Link>
        </div>
      </section>
    </div>
  );
}
