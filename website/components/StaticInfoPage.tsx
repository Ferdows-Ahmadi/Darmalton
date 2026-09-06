"use client";

import Link from "next/link";

import { useLocale } from "./LocaleProvider";
import type { Locale } from "@/lib/locale";

export type LocalizedCopy = Record<Locale, string>;

export function StaticInfoPage({
  eyebrow,
  title,
  intro,
  sections,
  action
}: {
  eyebrow: LocalizedCopy;
  title: LocalizedCopy;
  intro: LocalizedCopy;
  sections: readonly { readonly title: LocalizedCopy; readonly body: LocalizedCopy }[];
  action?: { readonly href: string; readonly label: LocalizedCopy };
}) {
  const { locale, t } = useLocale();

  return (
    <section className="info-page">
      <header className="info-page-heading">
        <p className="eyebrow">{eyebrow[locale]}</p>
        <h1>{title[locale]}</h1>
        <p>{intro[locale]}</p>
      </header>
      <article className="info-document">
        {sections.map((section) => (
          <section key={section.title.en}>
            <h2>{section.title[locale]}</h2>
            <p>{section.body[locale]}</p>
          </section>
        ))}
      </article>
      <Link className="button secondary" href={action?.href || "/"}>
        {action?.label[locale] || t("backHome")}
      </Link>
    </section>
  );
}
