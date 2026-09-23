"use client";

import Image from "next/image";
import Link from "next/link";
import { customerText } from "@/lib/customer-copy";

import { useLocale } from "@/components/LocaleProvider";
import styles from "./app.module.css";

const androidUrl = "https://darmalton.com/downloads/darmalton-android-1.0.0.apk";

function AndroidDownload() {
  const { locale } = useLocale();
  return <a className={styles.download} href={androidUrl} download>
    <span aria-hidden="true">↓</span> {customerText(locale, "دانلود برای اندروید")}
  </a>;
}

export default function AppDownloadPage() {
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
            <div className={styles.storyCopy}><span className={styles.step}>{customerText(locale, "۰۱ / نسخه")}</span><h3>{customerText(locale, "بفرستید؛ وضعیت را ببینید.")}</h3><p>{customerText(locale, "عکس یا فایل نسخه را برای بررسی بفرستید. دسترسی به نسخه برای شما و تیم مجاز داروخانه است.")}</p><Link href="/prescription-help">{customerText(locale, "راهنمای ارسال نسخه")} <span aria-hidden="true">{locale === "en" ? "→" : "←"}</span></Link></div>
          </article>
          <article>
            <div className={`${styles.storyMedia} ${styles.handMedia}`}><Image src="/app/APP-02_App_Screen_In_Hand.png" alt={customerText(locale, "نمای معرفی اپلیکیشن درملتون در دست")} width={290} height={395} sizes="(max-width: 767px) 30vw, 15vw" /></div>
            <div className={styles.storyCopy}><span className={styles.step}>{customerText(locale, "۰۲ / حساب شما")}</span><h3>{customerText(locale, "سفارش‌ها، یک‌جا و در دسترس.")}</h3><p>{customerText(locale, "محصولات را مرور کنید و تاریخچه سفارش‌ها و اعلان‌های حساب خود را ببینید.")}</p><Link href="/account/orders">{customerText(locale, "سفارش‌های من")} <span aria-hidden="true">{locale === "en" ? "→" : "←"}</span></Link></div>
          </article>
          <article>
            <div className={styles.storyMedia}><Image src="/app/APP-10_Delivery_Illustration.png" alt="" width={257} height={166} sizes="(max-width: 767px) 30vw, 24vw" /></div>
            <div className={styles.storyCopy}><span className={styles.step}>{customerText(locale, "۰۳ / آدرس تحویل")}</span><h3>{customerText(locale, "آدرس روشن، سفارش مشخص.")}</h3><p>{customerText(locale, "آدرس تحویل را ذخیره کنید و هنگام سفارش انتخاب کنید. شرایط تحویل را پیش از ثبت نهایی بخوانید.")}</p><Link href="/delivery-policy">{customerText(locale, "شرایط تحویل و سفارش")} <span aria-hidden="true">{locale === "en" ? "→" : "←"}</span></Link></div>
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
