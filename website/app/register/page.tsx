import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "ایجاد حساب" };
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <section className="auth-shell">
      <AuthForm
        mode="register"
        googleClientId={process.env.GOOGLE_CLIENT_ID?.trim() || ""}
      />
    </section>
  );
}
