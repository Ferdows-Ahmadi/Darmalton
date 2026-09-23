import { CmsInfoPage } from "@/components/CmsInfoPage";
import { StaticInfoPage } from "@/components/StaticInfoPage";
import { publicContentPage } from "@/lib/public-cms";
import { serverLocale } from "@/lib/server-locale";
import { staticPages } from "@/lib/static-pages";

export async function generateMetadata() {
  return { title: (await serverLocale()) === "ps-AF" ? "له درملتون سره اړیکه" : "تماس با درملتون" };
}

export default async function ContactPage() {
  const locale = await serverLocale();
  const page = await publicContentPage("contact");
  if (page)
    return (
      <CmsInfoPage
        utility
        page={page}
        eyebrow={staticPages.contact.eyebrow[locale]}
        locale={locale}
      />
    );
  return <StaticInfoPage {...staticPages.contact} />;
}
