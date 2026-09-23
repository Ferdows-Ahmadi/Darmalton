import { serverLocale } from "@/lib/server-locale";
import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await serverLocale();
  return { title: locale === "en" ? "Create account" : locale === "ps-AF" ? "حساب جوړول" : "ایجاد حساب" };
}
export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  return (
    <section className="auth-shell">
      <AuthForm
        mode="register"
        googleClientId={process.env.GOOGLE_CLIENT_ID?.trim() || ""}
        returnTo={returnTo}
      />
    </section>
  );
}
