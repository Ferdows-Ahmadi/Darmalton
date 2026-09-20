import { AuthForm } from "@/components/AuthForm";

export default function CheckoutLoginPage() {
  return (
    <section className="auth-shell">
      <AuthForm
        mode="login"
        googleClientId={process.env.GOOGLE_CLIENT_ID?.trim() || ""}
        returnTo="/checkout"
      />
    </section>
  );
}
