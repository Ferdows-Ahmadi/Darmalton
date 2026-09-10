"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { useAuthenticated } from "@/components/AuthStateProvider";
import { loginPath } from "@/lib/auth-navigation";
import { useLocale } from "@/components/LocaleProvider";
import { formatMoney } from "@/lib/locale";
import type { Address, Cart, Order, PageResult } from "@/lib/types";

const emptyAddress = {
  label: "خانه",
  recipient_name: "",
  recipient_phone: "",
  country_code: "AF",
  province: "",
  city: "",
  district: "",
  street_address: "",
  landmark: "",
  is_default: true
};

export default function CheckoutPage() {
  const authenticated = useAuthenticated();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selected, setSelected] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { locale, t } = useLocale();
  const copy = locale === "en"
    ? { home: "Home", intro: "Choose a delivery address. Cash on delivery is the only payment method currently available.", saveError: "The address could not be saved.", confirm: "Place a cash-on-delivery order for", orderError: "The order could not be placed.", other: "Add another address", new: "New delivery address", optional: "optional", cod: "Cash on delivery", placing: "Placing order…" }
    : locale === "fa-AF"
      ? { home: "خانه", intro: "آدرس تحویل را انتخاب کنید. در این مرحله فقط پرداخت نقدی هنگام تحویل پشتیبانی می‌شود.", saveError: "آدرس ذخیره نشد.", confirm: "سفارش پرداخت هنگام تحویل ثبت شود؟ مبلغ", orderError: "سفارش ثبت نشد.", other: "افزودن آدرس دیگر", new: "آدرس تحویل جدید", optional: "اختیاری", cod: "نقدی هنگام تحویل", placing: "در حال ثبت سفارش…" }
      : { home: "کور", intro: "د سپارلو پته وټاکئ. اوس یوازې د سپارلو پر مهال نغدې پیسې منل کېږي.", saveError: "پته ونه ساتل شوه.", confirm: "د سپارلو پر مهال د نغدو پیسو فرمایش ثبت شي؟ بیه", orderError: "فرمایش ثبت نه شو.", other: "بله پته زیاتول", new: "د سپارلو نوې پته", optional: "اختیاري", cod: "د سپارلو پر مهال نغدې پیسې", placing: "فرمایش ثبتېږي…" };

  const load = useCallback(async function load() {
    if (!authenticated) {
      router.replace(loginPath("/checkout"));
      return;
    }
    try {
      const [{ results: list }, currentCart] = await Promise.all([
        apiFetch<PageResult<Address>>("addresses/"),
        apiFetch<Cart>("cart/")
      ]);
      setAddresses(list);
      setCart(currentCart);
      setSelected(
        list.find((item) => item.is_default)?.id || list[0]?.id || ""
      );
      setShowForm(!list.length);
    } catch {
      router.push("/checkout/login");
    }
  }, [authenticated, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const address = await apiFetch<Address>("addresses/", {
        method: "POST",
        body: JSON.stringify({ ...emptyAddress, ...data, is_default: true })
      });
      setShowForm(false);
      await load();
      setSelected(address.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.saveError);
    } finally {
      setBusy(false);
    }
  }

  async function placeOrder() {
    if (!selected || !cart?.items.length) return;
    if (
      !window.confirm(
        `${copy.confirm} ${formatMoney(cart.subtotal, locale)}`
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const order = await apiFetch<Order>("orders/", {
        method: "POST",
        body: JSON.stringify({ address_id: selected })
      });
      router.push(`/account/orders/${order.id}?placed=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.orderError);
      setBusy(false);
    }
  }

  return (
    <section className="page-section narrow">
      <p className="eyebrow">{copy.cod}</p>
      <h1>{t("checkout")}</h1>
      <p className="muted">{copy.intro}</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!showForm && (
        <>
          <h2 className="subheading">{t("address")}</h2>
          <div className="address-grid">
            {addresses.map((address) => (
              <label
                className={`address-card ${
                  selected === address.id ? "selected" : ""
                }`}
                key={address.id}
              >
                <input
                  type="radio"
                  name="address"
                  value={address.id}
                  checked={selected === address.id}
                  onChange={() => setSelected(address.id)}
                />
                <strong>{address.label || t("address")}</strong>
                <span>
                  {address.recipient_name} ·{" "}
                  <bdi dir="ltr">{address.recipient_phone}</bdi>
                </span>
                <span>
                  {address.street_address}، {address.city}، {address.province}
                </span>
              </label>
            ))}
            <button
              className="secondary"
              onClick={() => setShowForm(true)}
            >
              {copy.other}
            </button>
          </div>
        </>
      )}
      {showForm && (
        <form className="panel form-grid" onSubmit={createAddress}>
          <h2>{copy.new}</h2>
          {Object.entries({
            recipient_name: t("recipient_name"),
            recipient_phone: t("recipient_phone"),
            province: t("province"),
            city: t("city"),
            district: `${t("district")} (${copy.optional})`,
            street_address: t("street_address"),
            landmark: `${t("landmark")} (${copy.optional})`
          }).map(([name, label]) => (
            <label
              key={name}
              className={
                name === "street_address" || name === "landmark" ? "full" : ""
              }
            >
              <span>{label}</span>
              <input
                name={name}
                dir={name === "recipient_phone" ? "ltr" : undefined}
                required={!name.match(/district|landmark/)}
              />
            </label>
          ))}
          <button className="primary" disabled={busy}>
            {t("save")}
          </button>
        </form>
      )}
      {!showForm && (
        <>
          <div className="panel checkout-summary">
            <h2>{t("summary")}</h2>
            <div>
              <span>{t("subtotal")}</span>
              <strong>{formatMoney(cart?.subtotal ?? null, locale)}</strong>
            </div>
            <div>
              <span>{t("payment")}</span>
              <strong>{copy.cod}</strong>
            </div>
          </div>
          <button
            className="primary wide checkout-button"
            disabled={!selected || !cart?.items.length || busy}
            onClick={placeOrder}
          >
            {busy ? copy.placing : t("placeOrder")}
          </button>
        </>
      )}
    </section>
  );
}
