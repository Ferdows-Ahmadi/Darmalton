import Link from "next/link";
import type { PublicContentPage } from "@/lib/types";
import { CmsImage } from "./CmsImage";

export function HealthArticleCard({ article }: { article: PublicContentPage }) {
  return (
    <article className="health-article-card">
      <Link className="health-article-media" href={`/health-articles/${article.slug}`}>
        {article.image_url ? (
          <CmsImage
            src={article.image_url}
            alt={article.alt_text_dari || article.alt_text || article.title_dari}
          />
        ) : (
          <span aria-hidden="true">✚</span>
        )}
      </Link>
      <div>
        <p className="eyebrow">راهنمای سلامت</p>
        <h3>
          <Link href={`/health-articles/${article.slug}`}>
            {article.title_dari || article.title}
          </Link>
        </h3>
        <p>{article.summary_dari || article.summary || "مقاله آموزشی درملتون"}</p>
        <Link className="card-action" href={`/health-articles/${article.slug}`}>
          خواندن مقاله
        </Link>
      </div>
    </article>
  );
}
