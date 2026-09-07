"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import { loginPath } from "@/lib/auth-navigation";
import {
  guestCart,
  removeGuestCartItem,
  updateGuestCartItem
} from "@/lib/guest-cart";
import { MedicineMedia } from "@/components/MedicineMedia";
import { useLocale } from "@/components/LocaleProvider";
import { formatMoney, formatNumber, productName } from "@/lib/locale";
import type { Cart } from "@/lib/types";

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [guest, setGuest] = useState(false);
  const { locale, t } = useLocale();
  const copy = locale === "en"
    ? { kicker: "Your selections", count: "items in your cart", server: "Prices and availability come from the pharmacy server.", load: "The cart could not be loaded.", update: "The cart could not be updated.", remove: "The item could not be removed.", choose: "Choose an available product.", decrease: "Decrease quantity", increase: "Increase quantity" }
    : locale === "fa-AF"
      ? { kicker: "انتخاب‌های شما", count: "قلم محصول در سبد شما", server: "قیمت و موجودی سبد از سرور داروخانه خوانده می‌شود.", load: "سبد خرید بار نشد.", update: "سبد خرید به‌روز نشد.", remove: "محصول حذف نشد.", choose: "یک محصول موجود را انتخاب کنید.", decrease: "کاهش تعداد", increase: "افزایش تعداد" }
      : { kicker: "ستاسو ټاکنې", count: "توکي ستاسو په ټوکرۍ کې", server: "بیه او موجودي د درملتون له سرور څخه راځي.", load: "ټوکرۍ پورته نه شوه.", update: "ټوکرۍ تازه نه شوه.", remove: "توکی لرې نه شو.", choose: "یو موجود توکی وټاکئ.", decrease: "شمېر کمول", increase: "شمېر زیاتول" };

  const load = useCallback(async function load() {
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
        setError(err instanceof Error ? err.message : copy.load);
      }
    }
  }, [copy.load]);

  useEffect(() => {
    void load();
  }, [load]);

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
      setError(err instanceof Error ? err.message : copy.update);
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
      setError(err instanceof Error ? err.message : copy.remove);
    }
  }

  return (
    <section className="page-section">
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
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!cart && !error && <div className="loading">{t("loading")}</div>}
      {cart && !cart.items.length && (
        <div className="empty-state">
          <h2>{t("emptyCart")}</h2>
          <p>{copy.choose}</p>
          <Link className="button" href="/shop">
            {t("continueShopping")}
          </Link>
        </div>
      )}
      {cart && cart.items.length > 0 && (
        <div className="commerce-layout">
          <div className="cart-list">
            {cart.items.map((item) => {
              const name = productName(item.medicine, locale);
              return (
                <article key={item.id} className="cart-row">
                  <MedicineMedia
                    imageUrl={item.medicine.image_url}
                    alt={name}
                    width={92}
                    height={92}
                    sizes="92px"
                  />
                  <div>
                    <h2>{name}</h2>
                    <p dir="ltr">
                      {item.medicine.brand_name} · {item.medicine.strength}
                    </p>
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
                  <strong>{formatMoney(item.line_total, locale)}</strong>
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
