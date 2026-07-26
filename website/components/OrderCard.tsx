import Link from "next/link";
import { money, readableStatus } from "@/lib/api";
import type { Order } from "@/lib/types";

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link className="order-card" href={`/orders/${order.id}`}>
      <div>
        <span className="eyebrow" dir="ltr">
          {order.order_number}
        </span>
        <h2>{readableStatus(order.status)}</h2>
        <p>
          {new Date(order.placed_at).toLocaleString("fa-AF", {
            dateStyle: "medium",
            timeStyle: "short"
          })}
        </p>
      </div>
      <div>
        <strong>{money(order.grand_total, order.currency_code)}</strong>
        <span>{order.items.length.toLocaleString("fa-AF")} قلم محصول</span>
      </div>
    </Link>
  );
}
