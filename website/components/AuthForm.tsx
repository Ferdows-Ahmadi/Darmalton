"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { GoogleSignInButton } from "@/components/GoogleSignInButton";

type AuthErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

const googleErrorMessages: Record<string, string> = {
  google_link_required:
    "برای حفاظت حساب، نخست با رمز عبور وارد شوید؛ سپس حساب گوگل را پیوند دهید.",
  google_email_unverified:
    "حساب گوگل باید یک ایمیل تأییدشده داشته باشد.",
  invalid_google_token:
    "گوگل نتوانست این ورود را تأیید کند. دوباره کوشش کنید.",
  google_sign_in_unavailable:
    "ورود با گوگل فعلاً در دسترس نیست. کمی بعد دوباره کوشش کنید.",
  inactive_account: "این حساب غیرفعال است. با پشتیبانی تماس بگیرید."
};

export function AuthForm({
  mode,
  googleClientId
}: {
  mode: "login" | "register";
  googleClientId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const finishAuthentication = useCallback(() => {
    router.push("/");
    router.refresh();
  }, [router]);

  const submitGoogle = useCallback(
    async (credential: string) => {
      setBusy(true);
      setError("");
      try {
        const response = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: credential })
        });
        const payload = (await response
          .json()
          .catch(() => ({}))) as AuthErrorPayload;
        if (response.ok) {
          finishAuthentication();
          return;
        }
        const code = payload.error?.code || "";
        setError(
          googleErrorMessages[code] ||
            payload.error?.message ||
            "ورود با گوگل انجام نشد. دوباره کوشش کنید."
        );
      } catch {
        setError("ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.");
      } finally {
        setBusy(false);
      }
    },
    [finishAuthentication]
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const body = Object.fromEntries(form.entries());
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response
        .json()
        .catch(() => ({}))) as AuthErrorPayload;
      if (response.ok) {
        finishAuthentication();
      } else {
        setError(
          payload.error?.message ||
            "معلومات واردشده را بررسی و دوباره کوشش کنید."
        );
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.");
    } finally {
      setBusy(false);
    }
  }

  const register = mode === "register";
  return (
    <form className="auth-card" onSubmit={submit}>
      <Image
        className="auth-brand"
        src="/branding/darmalton-wordmark.png"
        alt="درملتون"
        width={2000}
        height={808}
        priority
      />
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
      <div className="auth-divider" aria-hidden="true">
        <span>یا</span>
      </div>
      <GoogleSignInButton
        clientId={googleClientId}
        mode={mode}
        busy={busy}
        onCredential={submitGoogle}
        onError={setError}
      />
      <p className="auth-switch">
        {register ? "قبلاً ثبت‌نام کرده‌اید؟" : "حساب کاربری ندارید؟"}{" "}
        <Link href={register ? "/login" : "/register"}>
          {register ? "ورود" : "ایجاد حساب"}
        </Link>
      </p>
    </form>
  );
}
