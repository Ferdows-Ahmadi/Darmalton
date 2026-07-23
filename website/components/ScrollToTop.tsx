"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
