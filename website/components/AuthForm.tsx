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
      setError(
        payload.error?.message ||
          "معلومات واردشده را بررسی و دوباره کوشش کنید."
      );
    }
    setBusy(false);
  }

  const register = mode === "register";
  return (
    <form className="auth-card" onSubmit={submit}>
      <p className="eyebrow">دسترسی امن مشتری</p>
      <h1>{register ? "ایجاد حساب کاربری" : "خوش آمدید"}</h1>
      <p className="muted">
        {register
          ? "برای سفارش و پیگیری، معلومات خود را وارد کنید."
          : "برای دیدن سبد و سفارش‌های خود وارد شوید."}
      </p>
      {register && (
        <div className="two-columns">
          <label>
            <span>نام</span>
            <input name="first_name" required autoComplete="given-name" />
          </label>
          <label>
            <span>نام خانوادگی</span>
            <input name="last_name" required autoComplete="family-name" />
          </label>
        </div>
      )}
      <label>
        <span>ایمیل</span>
        <input
          dir="ltr"
          type="email"
          name="email"
          required
          autoComplete="email"
        />
      </label>
      {register && (
        <label>
          <span>شماره تماس (اختیاری)</span>
          <input dir="ltr" name="phone" autoComplete="tel" />
        </label>
      )}
      <label>
        <span>رمز عبور</span>
        <input
          dir="ltr"
          type="password"
          name="password"
          minLength={8}
          required
          autoComplete={register ? "new-password" : "current-password"}
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary wide" disabled={busy}>
        {busy ? "لطفاً منتظر بمانید..." : register ? "ایجاد حساب" : "ورود"}
      </button>
      <p className="auth-switch">
        {register ? "قبلاً ثبت‌نام کرده‌اید؟" : "حساب کاربری ندارید؟"}{" "}
        <Link href={register ? "/login" : "/register"}>
          {register ? "ورود" : "ایجاد حساب"}
        </Link>
      </p>
    </form>
  );
}
