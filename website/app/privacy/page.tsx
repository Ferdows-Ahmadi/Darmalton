import { CmsInfoPage } from "@/components/CmsInfoPage";
import { StaticInfoPage } from "@/components/StaticInfoPage";
import { publicContentPage } from "@/lib/public-cms";
import { serverLocale } from "@/lib/server-locale";
import { staticPages } from "@/lib/static-pages";

export const metadata = { title: "حریم خصوصی" };

export default async function PrivacyPage() {
  const locale = await serverLocale();
  const page = await publicContentPage("privacy");
  if (page)
    return (
      <CmsInfoPage
        utility
        page={page}
        eyebrow={staticPages.privacy.eyebrow[locale]}
        locale={locale}
      />
    );
  return <StaticInfoPage {...staticPages.privacy} />;
}
