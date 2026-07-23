"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderCard } from "@/components/OrderCard";
import { ApiError, apiFetch } from "@/lib/api";
import type { Order, PageResult } from "@/lib/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    apiFetch<PageResult<Order>>("orders/")
      .then((data) => setOrders(data.results))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) router.push("/login");
        else setError(err instanceof Error ? err.message : "Could not load orders.");
      });
  }, [router]);
  return (
    <section className="page-section narrow">
      <p className="eyebrow">Account</p><h1>Order history</h1>
      {error && <p className="form-error">{error}</p>}
      {!orders && !error && <div className="loading">Loading orders…</div>}
      {orders && !orders.length && <div className="empty-state"><h2>No orders yet</h2><p>Your completed checkouts will appear here.</p></div>}
      <div className="order-list">{orders?.map((order) => <OrderCard order={order} key={order.id} />)}</div>
    </section>
  );
}
