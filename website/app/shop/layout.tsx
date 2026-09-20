"use client";

import { useLocale } from "@/components/LocaleProvider";
import styles from "./shop.module.css";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  return <div className={locale === "fa-AF" ? styles.shop : undefined}>{children}</div>;
}
