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
    return (
      <p className="google-unavailable" role="status">
        ورود با گوگل در این محیط تنظیم نشده است.
      </p>
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
