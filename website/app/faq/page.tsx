import { StaticInfoPage } from "@/components/StaticInfoPage";
import { staticPages } from "@/lib/static-pages";

export default function FaqPage() {
  return <StaticInfoPage {...staticPages.faq} variant="faq" />;
}
