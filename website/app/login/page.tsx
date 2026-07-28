import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "ورود" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <section className="auth-shell">
      <AuthForm
        mode="login"
        googleClientId={process.env.GOOGLE_CLIENT_ID?.trim() || ""}
      />
    </section>
  );
}
