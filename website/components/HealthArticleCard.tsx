"use client";

import Link from "next/link";
import type { PublicContentPage } from "@/lib/types";
import { CmsImage } from "./CmsImage";
import { useLocale } from "./LocaleProvider";
import { cmsText } from "@/lib/cms-locale";

export function HealthArticleCard({ article }: { article: PublicContentPage }) {
  const { locale, t } = useLocale();
  const title = cmsText(article.title, article.title_dari, locale);
  const summary = cmsText(article.summary, article.summary_dari, locale);
  return (
    <article className="health-article-card">
      <Link className="health-article-media" href={`/health-articles/${article.slug}`}>
        {article.image_url ? (
          <CmsImage
            src={article.image_url}
            alt={cmsText(article.alt_text, article.alt_text_dari, locale) || title}
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
