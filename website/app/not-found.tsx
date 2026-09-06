"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export default function NotFound() {
  const { t } = useLocale();
  return (
    <section className="page-section narrow">
      <div className="empty-state">
        <h1>{t("notFound")}</h1>
        <p>{t("trySearch")}</p>
        <Link className="button" href="/">
          {t("backHome")}
        </Link>
      </div>
    </section>
  );
}
