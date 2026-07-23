import Link from "next/link";
import { money, readableStatus } from "@/lib/api";
import type { Order } from "@/lib/types";

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link className="order-card" href={`/orders/${order.id}`}>
      <div><span className="eyebrow">{order.order_number}</span><h2>{readableStatus(order.status)}</h2><p>{new Date(order.placed_at).toLocaleString()}</p></div>
      <div><strong>{money(order.grand_total, order.currency_code)}</strong><span>{order.items.length} line item{order.items.length === 1 ? "" : "s"}</span></div>
    </Link>
  );
}
