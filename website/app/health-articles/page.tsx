import type { Metadata } from "next";

import { HealthArticleCard } from "@/components/HealthArticleCard";
import { publicCmsList } from "@/lib/public-cms";
import { serverLocale } from "@/lib/server-locale";
import type { PublicContentPage } from "@/lib/types";

export const metadata: Metadata = { title: "مقاله‌های سلامت" };

export default async function HealthArticlesPage() {
  const locale = await serverLocale();
  const copy = locale === "en"
    ? { kicker: "Darmalton knowledge centre", title: "Health articles", intro: "Published educational content for informed decisions; it does not replace diagnosis by a qualified clinician.", emptyTitle: "No articles published yet", empty: "Approved articles will appear after the content team publishes them." }
    : locale === "fa-AF"
      ? { kicker: "مرکز آگاهی درملتون", title: "مقاله‌های سلامت", intro: "محتوای آموزشی منتشرشده برای تصمیم‌گیری آگاهانه‌تر؛ این مطالب جای تشخیص داکتر را نمی‌گیرد.", emptyTitle: "هنوز مقاله‌ای منتشر نشده است", empty: "مقاله‌های تأییدشده پس از نشر توسط تیم محتوا در این بخش دیده می‌شوند." }
      : { kicker: "د درملتون د پوهاوي مرکز", title: "روغتیایي لیکنې", intro: "خپاره شوي ښوونیز معلومات د باخبره پرېکړو لپاره دي؛ دا د مسلکي ډاکټر تشخیص نه بدلوي.", emptyTitle: "تر اوسه لیکنه نه ده خپره شوې", empty: "تایید شوې لیکنې به د محتوا د ډلې تر خپرولو وروسته دلته ښکاره شي." };
  const articles = await publicCmsList<PublicContentPage>(
    "cms/health-articles/?ordering=display_order"
  );
  return (
    <section className="page-section public-content-index">
      <header className="public-content-heading">
        <p className="eyebrow">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>
      {articles.length > 0 ? (
        <div className="health-article-grid">
          {articles.map((article) => (
            <HealthArticleCard article={article} key={article.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{copy.emptyTitle}</h2>
          <p>{copy.empty}</p>
        </div>
      )}
    </section>
  );
}
