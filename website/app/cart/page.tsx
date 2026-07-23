"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiFetch, money } from "@/lib/api";
import type { Cart } from "@/lib/types";

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const load = useCallback(async function load() {
    try {
      setCart(await apiFetch<Cart>("cart/"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.push("/login");
      else setError(err instanceof Error ? err.message : "Could not load your cart.");
    }
  }, [router]);
  useEffect(() => { void load(); }, [load]);

  async function update(id: string, quantity: number) {
    if (quantity < 1) return;
    try {
      await apiFetch(`cart/items/${id}/`, { method: "PATCH", body: JSON.stringify({ quantity }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the cart.");
    }
  }
  async function remove(id: string) {
    await apiFetch(`cart/items/${id}/`, { method: "DELETE" });
    await load();
  }

  return (
    <section className="page-section narrow">
      <p className="eyebrow">Your selection</p><h1>Shopping cart</h1>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!cart && !error && <div className="loading">Loading cart…</div>}
      {cart && !cart.items.length && (
        <div className="empty-state"><h2>Your cart is empty</h2><p>Add an available medicine to continue.</p><Link className="button" href="/">Browse medicines</Link></div>
      )}
      {cart && cart.items.length > 0 && (
        <>
          <div className="cart-list">
            {cart.items.map((item) => (
              <article key={item.id} className="cart-row">
                <div><h2>{item.medicine.brand_name}</h2><p>{item.medicine.strength} · {item.medicine.dosage_form.name}</p></div>
                <div className="quantity" aria-label={`Quantity for ${item.medicine.brand_name}`}>
                  <button onClick={() => update(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => update(item.id, item.quantity + 1)} disabled={item.quantity >= item.available_quantity}>+</button>
                </div>
                <strong>{money(item.line_total)}</strong>
                <button className="danger-link" onClick={() => remove(item.id)}>Remove</button>
              </article>
            ))}
          </div>
          <div className="cart-summary"><span>Estimated subtotal</span><strong>{money(cart.subtotal)}</strong><small>Final totals and stock are validated by the pharmacy.</small><Link className="button primary" href="/checkout">Continue to checkout</Link></div>
        </>
      )}
    </section>
  );
}
