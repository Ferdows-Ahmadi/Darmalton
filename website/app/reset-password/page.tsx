import { StaticInfoPage } from "@/components/StaticInfoPage";
import { staticPages } from "@/lib/static-pages";

export default function ResetPasswordPage() {
  return <StaticInfoPage {...staticPages.reset} />;
}
