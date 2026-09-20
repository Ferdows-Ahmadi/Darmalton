"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ApiError, apiFetch } from "@/lib/api";
import { useAuthenticated } from "@/components/AuthStateProvider";
import { checkoutError, missingCheckoutFields } from "@/lib/checkout-feedback";
import { useLocale } from "@/components/LocaleProvider";
import { formatMoney, formatNumber, productName } from "@/lib/locale";
import type { Address, Cart, Order, PageResult } from "@/lib/types";
import styles from "./checkout.module.css";

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
  const [loading, setLoading] = useState(true);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const router = useRouter();
  const { locale, t } = useLocale();
  const copy = locale === "en"
    ? { home: "Home", intro: "Choose a delivery address. Cash on delivery is the only payment method currently available.", saveError: "The address could not be saved.", confirm: "Place a cash-on-delivery order for", orderError: "The order could not be placed.", other: "Add another address", new: "New delivery address", optional: "optional", cod: "Cash on delivery", placing: "Placing order…" }
    : locale === "fa-AF"
      ? { home: "خانه", intro: "آدرس تحویل را انتخاب کنید. در این مرحله فقط پرداخت نقدی هنگام تحویل پشتیبانی می‌شود.", saveError: "آدرس ذخیره نشد.", confirm: "سفارش پرداخت هنگام تحویل ثبت شود؟ مبلغ", orderError: "سفارش ثبت نشد.", other: "افزودن آدرس دیگر", new: "آدرس تحویل جدید", optional: "اختیاری", cod: "نقدی هنگام تحویل", placing: "در حال ثبت سفارش…" }
      : { home: "کور", intro: "د سپارلو پته وټاکئ. اوس یوازې د سپارلو پر مهال نغدې پیسې منل کېږي.", saveError: "پته ونه ساتل شوه.", confirm: "د سپارلو پر مهال د نغدو پیسو فرمایش ثبت شي؟ بیه", orderError: "فرمایش ثبت نه شو.", other: "بله پته زیاتول", new: "د سپارلو نوې پته", optional: "اختیاري", cod: "د سپارلو پر مهال نغدې پیسې", placing: "فرمایش ثبتېږي…" };

  const load = useCallback(async function load() {
    if (!authenticated) {
      router.replace("/checkout/login");
      return;
    }
    setLoading(true);
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
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) router.replace("/checkout/login");
      else setError(checkoutError(caught, locale, t("connection")));
    } finally {
      setLoading(false);
    }
  }, [authenticated, router, locale, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const missing = missingCheckoutFields(data);
    if (locale === "fa-AF" && missing.length) {
      setInvalidFields(missing);
      setError("بخش‌های مشخص‌شده را برای آدرس تحویل تکمیل کنید.");
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${missing[0]}"]`)?.focus();
      return;
    }
    setInvalidFields([]);
    setBusy(true);
    try {
      const address = await apiFetch<Address>("addresses/", {
        method: "POST",
        body: JSON.stringify({ ...emptyAddress, ...data, is_default: true })
      });
      setShowForm(false);
      await load();
      setSelected(address.id);
    } catch (err) {
      setError(checkoutError(err, locale, copy.saveError));
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
      setError(checkoutError(err, locale, copy.orderError));
      setBusy(false);
    }
  }

  return (
    <section className={`page-section${locale === "fa-AF" ? ` ${styles.checkout}` : " narrow"}`}>
      <nav className={styles.breadcrumb} aria-label={t("checkout")}>
        <Link href="/">{t("home")}</Link><span aria-hidden="true">/</span>
        <Link href="/cart">{t("cart")}</Link><span aria-hidden="true">/</span><span>{t("checkout")}</span>
      </nav>
      <h1>{t("checkout")}</h1>
      <p className="muted">{copy.intro}</p>
      {error && <p id="checkout-error" className="form-error" role="alert">{error}</p>}
      {loading ? <p role="status">{t("loading")}</p> : !cart ? <button className="secondary" onClick={() => { setError(""); void load(); }}>{t("retry")}</button> : (
        <div className={styles.layout}>
          <div className={styles.flow}>
            <section className={styles.delivery} aria-labelledby="checkout-address-title">
              <h2 id="checkout-address-title"><span aria-hidden="true">{formatNumber(1, locale)}</span>{t("address")}</h2>
              {!showForm ? <>
                <div className="address-grid">
                  {addresses.map(address => <label className={`address-card ${selected === address.id ? "selected" : ""}`} key={address.id}>
                    <input type="radio" name="address" value={address.id} checked={selected === address.id} onChange={() => setSelected(address.id)}/>
                    <strong>{address.label || t("address")}</strong>
                    {address.is_default && <small className={styles.defaultTag}>{t("defaultAddress")}</small>}
                    <span>{address.recipient_name} · <bdi dir="ltr">{address.recipient_phone}</bdi></span>
                    <span>{address.street_address}، {address.city}، {address.province}</span>
                  </label>)}
                </div>
                <button className="secondary" onClick={() => { setShowForm(true); setError(""); setInvalidFields([]); }}>{copy.other}</button>
              </> : <form className={styles.addressForm} onSubmit={createAddress} noValidate={locale === "fa-AF"}>
                <h3>{copy.new}</h3>
                <div className="form-grid">
                  {Object.entries({
                    recipient_name: t("recipient_name"), recipient_phone: t("recipient_phone"),
                    province: t("province"), city: t("city"), district: `${t("district")} (${copy.optional})`,
                    street_address: t("street_address"), landmark: `${t("landmark")} (${copy.optional})`
                  }).map(([name, label]) => <label key={name} className={name === "street_address" || name === "landmark" ? "full" : ""}>
                    <span>{label}</span>
                    <input name={name} dir={name === "recipient_phone" ? "ltr" : undefined}
                      type={name === "recipient_phone" ? "tel" : "text"}
                      autoComplete={name === "recipient_name" ? "name" : name === "recipient_phone" ? "tel" : undefined}
                      required={!name.match(/district|landmark/)}
                      aria-invalid={invalidFields.includes(name) || undefined}
                      aria-describedby={invalidFields.includes(name) ? `${name}-error` : undefined}
                      onInput={() => setInvalidFields(current => current.filter(field => field !== name))}/>
                    {invalidFields.includes(name) && <small id={`${name}-error`} className={styles.fieldError}>این بخش را تکمیل کنید.</small>}
                  </label>)}
                </div>
                <div className="actions">
                  <button disabled={busy}>{busy ? t("loading") : t("save")}</button>
                  {!!addresses.length && <button type="button" className="secondary" disabled={busy} onClick={() => { setShowForm(false); setError(""); setInvalidFields([]); }}>{t("cancel")}</button>}
                </div>
              </form>}
            </section>
            <section className={styles.payment} aria-labelledby="checkout-payment-title">
              <h2 id="checkout-payment-title"><span aria-hidden="true">{formatNumber(2, locale)}</span>{t("payment")}</h2>
              <label className="check-label"><input type="radio" name="payment" value="COD" checked readOnly/>{copy.cod}</label>
            </section>
          </div>
          <aside className={styles.summary} aria-labelledby="checkout-summary-title">
            <h2 id="checkout-summary-title"><span aria-hidden="true">{formatNumber(3, locale)}</span>{t("summary")}</h2>
            <ul className={styles.items}>
              {cart.items.map(item => <li key={item.id}>
                <div><Link href={`/medicines/${item.medicine.id}`}>{productName(item.medicine, locale)}</Link><small><bdi>{item.medicine.strength}</bdi> · {t("quantity")}: {formatNumber(item.quantity, locale)}</small></div>
                <strong>{formatMoney(item.line_total, locale)}</strong>
              </li>)}
            </ul>
            {!cart.items.length && <p>{t("emptyCart")}</p>}
            <div className={styles.total}><span>{t("subtotal")}</span><strong>{formatMoney(cart.subtotal, locale)}</strong></div>
            <small>{t("finalPrice")}</small>
            {showForm && locale === "fa-AF" && <small>ابتدا آدرس تحویل را ذخیره کنید.</small>}
            <button className="primary wide checkout-button" disabled={showForm || !selected || !cart.items.length || busy} onClick={placeOrder}>{busy ? copy.placing : t("placeOrder")}</button>
            <Link className={styles.cartLink} href="/cart">{t("cart")}</Link>
          </aside>
        </div>
      )}
    </section>
  );
}
