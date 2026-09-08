"use client";

import { useEffect, useState } from "react";

import { useLocale } from "./LocaleProvider";

type ToastKind = "success" | "information" | "warning" | "error";

const symbols: Record<ToastKind, string> = {
  success: "✓",
  information: "i",
  warning: "!",
  error: "×"
};

export function Toast({
  kind,
  message
}: {
  kind: ToastKind;
  message: string;
}) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(true);

  useEffect(() => setVisible(true), [message]);
  if (!visible) return null;

  return (
    <div
      className={`toast toast-${kind}`}
      role={kind === "error" || kind === "warning" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
    >
      <span className="toast-symbol" aria-hidden="true">{symbols[kind]}</span>
      <span>{message}</span>
      <button
        type="button"
        className="toast-dismiss"
        aria-label={t("close")}
        onClick={() => setVisible(false)}
      >
        ×
      </button>
    </div>
  );
}
