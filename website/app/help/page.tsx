import { StaticInfoPage } from "@/components/StaticInfoPage";
import { staticPages } from "@/lib/static-pages";

export default function HelpPage() {
  return <StaticInfoPage {...staticPages.help} variant="help" />;
}
