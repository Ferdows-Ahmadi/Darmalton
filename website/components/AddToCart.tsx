"use client";

import { useLocale } from "./LocaleProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { addGuestCartItem } from "@/lib/guest-cart";
import { checkoutError } from "@/lib/checkout-feedback";
import type { CartItem, Medicine } from "@/lib/types";

export function AddToCart({
  medicine,
  disabled,
  prescriptionRequired = false
}: {
  medicine: Medicine;
  disabled: boolean;
  prescriptionRequired?: boolean;
  localizedFeedback?: boolean;
}) {
  const {t,locale}=useLocale();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function add() {
    if (prescriptionRequired) {
      router.push(`/prescriptions/upload?medicineId=${encodeURIComponent(medicine.id)}`);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await apiFetch<CartItem>("cart/items/", {
        method: "POST",
        body: JSON.stringify({ medicine_id: medicine.id, quantity: 1 })
      });
      router.push("/cart");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        addGuestCartItem(medicine);
        router.push("/cart");
      } else {
        setMessage(
          checkoutError(error, locale, t("connection"))
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        className="primary wide"
        onClick={add}
        disabled={disabled || busy}
      >
        {busy
          ? t("adding")
          : disabled
            ? t("outOfStock")
            : prescriptionRequired
              ? t("rx")
              : t("add")}
      </button>
      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
