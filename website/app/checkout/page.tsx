"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch, money } from "@/lib/api";
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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selected, setSelected] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const load = useCallback(async function load() {
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
      router.push("/login");
    }
  }, [router]);

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
      setError(err instanceof Error ? err.message : "آدرس ذخیره نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function placeOrder() {
    if (!selected || !cart?.items.length) return;
    if (
      !window.confirm(
        `سفارش پرداخت هنگام تحویل به مبلغ ${money(cart.subtotal)} ثبت شود؟`
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
      router.push(`/orders/${order.id}?placed=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "سفارش ثبت نشد.");
      setBusy(false);
    }
  }

  return (
    <section className="page-section narrow">
      <p className="eyebrow">پرداخت هنگام تحویل</p>
      <h1>ثبت سفارش</h1>
      <p className="muted">
        آدرس تحویل را انتخاب کنید. در این مرحله فقط پرداخت نقدی هنگام تحویل
        پشتیبانی می‌شود.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!showForm && (
        <>
          <h2 className="subheading">آدرس تحویل</h2>
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
                <strong>{address.label || "آدرس تحویل"}</strong>
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
              افزودن آدرس دیگر
            </button>
          </div>
        </>
      )}
      {showForm && (
        <form className="panel form-grid" onSubmit={createAddress}>
          <h2>آدرس تحویل جدید</h2>
          {Object.entries({
            recipient_name: "نام تحویل‌گیرنده",
            recipient_phone: "شماره تماس",
            province: "ولایت",
            city: "شهر",
            district: "ناحیه (اختیاری)",
            street_address: "آدرس دقیق",
            landmark: "نشانی نزدیک (اختیاری)"
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
                required={!label.includes("اختیاری")}
              />
            </label>
          ))}
          <button className="primary" disabled={busy}>
            ذخیره آدرس
          </button>
        </form>
      )}
      {!showForm && (
        <>
          <div className="panel checkout-summary">
            <h2>خلاصه سفارش</h2>
            <div>
              <span>قیمت محصولات</span>
              <strong>{money(cart?.subtotal ?? null)}</strong>
            </div>
            <div>
              <span>روش پرداخت</span>
              <strong>نقدی هنگام تحویل</strong>
            </div>
          </div>
          <button
            className="primary wide checkout-button"
            disabled={!selected || !cart?.items.length || busy}
            onClick={placeOrder}
          >
            {busy ? "در حال ثبت سفارش..." : "ثبت سفارش"}
          </button>
        </>
      )}
    </section>
  );
}
