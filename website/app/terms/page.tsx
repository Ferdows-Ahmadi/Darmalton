import { CmsInfoPage } from "@/components/CmsInfoPage";
import { StaticInfoPage } from "@/components/StaticInfoPage";
import { publicContentPage } from "@/lib/public-cms";
import { serverLocale } from "@/lib/server-locale";
import { staticPages } from "@/lib/static-pages";

export const metadata = { title: "شرایط استفاده" };

export default async function TermsPage() {
  const locale = await serverLocale();
  const page = await publicContentPage("terms");
  if (page)
    return (
      <CmsInfoPage
        page={page}
        eyebrow={staticPages.terms.eyebrow[locale]}
        locale={locale}
      />
    );
  return <StaticInfoPage {...staticPages.terms} />;
}
