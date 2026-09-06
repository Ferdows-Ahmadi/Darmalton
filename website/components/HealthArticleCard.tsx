"use client";

import Link from "next/link";
import type { PublicContentPage } from "@/lib/types";
import { CmsImage } from "./CmsImage";
import { useLocale } from "./LocaleProvider";

export function HealthArticleCard({ article }: { article: PublicContentPage }) {
  const { locale, t } = useLocale();
  const localized = locale === "en";
  const title = localized ? article.title : article.title_dari || article.title;
  const summary = localized ? article.summary : article.summary_dari || article.summary;
  return (
    <article className="health-article-card">
      <Link className="health-article-media" href={`/health-articles/${article.slug}`}>
        {article.image_url ? (
          <CmsImage
            src={article.image_url}
            alt={(localized ? article.alt_text : article.alt_text_dari) || title}
          />
        ) : (
          <span aria-hidden="true">✚</span>
        )}
      </Link>
      <div>
        <p className="eyebrow">{t("health")}</p>
        <h3>
          <Link href={`/health-articles/${article.slug}`}>
            {title}
          </Link>
        </h3>
        <p>{summary}</p>
        <Link className="card-action" href={`/health-articles/${article.slug}`}>
          {t("view")}
        </Link>
      </div>
    </article>
  );
}
