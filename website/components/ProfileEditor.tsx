"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AccountShell } from "./AccountShell";
import { useLocale } from "./LocaleProvider";
import { ApiError, apiFetch } from "@/lib/api";
import { accountError } from "@/lib/account-feedback";
import { loginPath } from "@/lib/auth-navigation";
import type { User } from "@/lib/types";

export function ProfileEditor() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch<User>("auth/me/")
      .then(setUser)
      .catch((caught) => {
        if (caught instanceof ApiError && caught.status === 401) {
          router.push(loginPath("/account/profile"));
        } else {
          setMessage(accountError(caught, locale, t("connection")));
        }
      });
  }, [locale, router, t]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      setUser(
        await apiFetch<User>("auth/me/", {
          method: "PATCH",
          body: JSON.stringify({ ...body, preferred_language: locale === "fa-AF" ? "fa" : locale })
        })
      );
      setMessage(t("saved"));
    } catch (caught) {
      setMessage(accountError(caught, locale, t("connection")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-section">
      <AccountShell>
        <p className="eyebrow">{t("account")}</p>
        <h1>{t("profile")}</h1>
        {!user ? (
          <p className={message ? "form-error" : "loading"} role={message ? "alert" : undefined}>{message || t("loading")}</p>
        ) : (
          <form className="panel form-grid" onSubmit={submit}>
            <label>
              <span>{t("first_name")}</span>
              <input name="first_name" defaultValue={user.first_name} required />
            </label>
            <label>
              <span>{t("last_name")}</span>
              <input name="last_name" defaultValue={user.last_name} required />
            </label>
            <label>
              <span>{t("phone")}</span>
              <input name="phone" defaultValue={user.phone || ""} dir="ltr" />
            </label>
            <label>
              <span>{t("email")}</span>
              <input value={user.email} readOnly dir="ltr" />
            </label>
            <button className="full" disabled={busy}>
              {busy ? t("loading") : t("save")}
            </button>
            {message && <p className={`${message === t("saved") ? "success-banner" : "form-error"} full`} role={message === t("saved") ? "status" : "alert"}>{message}</p>}
          </form>
        )}
      </AccountShell>
    </section>
  );
}
