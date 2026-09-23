"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useLocale } from "@/components/LocaleProvider";
import { AccountShell } from "@/components/AccountShell";

export default function PrescriptionSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLocale();
  const content = (
      <div className="state success-state">
        <span className="state-symbol" aria-hidden="true">✓</span>
        <h1>{t("rxSuccess")}</h1>
        <p>{t("rxPrivate")}</p>
        <Link className="button" href={`/account/prescriptions/${id}`}>
          {t("view")}
        </Link>
      </div>
  );
  return <section className="page-section narrow">{locale !== "en" ? <AccountShell>{content}</AccountShell> : content}</section>;
}
