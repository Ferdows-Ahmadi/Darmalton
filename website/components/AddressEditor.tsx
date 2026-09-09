"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AccountShell } from "./AccountShell";
import { useLocale } from "./LocaleProvider";
import { ApiError, apiFetch } from "@/lib/api";
import { loginPath } from "@/lib/auth-navigation";
import type { Locale } from "@/lib/locale";
import type { Address } from "@/lib/types";

const fields = [
  "label",
  "recipient_name",
  "recipient_phone",
  "province",
  "city",
  "district",
  "street_address",
  "landmark"
] as const;

export function AddressEditor({ id }: { id?: string }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [address, setAddress] = useState<Address | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [locationPrompt, setLocationPrompt] = useState(false);
  const locationCopy = locationText(locale);

  useEffect(() => {
    if (!id) return;
    apiFetch<Address>(`addresses/${id}/`)
      .then(setAddress)
      .catch((caught) => {
        if (caught instanceof ApiError && caught.status === 401) {
          router.push(loginPath(`/account/addresses/${id}/edit`));
        } else {
          setError(caught instanceof Error ? caught.message : t("connection"));
        }
      });
  }, [id, router, t]);

  function locate() {
    setLocationPrompt(false);
    setError("");
    if (!navigator.geolocation) {
      setError(locationCopy.unavailable);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude }),
      () => setError(locationCopy.denied),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = {
      ...Object.fromEntries(form.entries()),
      country_code: "AF",
      is_default: form.get("is_default") === "on",
      ...coordinates
    };
    try {
      await apiFetch(id ? `addresses/${id}/` : "addresses/", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(body)
      });
      router.push("/account/addresses");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("connection"));
      setBusy(false);
    }
  }

  return (
    <section className="page-section">
      <AccountShell>
        <p className="eyebrow">{t("addresses")}</p>
        <h1>{t(id ? "editAddress" : "newAddress")}</h1>
        <form className="panel form-grid" onSubmit={submit}>
          {fields.map((name) => (
            <label
              key={name}
              className={name === "street_address" || name === "landmark" ? "full" : ""}
            >
              <span>{t(name)}</span>
              <input
                name={name}
                defaultValue={address?.[name] || ""}
                dir={name === "recipient_phone" ? "ltr" : undefined}
                required={["recipient_name", "recipient_phone", "province", "city", "street_address"].includes(name)}
              />
            </label>
          ))}
          <label className="check-label full">
            <input name="is_default" type="checkbox" defaultChecked={address?.is_default} />
            {t("defaultAddress")}
          </label>
          <button type="button" className="secondary" onClick={() => setLocationPrompt(true)}>
            {t("location")}
          </button>
          <button disabled={busy}>{busy ? t("loading") : t("save")}</button>
          {coordinates && <p className="success-banner full">{t("saved")}</p>}
          {error && <p className="form-error full">{error}</p>}
        </form>
        {locationPrompt && <div className="location-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLocationPrompt(false); }}>
          <section className="location-dialog" role="dialog" aria-modal="true" aria-labelledby="location-dialog-title">
            <span className="location-dialog-icon" aria-hidden="true">⌖</span>
            <h2 id="location-dialog-title">{locationCopy.title}</h2>
            <p>{locationCopy.body}</p>
            <div className="actions">
              <button type="button" onClick={locate}>{locationCopy.continue}</button>
              <button type="button" className="secondary" onClick={() => setLocationPrompt(false)}>{locationCopy.cancel}</button>
            </div>
          </section>
        </div>}
      </AccountShell>
    </section>
  );
}

function locationText(locale: Locale) {
  if (locale === "en") return { title: "Use your current location?", body: "Your browser will ask for permission. Darmalton uses the coordinates only to help complete this delivery address.", continue: "Continue", cancel: "Not now", denied: "Location was not shared. You can enter the address manually.", unavailable: "Location is not available in this browser." };
  if (locale === "fa-AF") return { title: "از موقعیت فعلی شما استفاده شود؟", body: "مرورگر ابتدا اجازه می‌خواهد. درملتون فقط برای تکمیل همین آدرس تحویل از مختصات استفاده می‌کند.", continue: "ادامه", cancel: "فعلاً نه", denied: "موقعیت شریک نشد. می‌توانید آدرس را دستی وارد کنید.", unavailable: "موقعیت در این مرورگر در دسترس نیست." };
  return { title: "اوسنی ځای مو وکارول شي؟", body: "براوزر به لومړی اجازه وغواړي. درملتون دا مختصات یوازې د همدې سپارلو پتې د بشپړولو لپاره کاروي.", continue: "دوام", cancel: "اوس نه", denied: "ځای شریک نه شو. پته په لاس لیکلی شئ.", unavailable: "په دې براوزر کې ځای نشته." };
}
