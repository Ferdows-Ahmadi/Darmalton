"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ApiError, apiFetch, money, readableStatus } from "@/lib/api";
import type { Order } from "@/lib/types";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const query = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async function load() {
    try { setOrder(await apiFetch<Order>(`orders/${id}/`)); }
    catch (err) {
      if (err instanceof ApiError && err.status === 401) router.push("/login");
      else setError(err instanceof Error ? err.message : "Could not load this order.");
    }
  }, [id, router]);
  useEffect(() => { void load(); }, [load]);
  if (error) return <section className="page-section narrow"><div className="empty-state error-state"><h1>Order unavailable</h1><p>{error}</p></div></section>;
  if (!order) return <section className="page-section narrow"><div className="loading">Loading order…</div></section>;
  return (
    <section className="page-section narrow">
      {query.get("placed") && <div className="success-banner"><strong>Order placed successfully.</strong> The pharmacy can now review it.</div>}
      <div className="order-title"><div><p className="eyebrow">{order.order_number}</p><h1>{readableStatus(order.status)}</h1><p>Placed {new Date(order.placed_at).toLocaleString()}</p></div><button className="secondary" onClick={load}>Refresh status</button></div>
      <div className="status-timeline">
        {order.status_history.map((item) => <div key={item.id}><span /><p><strong>{readableStatus(item.to_status)}</strong><small>{new Date(item.created_at).toLocaleString()} {item.note && `· ${item.note}`}</small></p></div>)}
      </div>
      <div className="panel">
        <h2>Order items</h2>
        {order.items.map((item) => <div className="summary-row" key={item.id}><span>{item.quantity} × {item.medicine_name} {item.strength}</span><strong>{money(item.line_total)}</strong></div>)}
        <div className="summary-row total"><span>Total · cash on delivery</span><strong>{money(order.grand_total, order.currency_code)}</strong></div>
      </div>
      <div className="panel"><h2>Delivery address</h2><p>{order.delivery_address.recipient_name} · {order.delivery_address.recipient_phone}</p><p>{order.delivery_address.street_address}, {order.delivery_address.city}, {order.delivery_address.province}</p></div>
    </section>
  );
}
