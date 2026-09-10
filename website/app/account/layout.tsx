"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthenticated } from "@/components/AuthStateProvider";
import { useLocale } from "@/components/LocaleProvider";
import { loginPath } from "@/lib/auth-navigation";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const authenticated = useAuthenticated();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    if (!authenticated) router.replace(loginPath(pathname));
  }, [authenticated, pathname, router]);

  if (!authenticated) {
    return <div className="loading auth-route-loading">{t("loading")}</div>;
  }
  return children;
}
