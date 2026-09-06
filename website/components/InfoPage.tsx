"use client";

import Link from "next/link";
import { useLocale } from "./LocaleProvider";

export function InfoPage({
  eyebrow,
  title,
  intro,
  children
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  const { t } = useLocale();
  return (
    <section className="info-page">
      <div className="info-page-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      <article className="info-document">{children}</article>
      <Link className="button secondary" href="/">
        {t("backHome")}
      </Link>
    </section>
  );
}
