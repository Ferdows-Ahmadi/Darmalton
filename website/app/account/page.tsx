"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { loginPath } from "@/lib/auth-navigation";
import type { Address, Order, PageResult, User } from "@/lib/types";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [addressCount, setAddressCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      apiFetch<User>("auth/me/"),
      apiFetch<PageResult<Address>>("addresses/"),
      apiFetch<PageResult<Order>>("orders/")
    ])
      .then(([currentUser, addresses, orders]) => {
        setUser(currentUser);
        setAddressCount(addresses.count);
        setOrderCount(orders.count);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push(loginPath("/account"));
        }
      });
  }, [router]);

  const name = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || "مشتری"
    : "";

  return (
    <section className="page-section narrow">
      <p className="eyebrow">پروفایل مشتری</p>
      <h1>حساب کاربری</h1>
      {!user ? (
        <div className="loading">در حال بارگذاری پروفایل...</div>
      ) : (
        <>
          <div className="panel profile-card">
            <span className="avatar">
              {(user.first_name[0] || user.email[0]).toUpperCase()}
            </span>
            <div>
              <h2>{name}</h2>
              <p dir="ltr">{user.email}</p>
              <p dir="ltr">{user.phone || "شماره تماس ثبت نشده"}</p>
            </div>
          </div>
          <div className="account-stats">
            <Link href="/orders">
              <strong>{orderCount.toLocaleString("fa-AF")}</strong>
              <span>سفارش من</span>
            </Link>
            <div>
              <strong>{addressCount.toLocaleString("fa-AF")}</strong>
              <span>آدرس ذخیره‌شده</span>
            </div>
            <div>
              <strong>—</strong>
              <span>کیف پول؛ به‌زودی</span>
            </div>
          </div>
          <div className="profile-menu">
            <Link href="/orders">
              <span>سفارش‌های من</span>
              <b aria-hidden="true">‹</b>
            </Link>
            <Link href="/cart">
              <span>سبد خرید</span>
              <b aria-hidden="true">‹</b>
            </Link>
            <Link href="/prescriptions">
              <span>نسخه‌های من</span>
              <b aria-hidden="true">‹</b>
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
