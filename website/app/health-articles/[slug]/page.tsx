import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CmsImage } from "@/components/CmsImage";
import { publicCmsList } from "@/lib/public-cms";
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
  const article = await articleFor((await params).slug);
  if (!article) notFound();
  return (
    <article className="public-article">
      <header>
        <p className="eyebrow">مقاله سلامت</p>
        <h1>{article.title_dari || article.title}</h1>
        {(article.summary_dari || article.summary) && (
          <p>{article.summary_dari || article.summary}</p>
        )}
        {article.author_source && <small>منبع: {article.author_source}</small>}
      </header>
      {article.image_url && (
        <div className="public-article-image">
          <CmsImage
            src={article.image_url}
            alt={article.alt_text_dari || article.alt_text || article.title_dari}
            priority
          />
        </div>
      )}
      <div className="info-document cms-rich-text">
        {article.body_dari || article.body}
      </div>
    </article>
  );
}
