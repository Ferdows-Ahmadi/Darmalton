"use client";

import Link from "next/link";
import { useLocale } from "./LocaleProvider";
import styles from "./UtilityDocument.module.css";

export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
  utility = false,
  className = ""
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  utility?: boolean;
  className?: string;
}) {
  const { locale, t } = useLocale();
  return (
    <section className={`info-page${utility && locale === "fa-AF" ? ` ${styles.document}` : ""}${className ? ` ${className}` : ""}`}>
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
