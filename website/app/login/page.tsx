import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "ورود" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  return (
    <section className="auth-shell">
      <AuthForm
        mode="login"
        googleClientId={process.env.GOOGLE_CLIENT_ID?.trim() || ""}
        returnTo={returnTo}
      />
    </section>
  );
}
