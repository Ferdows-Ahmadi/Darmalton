"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiFetch, money } from "@/lib/api";
import { MedicineMedia } from "@/components/MedicineMedia";
import type { Cart } from "@/lib/types";

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const load = useCallback(async function load() {
    try {
      setCart(await apiFetch<Cart>("cart/"));
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.push("/login");
      else setError(err instanceof Error ? err.message : "سبد خرید بار نشد.");
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function update(id: string, quantity: number) {
    if (quantity < 1) return;
    try {
      await apiFetch(`cart/items/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ quantity })
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "سبد خرید به‌روز نشد.");
    }
  }

  async function remove(id: string) {
    try {
      await apiFetch(`cart/items/${id}/`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "محصول حذف نشد.");
    }
  }

  return (
    <section className="page-section narrow">
      <p className="eyebrow">انتخاب‌های شما</p>
      <h1>سبد خرید</h1>
      <p className="muted">
        {cart
          ? `${cart.item_count.toLocaleString("fa-AF")} قلم محصول در سبد شما`
          : "قیمت و موجودی سبد از سرور داروخانه خوانده می‌شود."}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!cart && !error && <div className="loading">در حال بارگذاری سبد...</div>}
      {cart && !cart.items.length && (
        <div className="empty-state">
          <h2>سبد خرید شما خالی است</h2>
          <p>یک محصول موجود را انتخاب کنید.</p>
          <Link className="button" href="/">
            مشاهده محصولات
          </Link>
        </div>
      )}
      {cart && cart.items.length > 0 && (
        <>
          <div className="cart-list">
            {cart.items.map((item) => {
              const name =
                item.medicine.brand_name_dari || item.medicine.brand_name;
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
                    aria-label={`تعداد ${name}`}
                    dir="ltr"
                  >
                    <button
                      onClick={() => update(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="کاهش تعداد"
                    >
                      −
                    </button>
                    <span>{item.quantity.toLocaleString("fa-AF")}</span>
                    <button
                      onClick={() => update(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.available_quantity}
                      aria-label="افزایش تعداد"
                    >
                      +
                    </button>
                  </div>
                  <strong>{money(item.line_total)}</strong>
                  <button
                    className="danger-link"
                    onClick={() => remove(item.id)}
                  >
                    حذف
                  </button>
                </article>
              );
            })}
          </div>
          <div className="cart-summary">
            <span>مجموع فعلی</span>
            <strong>{money(cart.subtotal)}</strong>
            <small>مجموع نهایی و موجودی هنگام ثبت سفارش دوباره تأیید می‌شود.</small>
            <Link className="button primary" href="/checkout">
              ادامه به پرداخت
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
