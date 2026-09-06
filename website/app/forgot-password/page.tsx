import { StaticInfoPage } from "@/components/StaticInfoPage";
import { staticPages } from "@/lib/static-pages";

export default function ForgotPasswordPage() {
  return <StaticInfoPage {...staticPages.forgot} />;
}
