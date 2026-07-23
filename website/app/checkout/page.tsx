"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { Address, Order } from "@/lib/types";

const emptyAddress = {
  label: "Home",
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
  const [selected, setSelected] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const load = useCallback(async function load() {
    try {
      const list = await apiFetch<Address[]>("addresses/");
      setAddresses(list);
      setSelected(list.find((item) => item.is_default)?.id || list[0]?.id || "");
      setShowForm(!list.length);
    } catch {
      router.push("/login");
    }
  }, [router]);
  useEffect(() => { void load(); }, [load]);

  async function createAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
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
      setError(err instanceof Error ? err.message : "Could not save the address.");
    } finally { setBusy(false); }
  }

  async function placeOrder() {
    if (!selected) return;
    setBusy(true); setError("");
    try {
      const order = await apiFetch<Order>("orders/", {
        method: "POST",
        body: JSON.stringify({ address_id: selected })
      });
      router.push(`/orders/${order.id}?placed=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setBusy(false);
    }
  }

  return (
    <section className="page-section narrow">
      <p className="eyebrow">Cash on delivery</p><h1>Checkout</h1>
      <p className="muted">Choose where the pharmacy should deliver your order.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!showForm && (
        <div className="address-grid">
          {addresses.map((address) => (
            <label className={`address-card ${selected === address.id ? "selected" : ""}`} key={address.id}>
              <input type="radio" name="address" value={address.id} checked={selected === address.id} onChange={() => setSelected(address.id)} />
              <strong>{address.label || "Delivery address"}</strong>
              <span>{address.recipient_name} · {address.recipient_phone}</span>
              <span>{address.street_address}, {address.city}, {address.province}</span>
            </label>
          ))}
          <button className="secondary" onClick={() => setShowForm(true)}>Add another address</button>
        </div>
      )}
      {showForm && (
        <form className="panel form-grid" onSubmit={createAddress}>
          <h2>New delivery address</h2>
          {Object.entries({
            recipient_name: "Recipient name",
            recipient_phone: "Phone",
            province: "Province",
            city: "City",
            district: "District (optional)",
            street_address: "Street address",
            landmark: "Landmark (optional)"
          }).map(([name, label]) => (
            <label key={name} className={name === "street_address" || name === "landmark" ? "full" : ""}>
              <span>{label}</span><input name={name} required={!label.includes("optional")} />
            </label>
          ))}
          <button className="primary" disabled={busy}>Save address</button>
        </form>
      )}
      {!showForm && <button className="primary wide checkout-button" disabled={!selected || busy} onClick={placeOrder}>{busy ? "Placing order…" : "Place cash-on-delivery order"}</button>}
    </section>
  );
}
