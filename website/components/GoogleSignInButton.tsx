"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/locale";

type GoogleCredentialResponse = {
  credential: string;
  select_by: string;
};

type GoogleButtonConfiguration = {
  type: "standard";
  theme: "outline";
  size: "large";
  text: "signin_with" | "signup_with";
  shape: "rectangular";
  logo_alignment: "left";
  width: number;
  locale: string;
};

type GoogleAccounts = {
  id: {
    initialize(configuration: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
      auto_select?: boolean;
      cancel_on_tap_outside?: boolean;
    }): void;
    renderButton(
      element: HTMLElement,
      configuration: GoogleButtonConfiguration
    ): void;
    disableAutoSelect(): void;
  };
};

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
    __darmaltonGoogleCredentialHandler?: (
      response: GoogleCredentialResponse
    ) => void;
    __darmaltonGoogleClientId?: string;
  }
}

export function GoogleSignInButton({
  clientId,
  mode,
  locale,
  busy,
  onCredential,
  onError,
  messages
}: {
  clientId: string;
  mode: "login" | "register";
  locale: Locale;
  busy: boolean;
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
  messages: {
    missingCredential: string;
    configurationChanged: string;
    loadFailed: string;
  };
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    window.__darmaltonGoogleCredentialHandler = (response) => {
      if (!response.credential) {
        onError(messages.missingCredential);
        return;
      }
      onCredential(response.credential);
    };
    return () => {
      window.__darmaltonGoogleCredentialHandler = undefined;
    };
  }, [messages.missingCredential, onCredential, onError]);

  const renderButton = useCallback(() => {
    if (!clientId || !window.google || !buttonRef.current) return;
    if (
      window.__darmaltonGoogleClientId &&
      window.__darmaltonGoogleClientId !== clientId
    ) {
      onError(messages.configurationChanged);
      return;
    }
    if (!window.__darmaltonGoogleClientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) =>
          window.__darmaltonGoogleCredentialHandler?.(response),
        auto_select: false,
        cancel_on_tap_outside: true
      });
      window.__darmaltonGoogleClientId = clientId;
    }
    buttonRef.current.replaceChildren();
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: mode === "register" ? "signup_with" : "signin_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: Math.min(buttonRef.current.clientWidth || 400, 400),
      locale: locale === "en" ? "en" : locale === "fa-AF" ? "fa" : "ps"
    });
  }, [clientId, locale, messages.configurationChanged, mode, onError]);

  useEffect(() => {
    if (!scriptReady) return;
    renderButton();
    window.addEventListener("resize", renderButton);
    return () => window.removeEventListener("resize", renderButton);
  }, [renderButton, scriptReady]);

  if (!clientId) {
    const label = locale === "en"
      ? mode === "register" ? "Sign up with Google" : "Sign in with Google"
      : locale === "ps-AF"
        ? mode === "register" ? "له ګوګل سره حساب جوړ کړئ" : "له ګوګل سره ننوځئ"
        : mode === "register" ? "ایجاد حساب با گوگل" : "ورود با گوگل";
    const unavailable = locale === "en"
      ? "Available when Google sign-in is configured."
      : locale === "ps-AF"
        ? "د ګوګل ننوتلو له تنظیم وروسته فعالیږي."
        : "پس از تنظیم ورود گوگل فعال می‌شود.";
    return (
      <div className="google-entry-unavailable" role="status">
        <button className="google-entry-button" type="button" disabled aria-describedby="google-entry-note">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/>
            <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/>
            <path fill="#FBBC05" d="M6.39 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.13 1.04 4.48l3.35-2.62Z"/>
            <path fill="#EA4335" d="M12 6.01c1.47 0 2.78.5 3.82 1.49l2.88-2.88A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6 12 6Z"/>
          </svg>
          <span>{label}</span>
        </button>
        <small id="google-entry-note">{unavailable}</small>
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://accounts.google.com/gsi/client?hl=${locale === "en" ? "en" : locale === "fa-AF" ? "fa" : "ps"}`}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() =>
          onError(messages.loadFailed)
        }
      />
      <div className="google-button-wrap" aria-busy={busy}>
        <div ref={buttonRef} className="google-button-host" />
        {busy && <span className="google-button-blocker" aria-hidden="true" />}
      </div>
    </>
  );
}
