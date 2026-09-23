"use client";

import Link from "next/link";
import { customerText } from "@/lib/customer-copy";
import { useCallback, useEffect, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import { loginPath } from "@/lib/auth-navigation";
import { checkoutError } from "@/lib/checkout-feedback";
import {
  guestCart,
  removeGuestCartItem,
  updateGuestCartItem
} from "@/lib/guest-cart";
import { MedicineMedia } from "@/components/MedicineMedia";
import { useAuthenticated } from "@/components/AuthStateProvider";
import { MedicineCard } from "@/components/MedicineCard";
import { Toast } from "@/components/Toast";
import { Icon } from "@/components/StoreUI";
import { useLocale } from "@/components/LocaleProvider";
import { formatMoney, formatNumber, productName } from "@/lib/locale";
import { groupMedicineFamilies, localizedPackSize } from "@/lib/storefront";
import type { Cart, Medicine, PageResult } from "@/lib/types";
import styles from "./cart.module.css";

export default function CartPage() {
  const authenticated = useAuthenticated();
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [guest, setGuest] = useState(false);
  const [recommendations, setRecommendations] = useState<Medicine[]>([]);
  const { locale, t } = useLocale();
  const copy = locale === "en"
    ? { kicker: "Your selections", count: "items in your cart", server: "Prices and availability come from the pharmacy server.", load: "The cart could not be loaded.", update: "The cart could not be updated.", remove: "The item could not be removed.", choose: "Choose an available product.", decrease: "Decrease quantity", increase: "Increase quantity" }
    : locale === "fa-AF"
      ? { kicker: "انتخاب‌های شما", count: "قلم محصول در سبد شما", server: "قیمت و موجودی سبد از سرور داروخانه خوانده می‌شود.", load: "سبد خرید بار نشد.", update: "سبد خرید به‌روز نشد.", remove: "محصول حذف نشد.", choose: "یک محصول موجود را انتخاب کنید.", decrease: "کاهش تعداد", increase: "افزایش تعداد" }
      : { kicker: "ستاسو ټاکنې", count: "توکي ستاسو په ټوکرۍ کې", server: "بیه او موجودي د درملتون له سرور څخه راځي.", load: "ټوکرۍ پورته نه شوه.", update: "ټوکرۍ تازه نه شوه.", remove: "توکی لرې نه شو.", choose: "یو موجود توکی وټاکئ.", decrease: "شمېر کمول", increase: "شمېر زیاتول" };

  const load = useCallback(async function load() {
    if (!authenticated) {
      setGuest(true);
      setCart(guestCart());
      setError("");
      return;
    }
    try {
      setCart(await apiFetch<Cart>("cart/"));
      setGuest(false);
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setGuest(true);
        setCart(guestCart());
        setError("");
      } else {
        setError(checkoutError(err, locale, copy.load));
      }
    }
  }, [authenticated, copy.load, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (cart?.items.length !== 0 || recommendations.length) return;
    apiFetch<PageResult<Medicine>>("medicines/?family_listing=true&ordering=name")
      .then((result) => setRecommendations(result.results))
      .catch(() => undefined);
  }, [cart, recommendations.length]);

  async function update(id: string, quantity: number) {
    if (quantity < 1) return;
    if (guest) {
      updateGuestCartItem(id.replace(/^guest:/, ""), quantity);
      setCart(guestCart());
      return;
    }
    try {
      await apiFetch(`cart/items/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ quantity })
      });
      await load();
    } catch (err) {
      setError(checkoutError(err, locale, copy.update));
    }
  }

  async function remove(id: string) {
    if (guest) {
      removeGuestCartItem(id.replace(/^guest:/, ""));
      setCart(guestCart());
      return;
    }
    try {
      await apiFetch(`cart/items/${id}/`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(checkoutError(err, locale, copy.remove));
    }
  }

  return (
    <section className={`page-section ${styles.cart}`}>
      {<nav className={styles.breadcrumb} aria-label={customerText(locale, "مسیر صفحه")}><Link href="/">{t("home")}</Link><span aria-hidden="true">/</span><span aria-current="page">{t("cart")}</span></nav>}
      <p className="eyebrow">{copy.kicker}</p>
      <h1>{t("cart")}</h1>
      <p className="muted">
        {cart
          ? `${formatNumber(cart.item_count, locale)} ${copy.count}`
          : copy.server}
      </p>
      {guest && (
        <p className="guest-cart-note">
          {t("guestCart")}
        </p>
      )}
      {error && <Toast kind="error" message={error} />}
      {!cart && !error && <div className="loading">{t("loading")}</div>}
      {cart && !cart.items.length && (
        <>
          <div className="empty-state cart-empty-state">
            {<span className={styles.emptyIcon} aria-hidden="true"><Icon name="ICON-004_Cart" size={48}/></span>}
            <div><p className="eyebrow">Darmalton</p><h2>{t("emptyCart")}</h2><p>{copy.choose}</p>
              <Link className="button" href="/shop">{t("continueShopping")}</Link>
            </div>
          </div>
          {recommendations.length > 0 && <section className="section empty-cart-recommendations">
            <div className="section-heading"><h2>{t("popularMedicines")}</h2><Link href="/shop">{t("viewAll")}</Link></div>
            <div className="product-rail">
              {groupMedicineFamilies(recommendations).slice(0, 6).map((family) => <MedicineCard key={family.code} medicine={family.medicine} variants={family.variants} presentation={"marketplace"} />)}
            </div>
          </section>}
        </>
      )}
      {cart && cart.items.length > 0 && (
        <div className="commerce-layout">
          <div className="cart-list">
            {cart.items.map((item, index) => {
              const name = productName(item.medicine, locale);
              const media = <MedicineMedia imageUrl={item.medicine.image_url} alt={name} width={92} height={92} sizes="92px" priority={index === 0}/>;
              return (
                <article key={item.id} className="cart-row">
                  {<Link className={styles.photo} href={`/medicines/${item.medicine.id}`}>{media}</Link>}
                  <div className="cart-item-copy">
                    <h2>{<Link href={`/medicines/${item.medicine.id}`}>{name}</Link>}</h2>
                    <p dir="ltr">
                      {item.medicine.brand_name} · {item.medicine.strength}
                    </p>
                    {<>
                      <p>{localizedPackSize(item.medicine.pack_size, locale)}</p>
                      {item.medicine.prescription_required && <span className={styles.rx}>{t("requiresRx")}</span>}
                      <p className={styles.unitPrice}>{customerText(locale, "قیمت واحد")} <b>{formatMoney(item.unit_price, locale)}</b></p>
                    </>}
                  </div>
                  <div
                    className="quantity"
                    aria-label={`${t("quantity")}: ${name}`}
                    dir="ltr"
                  >
                    <button
                      onClick={() => update(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label={copy.decrease}
                    >
                      −
                    </button>
                    <span>{formatNumber(item.quantity, locale)}</span>
                    <button
                      onClick={() => update(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.available_quantity}
                      aria-label={copy.increase}
                    >
                      +
                    </button>
                  </div>
                  <strong className="cart-line-total">{<small>{customerText(locale, "مجموع")}</small>}{formatMoney(item.line_total, locale)}</strong>
                  <button
                    className="danger-link"
                    onClick={() => remove(item.id)}
                  >
                    {t("remove")}
                  </button>
                </article>
              );
            })}
          </div>
          <aside className="summary">
            <h2>{t("summary")}</h2>
            <div className="summary-row"><span>{t("subtotal")}</span><strong>{formatMoney(cart.subtotal, locale)}</strong></div>
            <small>{t("finalPrice")}</small>
            <Link
              className="button wide"
              href={guest ? loginPath("/checkout") : "/checkout"}
            >
              {t("checkout")}
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
