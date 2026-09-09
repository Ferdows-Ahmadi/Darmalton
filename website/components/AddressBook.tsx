"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AccountShell } from "./AccountShell";
import { useLocale } from "./LocaleProvider";
import { State } from "./StoreUI";
import { ApiError, apiFetch } from "@/lib/api";
import { loginPath } from "@/lib/auth-navigation";
import type { Address, PageResult } from "@/lib/types";

export function AddressBook() {
  const { t } = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<Address[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await apiFetch<PageResult<Address>>("addresses/");
      setItems(result.results);
      setError("");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.push(loginPath("/account/addresses"));
        return;
      }
      setError(caught instanceof Error ? caught.message : t("connection"));
    }
  }, [router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: string) {
    if (!window.confirm(t("removeConfirm"))) return;
    try {
      await apiFetch(`addresses/${id}/`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("connection"));
    }
  }

  return (
    <section className="page-section">
      <AccountShell>
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t("account")}</p>
            <h1>{t("addresses")}</h1>
          </div>
          <Link className="button" href="/account/addresses/new">
            {t("newAddress")}
          </Link>
        </div>
        {error && <p className="form-error">{error}</p>}
        {!items && !error && <p className="loading">{t("loading")}</p>}
        {items?.length === 0 && (
          <State title="addresses" body="newAddress" actionHref="/account/addresses/new" actionLabel="newAddress" />
        )}
        <div className="address-grid">
          {items?.map((address) => (
            <article className="address-card" key={address.id}>
              <span className="status">
                {address.is_default ? t("defaultAddress") : address.label || t("address")}
              </span>
              <h2>{address.recipient_name}</h2>
              <p>
                {address.street_address}, {address.city}, {address.province}
              </p>
              <p dir="ltr">{address.recipient_phone}</p>
              <div className="actions">
                <Link className="button secondary" href={`/account/addresses/${address.id}/edit`}>
                  {t("edit")}
                </Link>
                <button className="danger-link" onClick={() => void remove(address.id)}>
                  {t("remove")}
                </button>
              </div>
            </article>
          ))}
        </div>
      </AccountShell>
    </section>
  );
}
