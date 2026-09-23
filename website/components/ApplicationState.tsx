"use client";

import Link from "next/link";
import { useLocale } from "./LocaleProvider";
import type { TextKey } from "@/lib/locale";
import styles from "./ApplicationState.module.css";

export function ApplicationState({ title, body, retry, href = "/", action = "backHome" }: {
  title: TextKey;
  body: TextKey;
  retry?: () => void;
  href?: string;
  action?: TextKey;
}) {
  const { t } = useLocale();
  return <section className={`page-section narrow ${styles.page}`}>
    <div className={styles.panel} role={retry ? "alert" : undefined}>
      <h1>{t(title)}</h1>
      <p>{t(body)}</p>
      {retry ? <button onClick={retry}>{t("retry")}</button> : <Link className="button" href={href}>{t(action)}</Link>}
    </div>
  </section>;
}
