"use client";

import Link from "next/link";

import { useLocale } from "./LocaleProvider";
import { formatNumber, type Locale } from "@/lib/locale";
import styles from "./UtilityDocument.module.css";

export type LocalizedCopy = Record<Locale, string>;

export function StaticInfoPage({
  eyebrow,
  title,
  intro,
  sections,
  action,
  variant = "document"
}: {
  eyebrow: LocalizedCopy;
  title: LocalizedCopy;
  intro: LocalizedCopy;
  sections: readonly { readonly title: LocalizedCopy; readonly body: LocalizedCopy }[];
  action?: { readonly href: string; readonly label: LocalizedCopy };
  variant?: "document" | "about" | "help" | "faq";
}) {
  const { locale, t } = useLocale();

  return (
    <section className={`info-page info-page-${variant}${locale !== "en" ? ` ${styles.document}` : ""}`}>
      <header className="info-page-heading">
        <p className="eyebrow">{eyebrow[locale]}</p>
        <h1>{title[locale]}</h1>
        <p>{intro[locale]}</p>
      </header>
      {variant === "faq" ? <div className="info-accordion">
        {/* Native disclosure can be toggled before React hydrates; preserve that browser-owned open state. */}
        {sections.map((section, index) => <details key={section.title.en} open={index === 0} suppressHydrationWarning={locale !== "en"}>
          <summary>{section.title[locale]}<span aria-hidden="true">＋</span></summary>
          <p>{section.body[locale]}</p>
        </details>)}
      </div> : <article className="info-document">
        {sections.map((section, index) => <section key={section.title.en}>
          {variant === "help" && <span className="info-step" aria-hidden="true">{locale !== "en" ? formatNumber(index + 1, locale) : String(index + 1).padStart(2, "0")}</span>}
          <h2>{section.title[locale]}</h2>
          <p>{section.body[locale]}</p>
        </section>)}
      </article>}
      <Link className="button secondary" href={action?.href || "/"}>
        {action?.label[locale] || t("backHome")}
      </Link>
    </section>
  );
}
