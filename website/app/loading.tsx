"use client";

import { useLocale } from "@/components/LocaleProvider";
import styles from "@/components/ApplicationState.module.css";

export default function LoadingPage() {
  const { t } = useLocale();
  return (
    <div className={`page-section page-skeleton ${styles.loading}`} role="status" aria-label={t("loading")}>
      <p>{t("loading")}</p>
      <div aria-hidden="true">
        <span className="skeleton skeleton-heading" />
        <span className="skeleton skeleton-copy" />
        <div className="skeleton-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <span className="skeleton skeleton-card" key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
