"use client";

import Image from "next/image";

import { useLocale } from "@/components/LocaleProvider";

const androidUrl = "https://darmalton.com/downloads/darmalton-android-1.0.0.apk";

export default function AppDownloadPage() {
  const { locale, t } = useLocale();
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
