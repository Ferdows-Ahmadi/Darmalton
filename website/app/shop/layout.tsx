"use client";

import styles from "./shop.module.css";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.shop}>{children}</div>;
}
