"use client";

import { apiFetch } from "@/lib/api";
import type { Cart, Medicine } from "@/lib/types";

const storageKey = "darmalton_guest_cart_v1";

type GuestCartEntry = {
  medicine: Medicine;
  quantity: number;
};

function loadEntries(): GuestCartEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return [];
    const parsed = JSON.parse(value) as GuestCartEntry[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (entry) =>
            entry?.medicine?.id &&
            Number.isInteger(entry.quantity) &&
            entry.quantity > 0
        )
      : [];
  } catch {
    window.localStorage.removeItem(storageKey);
    return [];
  }
}

function saveEntries(entries: GuestCartEntry[]) {
  if (typeof window === "undefined") return;
  if (!entries.length) {
    window.localStorage.removeItem(storageKey);
    return;
  }
  window.localStorage.setItem(storageKey, JSON.stringify(entries));
}

export function addGuestCartItem(medicine: Medicine, quantity = 1) {
  const entries = loadEntries();
  const current = entries.find((entry) => entry.medicine.id === medicine.id);
  if (current) {
    current.quantity = Math.min(
      current.quantity + quantity,
      medicine.available_quantity
    );
  } else {
    entries.push({ medicine, quantity });
  }
  saveEntries(entries);
}

export function updateGuestCartItem(medicineId: string, quantity: number) {
  const entries = loadEntries();
  const current = entries.find(
    (entry) => entry.medicine.id === medicineId
  );
  if (!current) return;
  current.quantity = Math.max(
    1,
    Math.min(quantity, current.medicine.available_quantity)
  );
  saveEntries(entries);
}

export function removeGuestCartItem(medicineId: string) {
  saveEntries(
    loadEntries().filter((entry) => entry.medicine.id !== medicineId)
  );
}

export function guestCart(): Cart {
  const entries = loadEntries();
  const items = entries.map(({ medicine, quantity }) => {
    const unitPrice = Number(medicine.price || 0);
    return {
      id: `guest:${medicine.id}`,
      medicine,
      quantity,
      unit_price: medicine.price,
      line_total: (unitPrice * quantity).toFixed(2),
      available_quantity: medicine.available_quantity
    };
  });
  return {
    id: "guest",
    branch_id: "guest",
    items,
    item_count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items
      .reduce((total, item) => total + Number(item.line_total || 0), 0)
      .toFixed(2)
  };
}

export async function synchronizeGuestCart() {
  const pendingEntries = loadEntries();
  while (pendingEntries.length) {
    const entry = pendingEntries[0];
    await apiFetch("cart/items/", {
      method: "POST",
      body: JSON.stringify({
        medicine_id: entry.medicine.id,
        quantity: entry.quantity
      })
    });
    pendingEntries.shift();
    saveEntries(pendingEntries);
  }
}
