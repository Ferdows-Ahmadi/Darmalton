"use client";

import Image from "next/image";
import Link from "next/link";
import { customerText } from "@/lib/customer-copy";

import { useLocale } from "@/components/LocaleProvider";
import styles from "./app.module.css";

const androidUrl = "https://darmalton.com/downloads/darmalton-android-1.0.0.apk";

export default function AppDownloadPage() {
  const { locale, t } = useLocale();
  if (locale !== "en") return <RtlAppPage />;
  const copy = locale === "en" ? {
    eyebrow: "Darmalton mobile",
    title: "Your pharmacy, ready when you are.",
    body: "Browse the current catalogue, upload prescriptions privately and keep order updates close on Android.",
    install: "Download signed Android APK",
    ios: "iOS — coming soon",
    features: ["Protected account and prescription files", "Fast catalogue and order access", "Built for customers across Afghanistan", "Help from the pharmacy team"],
    stories: [["Private prescription review", "Upload a clear prescription and follow its review inside your protected account."], ["Orders stay close", "Keep current catalogue access and order updates together on Android."], ["Made for local delivery", "Save a clear delivery address and stay connected with the pharmacy team."]]
  } : locale === "ps-AF" ? {
    eyebrow: "د درملتون موبایل",
    title: "ستاسو درملتون، هر وخت چې اړتیا لرئ.",
    body: "اوسنی کتلاګ وګورئ، نسخې په محرم ډول پورته کړئ او د فرمایش خبرونه په اندروید کې نږدې وساتئ.",
    install: "لاسلیک شوی Android APK ښکته کړئ",
    ios: "iOS — ژر راځي",
    features: ["خوندي حساب او د نسخې فایلونه", "کتلاګ او فرمایشونو ته چټک لاسرسی", "په افغانستان کې د پېرودونکو لپاره جوړ شوی", "د درملتون د ډلې مرسته"],
    stories: [["د نسخې محرم ارزونه", "روښانه نسخه پورته کړئ او ارزونه یې په خپل خوندي حساب کې وګورئ."], ["فرمایشونه نږدې وساتئ", "اوسنی کتلاګ او د فرمایش خبرونه په اندروید کې یوځای وساتئ."], ["د سیمه ییز سپارلو لپاره", "روښانه پته خوندي کړئ او د درملتون له ډلې سره په اړیکه کې اوسئ."]]
  } : {
    eyebrow: "درملتون موبایل",
    title: "داروخانه شما، هر زمان که نیاز دارید.",
    body: "فهرست فعلی را ببینید، نسخه را محرمانه بفرستید و اعلان‌های سفارش را در اندروید همراه داشته باشید.",
    install: "دانلود APK امضاشده اندروید",
    ios: "iOS — به‌زودی",
    features: ["حساب و فایل نسخه محافظت‌شده", "دسترسی سریع به فهرست و سفارش‌ها", "ساخته‌شده برای مشتریان سراسر افغانستان", "راهنمایی تیم داروخانه"],
    stories: [["بررسی محرمانه نسخه", "نسخه واضح را بفرستید و بررسی آن را در حساب محافظت‌شده دنبال کنید."], ["سفارش‌ها همیشه نزدیک", "دسترسی به فهرست و اعلان‌های سفارش را در اندروید یک‌جا نگه دارید."], ["برای تحویل محلی", "آدرس روشن را ذخیره کنید و با تیم داروخانه در تماس بمانید."]]
  };
  const icons = ["APP-06_Feature_Security_Icon.png", "APP-07_Feature_Speed_Icon.png", "APP-08_Feature_Location_Icon.png", "APP-09_Feature_Support_Icon.png"];

  return <div className="app-download-page">
    <section className="app-hero">
      <Image className="app-hero-bg" src="/app/APP-03_Mint_Leaf_Background.png" alt="" fill priority sizes="100vw" />
      <div className="wrap app-hero-grid">
        <div className="app-hero-copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <Image className="app-page-brand" src="/brand/darmalton-logo.png" alt="درملتون" width={190} height={76} priority />
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>
          <div className="app-download-actions">
            <a className="button app-download-button" href={androidUrl} download>{copy.install}</a>
            <span>{copy.ios}</span>
          </div>
          <small>{t("privateRx")} · {t("orderHistory")}</small>
        </div>
        <div className="app-phones">
          <Image src="/app/APP-01_Hero_Dual_Phones.png" alt="Darmalton Android app" width={760} height={760} priority sizes="(max-width: 767px) 90vw, 48vw" />
        </div>
      </div>
    </section>
    <section className="wrap app-benefits" aria-label={t("appTitle")}>
      {copy.features.map((feature, index) => <article key={feature}>
        <Image src={`/app/${icons[index]}`} alt="" width={64} height={64} />
        <h2>{feature}</h2>
      </article>)}
    </section>
    <section className="wrap app-stories">
      {["APP-12_Prescription_Illustration.png", "APP-02_App_Screen_In_Hand.png", "APP-10_Delivery_Illustration.png"].map((image, index) => <article key={image}>
        <div><p className="eyebrow">0{index + 1}</p><h2>{copy.stories[index][0]}</h2><p>{copy.stories[index][1]}</p></div>
        <Image src={`/app/${image}`} alt="" width={360} height={260} />
      </article>)}
    </section>
    <section className="wrap app-final-panel">
      <Image src="/brand/android-icon.png" alt="" width={120} height={120} />
      <div><h2>{t("appTitle")}</h2><p>{copy.body}</p></div>
      <a className="button secondary" href={androidUrl} download>{t("android")}</a>
    </section>
  </div>;
}

function AndroidDownload() {
  const { locale } = useLocale();
  return <a className={styles.download} href={androidUrl} download>
    <span aria-hidden="true">↓</span> {customerText(locale, "دانلود برای اندروید")}
  </a>;
}

function RtlAppPage() {
  const { locale } = useLocale();
  return <div className={styles.page}>
    <div className={styles.container}>
      <nav className={styles.breadcrumb} aria-label={customerText(locale, "مسیر صفحه")}><Link href="/">{customerText(locale, "خانه")}</Link><span aria-hidden="true">/</span><span>{customerText(locale, "اپلیکیشن درملتون")}</span></nav>
      <section className={styles.hero} aria-labelledby="app-heading">
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>{customerText(locale, "درملتون در موبایل شما")}</p>
          <h1 id="app-heading">{customerText(locale, "داروخانه شما،")}<br />{customerText(locale, "همراه شما.")}</h1>
          <p className={styles.intro}>{customerText(locale, "دوا و محصولات صحی را ببینید، نسخه بفرستید و وضعیت سفارش‌های خود را از حساب‌تان پیگیری کنید.")}</p>
          <div className={styles.actions}><AndroidDownload /><small>{customerText(locale, "نسخه ۱.۰.۰")} <span aria-hidden="true">·</span> {customerText(locale, "فایل")} <bdi>APK</bdi></small></div>
          <p className={styles.ios}><bdi>iOS</bdi><span>{customerText(locale, "هنوز در دسترس نیست")}</span></p>
        </div>
        <div className={styles.heroMedia}>
          <Image src="/app/APP-01_Hero_Dual_Phones.png" alt={customerText(locale, "نمای معرفی اپلیکیشن درملتون روی موبایل")} width={488} height={404} priority sizes="(max-width: 767px) 92vw, 44vw" />
        </div>
      </section>

      <section className={styles.features} aria-label={customerText(locale, "امکانات اپلیکیشن")}>
        {[
          ["APP-07_Feature_Speed_Icon.png", customerText(locale, "فهرست دوا و محصولات"), customerText(locale, "جستجو و مشاهده معلومات محصول")],
          ["APP-06_Feature_Security_Icon.png", customerText(locale, "نسخه در حساب شما"), customerText(locale, "ارسال فایل برای بررسی فارمسست")],
          ["APP-09_Feature_Support_Icon.png", customerText(locale, "سفارش‌ها و اعلان‌ها"), customerText(locale, "دسترسی به وضعیت و تاریخچه")],
          ["APP-08_Feature_Location_Icon.png", customerText(locale, "آدرس‌های ذخیره‌شده"), customerText(locale, "انتخاب آدرس هنگام سفارش")]
        ].map(([image, title, body]) => <article key={title}>
          <Image src={`/app/${image}`} alt="" width={48} height={40} />
          <div><h2>{title}</h2><p>{body}</p></div>
        </article>)}
      </section>

      <section className={styles.experience} aria-labelledby="app-experience">
        <div className={styles.sectionHeading}><h2 id="app-experience">{customerText(locale, "از انتخاب دوا تا پیگیری سفارش")}</h2><p>{customerText(locale, "امکانات درملتون، در یک اپلیکیشن")}</p></div>
        <div className={styles.stories}>
          <article>
            <div className={styles.storyMedia}><Image src="/app/APP-12_Prescription_Illustration.png" alt="" width={213} height={166} sizes="(max-width: 767px) 30vw, 24vw" /></div>
            <div className={styles.storyCopy}><span className={styles.step}>{customerText(locale, "۰۱ / نسخه")}</span><h3>{customerText(locale, "بفرستید؛ وضعیت را ببینید.")}</h3><p>{customerText(locale, "عکس یا فایل نسخه را برای بررسی بفرستید. دسترسی به نسخه برای شما و تیم مجاز داروخانه است.")}</p><Link href="/prescription-help">{customerText(locale, "راهنمای ارسال نسخه")} <span aria-hidden="true">←</span></Link></div>
          </article>
          <article>
            <div className={`${styles.storyMedia} ${styles.handMedia}`}><Image src="/app/APP-02_App_Screen_In_Hand.png" alt={customerText(locale, "نمای معرفی اپلیکیشن درملتون در دست")} width={290} height={395} sizes="(max-width: 767px) 30vw, 15vw" /></div>
            <div className={styles.storyCopy}><span className={styles.step}>{customerText(locale, "۰۲ / حساب شما")}</span><h3>{customerText(locale, "سفارش‌ها، یک‌جا و در دسترس.")}</h3><p>{customerText(locale, "محصولات را مرور کنید و تاریخچه سفارش‌ها و اعلان‌های حساب خود را ببینید.")}</p><Link href="/account/orders">{customerText(locale, "سفارش‌های من")} <span aria-hidden="true">←</span></Link></div>
          </article>
          <article>
            <div className={styles.storyMedia}><Image src="/app/APP-10_Delivery_Illustration.png" alt="" width={257} height={166} sizes="(max-width: 767px) 30vw, 24vw" /></div>
            <div className={styles.storyCopy}><span className={styles.step}>{customerText(locale, "۰۳ / آدرس تحویل")}</span><h3>{customerText(locale, "آدرس روشن، سفارش مشخص.")}</h3><p>{customerText(locale, "آدرس تحویل را ذخیره کنید و هنگام سفارش انتخاب کنید. شرایط تحویل را پیش از ثبت نهایی بخوانید.")}</p><Link href="/delivery-policy">{customerText(locale, "شرایط تحویل و سفارش")} <span aria-hidden="true">←</span></Link></div>
          </article>
        </div>
      </section>

      <section className={styles.final} aria-label={customerText(locale, "دانلود اپلیکیشن")}>
        <div><p className={styles.kicker}>{customerText(locale, "درملتون، همراه شما")}</p><h2>{customerText(locale, "اپلیکیشن اندروید را دریافت کنید.")}</h2><p>{customerText(locale, "فهرست دوا، نسخه‌ها و سفارش‌ها در موبایل شما.")}</p></div>
        <div className={styles.finalActions}><AndroidDownload /><small>{customerText(locale, "نسخه")} <bdi>iOS</bdi> {customerText(locale, "هنوز در دسترس نیست.")}</small></div>
      </section>
    </div>
  </div>;
}
