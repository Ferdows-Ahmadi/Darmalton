"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

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
  busy,
  onCredential,
  onError
}: {
  clientId: string;
  mode: "login" | "register";
  busy: boolean;
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    window.__darmaltonGoogleCredentialHandler = (response) => {
      if (!response.credential) {
        onError("گوگل معلومات معتبر ورود را برنگرداند. دوباره کوشش کنید.");
        return;
      }
      onCredential(response.credential);
    };
    return () => {
      window.__darmaltonGoogleCredentialHandler = undefined;
    };
  }, [onCredential, onError]);

  const renderButton = useCallback(() => {
    if (!clientId || !window.google || !buttonRef.current) return;
    if (
      window.__darmaltonGoogleClientId &&
      window.__darmaltonGoogleClientId !== clientId
    ) {
      onError("تنظیمات ورود با گوگل تغییر کرده است. صفحه را تازه کنید.");
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
      locale: "fa"
    });
  }, [clientId, mode, onError]);

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
        src="https://accounts.google.com/gsi/client?hl=fa"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() =>
          onError("بارگذاری ورود با گوگل ممکن نشد. اتصال اینترنت را بررسی کنید.")
        }
      />
      <div className="google-button-wrap" aria-busy={busy}>
        <div ref={buttonRef} className="google-button-host" />
        {busy && <span className="google-button-blocker" aria-hidden="true" />}
      </div>
    </>
  );
}
