import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "ورود" };

export default function LoginPage() {
  return <section className="auth-shell"><AuthForm mode="login" /></section>;
}
