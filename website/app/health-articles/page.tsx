import type { Metadata } from "next";

import { HealthArticleCard } from "@/components/HealthArticleCard";
import { publicCmsList } from "@/lib/public-cms";
import type { PublicContentPage } from "@/lib/types";

export const metadata: Metadata = { title: "مقاله‌های سلامت" };

export default async function HealthArticlesPage() {
  const articles = await publicCmsList<PublicContentPage>(
    "cms/health-articles/?ordering=display_order"
  );
  return (
    <section className="page-section public-content-index">
      <header className="public-content-heading">
        <p className="eyebrow">مرکز آگاهی درملتون</p>
        <h1>مقاله‌های سلامت</h1>
        <p>محتوای آموزشی منتشرشده برای تصمیم‌گیری آگاهانه‌تر؛ این مطالب جای تشخیص داکتر را نمی‌گیرد.</p>
      </header>
      {articles.length > 0 ? (
        <div className="health-article-grid">
          {articles.map((article) => (
            <HealthArticleCard article={article} key={article.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>هنوز مقاله‌ای منتشر نشده است</h2>
          <p>مقاله‌های تأییدشده پس از نشر توسط تیم محتوا در این بخش دیده می‌شوند.</p>
        </div>
      )}
    </section>
  );
}
