import { StaticInfoPage } from "@/components/StaticInfoPage";
import { staticPages } from "@/lib/static-pages";

export default function AppDownloadPage() {
  return <StaticInfoPage {...staticPages.app} />;
}
