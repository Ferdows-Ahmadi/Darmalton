"use client";

import Link from "next/link";
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
        else setError(err instanceof Error ? err.message : "سفارش‌ها بار نشد.");
      });
  }, [router]);

  return (
    <section className="page-section narrow">
      <p className="eyebrow">حساب کاربری</p>
      <h1>سفارش‌های من</h1>
      {error && <p className="form-error">{error}</p>}
      {!orders && !error && (
        <div className="loading">در حال بارگذاری سفارش‌ها...</div>
      )}
      {orders && !orders.length && (
        <div className="empty-state">
          <h2>هنوز سفارشی ندارید</h2>
          <p>سفارش‌های ثبت‌شده شما در این بخش نمایش داده می‌شود.</p>
          <Link className="button" href="/">
            مشاهده محصولات
          </Link>
        </div>
      )}
      <div className="order-list">
        {orders?.map((order) => (
          <OrderCard order={order} key={order.id} />
        ))}
      </div>
    </section>
  );
}
