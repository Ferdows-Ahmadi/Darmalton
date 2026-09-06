import { StaticInfoPage } from "@/components/StaticInfoPage";
import { staticPages } from "@/lib/static-pages";

export default function ReturnsPage() {
  return <StaticInfoPage {...staticPages.returns} />;
}
