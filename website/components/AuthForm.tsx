"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(payload.error?.message || "Please check your details and try again.");
    }
    setBusy(false);
  }

  const register = mode === "register";
  return (
    <form className="auth-card" onSubmit={submit}>
      <p className="eyebrow">Secure customer access</p>
      <h1>{register ? "Create your account" : "Welcome back"}</h1>
      <p className="muted">
        {register ? "Use a private email and a strong, unique password." : "Sign in to access your cart and orders."}
      </p>
      {register && (
        <div className="two-columns">
          <label><span>First name</span><input name="first_name" required autoComplete="given-name" /></label>
          <label><span>Last name</span><input name="last_name" required autoComplete="family-name" /></label>
        </div>
      )}
      <label><span>Email</span><input type="email" name="email" required autoComplete="email" /></label>
      {register && <label><span>Phone (optional)</span><input name="phone" autoComplete="tel" /></label>}
      <label>
        <span>Password</span>
        <input type="password" name="password" minLength={8} required autoComplete={register ? "new-password" : "current-password"} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary wide" disabled={busy}>{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
      <p className="auth-switch">
        {register ? "Already registered?" : "New to Darmalton?"}{" "}
        <Link href={register ? "/login" : "/register"}>{register ? "Sign in" : "Create an account"}</Link>
      </p>
    </form>
  );
}
