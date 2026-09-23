"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import {
  isStaffRole,
  postLoginPath
} from "@/lib/auth-navigation";
import { synchronizeGuestCart } from "@/lib/guest-cart";
import { accountValidation } from "@/lib/account-feedback";
import type { User } from "@/lib/types";
import { useLocale } from "./LocaleProvider";
import styles from "./AuthForm.module.css";

type AuthErrorPayload = {
  user?: User;
  error?: {
    code?: string;
    message?: string;
  };
};

const googleErrorMessages: Record<string, [string, string, string]> = {
  google_link_required: [
    "For account safety, sign in with your password before linking Google.",
    "برای حفاظت حساب، نخست با رمز عبور وارد شوید؛ سپس حساب گوگل را پیوند دهید.",
    "د حساب د خوندیتوب لپاره لومړی په پټنوم ننوځئ، بیا ګوګل ونښلوئ."
  ],
  google_email_unverified: [
    "Your Google account must provide a verified email address.",
    "حساب گوگل باید یک ایمیل تأییدشده داشته باشد.",
    "ستاسو ګوګل حساب باید تایید شوی برېښنالیک ولري."
  ],
  invalid_google_token: [
    "Google could not verify this sign-in. Try again.",
    "گوگل نتوانست این ورود را تأیید کند. دوباره کوشش کنید.",
    "ګوګل دا ننوتل تایید نه کړای شول. بیا هڅه وکړئ."
  ],
  google_sign_in_unavailable: [
    "Google sign-in is temporarily unavailable. Try again later.",
    "ورود با گوگل فعلاً در دسترس نیست. کمی بعد دوباره کوشش کنید.",
    "په ګوګل ننوتل اوس نشته. لږ وروسته بیا هڅه وکړئ."
  ],
  inactive_account: [
    "This account is inactive. Contact support.",
    "این حساب غیرفعال است. با پشتیبانی تماس بگیرید.",
    "دا حساب غیر فعال دی. له ملاتړ سره اړیکه ونیسئ."
  ]
};

export function AuthForm({
  mode,
  googleClientId,
  returnTo,
  audience = "customer"
}: {
  mode: "login" | "register";
  googleClientId: string;
  returnTo?: string;
  audience?: "customer" | "staff";
}) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const customerCopy = locale === "en"
    ? { secure: "Secure customer access", create: "Create your account", welcome: "Welcome back", registerBody: "Enter your details to order and follow updates.", loginBody: "Sign in to view your cart and orders.", returnNote: "After signing in, you will return to the previous page and your cart will be kept.", first: "First name", last: "Last name", phone: "Phone number (optional)", wait: "Please wait…", createButton: "Create account", loginButton: "Sign in", or: "or", registered: "Already registered?", new: "New to Darmalton?", continue: "Continue without signing in", invalid: "Check the information and try again.", connection: "Could not connect to the server. Check your connection.", sync: "You signed in, but the guest cart could not be synced. Check the connection and try again.", googleMissing: "Google did not return valid sign-in information. Try again.", googleChanged: "Google sign-in settings changed. Refresh the page.", googleLoad: "Google sign-in could not load. Check your connection." }
    : locale === "fa-AF"
      ? { secure: "دسترسی امن مشتری", create: "ایجاد حساب کاربری", welcome: "خوش آمدید", registerBody: "برای سفارش و پیگیری، معلومات خود را وارد کنید.", loginBody: "برای دیدن سبد و سفارش‌های خود وارد شوید.", returnNote: "پس از ورود به همان بخش قبلی برمی‌گردید و سبد شما حفظ می‌شود.", first: "نام", last: "نام خانوادگی", phone: "شماره تماس (اختیاری)", wait: "لطفاً منتظر بمانید…", createButton: "ایجاد حساب", loginButton: "ورود", or: "یا", registered: "قبلاً ثبت‌نام کرده‌اید؟", new: "حساب کاربری ندارید؟", continue: "ادامه بدون ورود", invalid: "معلومات واردشده را بررسی و دوباره کوشش کنید.", connection: "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.", sync: "ورود انجام شد، اما سبد مهمان همگام نشد. اتصال را بررسی و دوباره کوشش کنید.", googleMissing: "گوگل معلومات معتبر ورود را برنگرداند. دوباره کوشش کنید.", googleChanged: "تنظیمات ورود با گوگل تغییر کرده است. صفحه را تازه کنید.", googleLoad: "بارگذاری ورود با گوگل ممکن نشد. اتصال اینترنت را بررسی کنید." }
      : { secure: "د پېرودونکي خوندي لاسرسی", create: "حساب جوړ کړئ", welcome: "ښه راغلاست", registerBody: "د فرمایش او تعقیب لپاره خپل معلومات ولیکئ.", loginBody: "خپلې ټوکرۍ او فرمایشونو لیدلو لپاره ننوځئ.", returnNote: "له ننوتلو وروسته بېرته همدې برخې ته راګرځئ او ټوکرۍ مو ساتل کېږي.", first: "نوم", last: "تخلص", phone: "د اړیکې شمېره (اختیاري)", wait: "لږ انتظار وکړئ…", createButton: "حساب جوړول", loginButton: "ننوتل", or: "یا", registered: "مخکې مو حساب جوړ کړی؟", new: "په درملتون کې نوي یاست؟", continue: "له ننوتلو پرته دوام", invalid: "معلومات وګورئ او بیا هڅه وکړئ.", connection: "له سرور سره اړیکه ونه شوه. خپله اړیکه وګورئ.", sync: "تاسو ننوتل، خو د مېلمه ټوکرۍ همغږې نه شوه. اړیکه وګورئ او بیا هڅه وکړئ.", googleMissing: "ګوګل د ننوتلو سم معلومات ورنه کړل. بیا هڅه وکړئ.", googleChanged: "د ګوګل ننوتلو امستنې بدلې شوې. پاڼه تازه کړئ.", googleLoad: "په ګوګل ننوتل پورته نه شول. خپله اړیکه وګورئ." };

  const finishAuthentication = useCallback(async (profile?: User) => {
    if (audience === "staff" && !isStaffRole(profile?.role)) {
      await fetch("/api/auth/logout", { method: "POST" });
      setError(
        "این حساب اجازه دسترسی به پنل کارمندان را ندارد. با حساب کارمند وارد شوید."
      );
      return;
    }
    if (audience === "customer") {
      try {
        await synchronizeGuestCart();
      } catch {
        setError(customerCopy.sync);
        return;
      }
    }
    const destination = postLoginPath(profile?.role, audience, returnTo);
    if (!destination) return;
    router.push(destination);
    router.refresh();
  }, [audience, customerCopy.sync, returnTo, router]);

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
          await finishAuthentication(payload.user);
          return;
        }
        const code = payload.error?.code || "";
        const message = googleErrorMessages[code];
        setError(message?.[locale === "en" ? 0 : locale === "fa-AF" ? 1 : 2] || customerCopy.invalid);
      } catch {
        setError(customerCopy.connection);
      } finally {
        setBusy(false);
      }
    },
    [customerCopy.connection, customerCopy.invalid, finishAuthentication, locale]
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
        await finishAuthentication(payload.user);
      } else {
        setError(
          customerCopy.invalid
        );
      }
    } catch {
      setError(customerCopy.connection);
    } finally {
      setBusy(false);
    }
  }

  const register = mode === "register";
  return (
    <form method="post" className={`auth-card${audience === "customer" ? ` ${styles.card}` : ""}`} onSubmit={submit}
      onInvalidCapture={event => {
        if (audience === "customer" && event.target instanceof HTMLInputElement) event.target.setCustomValidity(accountValidation(event.target.validity, locale));
      }}
      onInputCapture={event => {
        if (audience === "customer" && event.target instanceof HTMLInputElement) event.target.setCustomValidity("");
      }}
    >
      <Image
        className="auth-brand"
        src="/brand/darmalton-logo.png"
        alt={locale === "en" ? "Darmalton" : "درملتون"}
        width={160}
        height={64}
        priority
      />
      <p className="eyebrow">
        {audience === "staff" ? "دسترسی امن کارمندان" : customerCopy.secure}
      </p>
      <h1>
        {audience === "staff"
          ? "ورود به پنل کارمندان"
          : register
            ? customerCopy.create
            : customerCopy.welcome}
      </h1>
      <p className="muted">
        {audience === "staff"
          ? "با حساب کارمند، داروساز یا مدیر وارد شوید."
          : register
          ? customerCopy.registerBody
          : customerCopy.loginBody}
      </p>
      {returnTo && (
        <p className="auth-return-note">
          {audience === "staff" ? "پس از ورود به همان بخش قبلی برمی‌گردید." : customerCopy.returnNote}
        </p>
      )}
      {register && (
        <div className="two-columns">
          <label>
            <span>{customerCopy.first}</span>
            <input name="first_name" required autoComplete="given-name" />
          </label>
          <label>
            <span>{customerCopy.last}</span>
            <input name="last_name" required autoComplete="family-name" />
          </label>
        </div>
      )}
      <label>
        <span>{t("email")}</span>
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
          <span>{customerCopy.phone}</span>
          <input dir="ltr" name="phone" autoComplete="tel" />
        </label>
      )}
      <label>
        <span>{t("password")}</span>
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
        {busy ? customerCopy.wait : register ? customerCopy.createButton : customerCopy.loginButton}
      </button>
      {audience === "customer" && (
        <>
          <div className="auth-divider" aria-hidden="true">
            <span>{customerCopy.or}</span>
          </div>
          <GoogleSignInButton
            clientId={googleClientId}
            mode={mode}
            locale={locale}
            busy={busy}
            onCredential={submitGoogle}
            onError={setError}
            messages={{
              missingCredential: customerCopy.googleMissing,
              configurationChanged: customerCopy.googleChanged,
              loadFailed: customerCopy.googleLoad
            }}
          />
          <p className="auth-switch">
            {register ? customerCopy.registered : customerCopy.new}{" "}
            <Link
              href={`${register ? "/login" : "/register"}${
                returnTo
                  ? `?${new URLSearchParams({ returnTo }).toString()}`
                  : ""
              }`}
            >
              {register ? customerCopy.loginButton : customerCopy.createButton}
            </Link>
          </p>
        </>
      )}
      <p className="auth-switch">
        {!register && audience === "customer" && <Link href="/forgot-password">{t("forgot")}</Link>}{" "}
        <Link href="/">{audience === "staff" ? "ادامه بدون ورود" : customerCopy.continue}</Link>
      </p>
    </form>
  );
}
