import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CmsImage } from "@/components/CmsImage";
import { publicCmsList } from "@/lib/public-cms";
import { serverLocale } from "@/lib/server-locale";
import type { PublicContentPage } from "@/lib/types";
import { cmsText } from "@/lib/cms-locale";
import { textFor } from "@/lib/locale";
import styles from "@/components/HealthContent.module.css";

async function articleFor(slug: string) {
  const articles = await publicCmsList<PublicContentPage>(
    `cms/health-articles/?slug=${encodeURIComponent(slug)}`
  );
  return articles[0] ?? null;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const article = await articleFor((await params).slug);
  const locale = await serverLocale();
  return { title: article ? cmsText(article.title, article.title_dari, locale) : textFor(locale, "articleContext") };
}

export default async function HealthArticlePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await serverLocale();
  const article = await articleFor((await params).slug);
  if (!article) notFound();
  const title = cmsText(article.title, article.title_dari, locale);
  const summary = cmsText(article.summary, article.summary_dari, locale);
  const body = cmsText(article.body, article.body_dari, locale);
  const copy = locale === "en" ? { article: "Health article", source: "Source" } : locale === "fa-AF" ? { article: "مقاله سلامت", source: "منبع" } : { article: "روغتیایي لیکنه", source: "سرچینه" };
  return (
    <article className={`public-article${locale !== "en" ? ` ${styles.article}` : ""}`}>
      <header>
        <p className="eyebrow">{copy.article}</p>
        <h1>{title}</h1>
        {summary && (
          <p>{summary}</p>
        )}
        {article.author_source && <small>{copy.source}: {article.author_source}</small>}
      </header>
      {article.image_url && (
        <div className="public-article-image">
          <CmsImage
            src={article.image_url}
            alt={cmsText(article.alt_text, article.alt_text_dari, locale) || title}
            priority
          />
        </div>
      )}
      <div className="info-document cms-rich-text">
        {body}
      </div>
    </article>
  );
}
