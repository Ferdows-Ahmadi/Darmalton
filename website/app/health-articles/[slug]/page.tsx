import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CmsImage } from "@/components/CmsImage";
import { publicCmsList } from "@/lib/public-cms";
import { serverLocale } from "@/lib/server-locale";
import type { PublicContentPage } from "@/lib/types";

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
  return { title: article?.title_dari || article?.title || "مقاله سلامت" };
}

export default async function HealthArticlePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await serverLocale();
  const article = await articleFor((await params).slug);
  if (!article) notFound();
  const english = locale === "en";
  const title = english ? article.title : article.title_dari || article.title;
  const summary = english ? article.summary : article.summary_dari || article.summary;
  const body = english ? article.body : article.body_dari || article.body;
  const copy = locale === "en" ? { article: "Health article", source: "Source" } : locale === "fa-AF" ? { article: "مقاله سلامت", source: "منبع" } : { article: "روغتیایي لیکنه", source: "سرچینه" };
  return (
    <article className="public-article">
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
            alt={(english ? article.alt_text : article.alt_text_dari) || title}
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
