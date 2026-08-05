import type { Metadata } from "next";

import { AuthForm } from "@/components/AuthForm";
import { safeStaffReturnPath } from "@/lib/auth-navigation";

export const metadata: Metadata = { title: "ورود کارمندان" };
export const dynamic = "force-dynamic";

export default async function StaffLoginPage({
  searchParams
}: {
  searchParams: Promise<{ reason?: string; returnTo?: string }>;
}) {
  const { reason, returnTo } = await searchParams;
  return (
    <section className="auth-shell staff-login-shell">
      {reason === "forbidden" && (
        <p className="form-error" role="alert">
          حساب فعلی اجازه دسترسی به پنل کارمندان را ندارد.
        </p>
      )}
      <AuthForm
        audience="staff"
        mode="login"
        googleClientId=""
        returnTo={safeStaffReturnPath(returnTo)}
      />
    </section>
  );
}
