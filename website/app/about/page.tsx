import { CmsInfoPage } from "@/components/CmsInfoPage";
import { StaticInfoPage } from "@/components/StaticInfoPage";
import { publicContentPage } from "@/lib/public-cms";
import { serverLocale } from "@/lib/server-locale";
import { staticPages } from "@/lib/static-pages";

export async function generateMetadata() {
  const locale = await serverLocale();
  return { title: locale === "en" ? "About Darmalton" : locale === "ps-AF" ? "د درملتون په اړه" : "درباره درملتون" };
}

export default async function AboutPage() {
  const locale = await serverLocale();
  const page = await publicContentPage("about");
  if (page)
    return (
      <CmsInfoPage
        utility
        page={page}
        eyebrow={staticPages.about.eyebrow[locale]}
        locale={locale}
      />
    );
  return <StaticInfoPage {...staticPages.about} variant="about" />;
}
