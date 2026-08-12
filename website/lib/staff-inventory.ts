export const inventoryQualityStatuses = ["PENDING", "APPROVED", "QUARANTINED", "REJECTED"] as const;
export const inventoryAdjustmentTypes = ["DAMAGE", "EXPIRY", "ADJUSTMENT"] as const;

export function inventoryActionPayload(action: string, form: Record<string, string>) {
  if (action === "inspect") return { decision: form.decision, notes: form.notes };
  if (action === "verify") return { physical_quantity: Number(form.physical_quantity), notes: form.notes };
  return { transaction_type: form.transaction_type, direction: form.direction, quantity: Number(form.quantity), reference: form.reference, notes: form.notes };
}

export function inventoryStatusLabel(value: string) {
  return ({ PENDING: "منتظر بازرسی", APPROVED: "تأییدشده", QUARANTINED: "قرنطین", REJECTED: "ردشده", DAMAGE: "آسیب", EXPIRY: "انقضا", ADJUSTMENT: "اصلاح", STOCK_VERIFICATION: "شمارش فیزیکی", PURCHASE: "خرید", SALE: "فروش", CUSTOMER_RETURN: "مرجوعی مشتری", ADDITION: "افزایش", DEDUCTION: "کاهش", NONE: "بدون تغییر" } as Record<string,string>)[value] || value.replaceAll("_", " ");
}
