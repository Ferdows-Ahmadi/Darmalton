"use client";

import Link from "next/link";
import { useLocale } from "./LocaleProvider";
import { formatMoney } from "@/lib/locale";
import { orderStatus } from "@/lib/status";
import type { Order } from "@/lib/types";

export function OrderCard({ order }: { order: Order }) {
  const { locale, t } = useLocale();
  return (
    <Link className="order-card" href={`/account/orders/${order.id}`}>
      <div>
        <span className="eyebrow" dir="ltr">
          {order.order_number}
        </span>
        <h2>{orderStatus(order.status, locale)}</h2>
        <p>
          {new Date(order.placed_at).toLocaleString(locale, {
            dateStyle: "medium",
            timeStyle: "short"
          })}
        </p>
      </div>
      <div>
        <strong>{formatMoney(order.grand_total, locale)}</strong>
        <span>{order.items.length.toLocaleString(locale)} {t("results")}</span>
      </div>
    </Link>
  );
}
