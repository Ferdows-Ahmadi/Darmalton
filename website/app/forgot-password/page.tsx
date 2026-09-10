import { StaticInfoPage } from "@/components/StaticInfoPage";
import { staticPages } from "@/lib/static-pages";

export default function ForgotPasswordPage() {
  return <div className="forgot-password-page"><StaticInfoPage {...staticPages.forgot} /></div>;
}
