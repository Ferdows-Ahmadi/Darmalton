"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AccountShell } from "./AccountShell";
import { useLocale } from "./LocaleProvider";
import { State } from "./StoreUI";
import { ApiError, apiFetch } from "@/lib/api";
import { loginPath } from "@/lib/auth-navigation";
import { prescriptionStatus } from "@/lib/status";
import type { Prescription } from "@/lib/types";

export function PrescriptionDetail({ id }: { id: string }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [item, setItem] = useState<Prescription | null>(null);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setItem(await apiFetch<Prescription>(`prescriptions/${id}/`));
      setError("");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.push(loginPath(`/account/prescriptions/${id}`));
        return;
      }
      setError(caught instanceof Error ? caught.message : t("connection"));
    }
  }, [id, router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function respond() {
    try {
      await apiFetch(`prescriptions/${id}/respond/`, {
        method: "POST",
        body: JSON.stringify({ response })
      });
      setResponse("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("connection"));
    }
  }

  async function addApproved() {
    try {
      await apiFetch(`prescriptions/${id}/add-authorized-to-cart/`, {
        method: "POST",
        body: "{}"
      });
      router.push("/cart");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("connection"));
    }
  }

  return (
    <section className="page-section">
      <AccountShell>
        {error && <State kind="error" title="unavailable" body="connection" retry={() => void load()} />}
        {!item && !error && <p className="loading">{t("loading")}</p>}
        {item && (
          <div className="record-list">
            <header className="section-heading">
              <div>
                <p className="eyebrow">{t("rxList")}</p>
                <h1>{item.patient_name || t("rx")}</h1>
              </div>
              <span className="status">{prescriptionStatus(item.status, locale)}</span>
            </header>
            <div className="panel">
              <div className="summary-row">
                <span>{t("date")}</span>
                <time>{new Date(item.created_at).toLocaleString(locale)}</time>
              </div>
              <Link
                className="button secondary"
                href={`/api/backend/prescriptions/${item.id}/file/?download=1`}
              >
                {t("file")}
              </Link>
            </div>
            {item.customer_visible_note && <div className="panel"><p>{item.customer_visible_note}</p></div>}
            {item.clarification_request && (
              <div className="panel">
                <h2>{t("response")}</h2>
                <p>{item.clarification_request}</p>
                {item.can_respond && (
                  <div className="actions">
                    <input value={response} onChange={(event) => setResponse(event.target.value)} />
                    <button disabled={!response.trim()} onClick={() => void respond()}>
                      {t("send")}
                    </button>
                  </div>
                )}
              </div>
            )}
            {item.authorized_medicines.length > 0 && (
              <div className="panel">
                <h2>{t("authorized")}</h2>
                {item.authorized_medicines.map((medicine) => (
                  <div className="summary-row" key={medicine.id}>
                    <span>{medicine.medicine_name}</span>
                    <strong>{medicine.max_quantity.toLocaleString(locale)}</strong>
                  </div>
                ))}
                {item.can_add_to_cart && (
                  <button onClick={() => void addApproved()}>{t("addBundle")}</button>
                )}
              </div>
            )}
          </div>
        )}
      </AccountShell>
    </section>
  );
}
