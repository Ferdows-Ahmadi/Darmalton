"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import type { CartItem } from "@/lib/types";

export function AddToCart({
  medicineId,
  disabled
}: {
  medicineId: string;
  disabled: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function add() {
    setBusy(true);
    setMessage("");
    try {
      await apiFetch<CartItem>("cart/items/", {
        method: "POST",
        body: JSON.stringify({ medicine_id: medicineId, quantity: 1 })
      });
      router.push("/cart");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) router.push("/login");
      else setMessage(error instanceof Error ? error.message : "Could not add this medicine.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="primary wide" onClick={add} disabled={disabled || busy}>
        {busy ? "Adding…" : disabled ? "Out of stock" : "Add to cart"}
      </button>
      {message && <p className="form-error" role="alert">{message}</p>}
    </div>
  );
}
