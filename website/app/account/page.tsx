"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  useEffect(() => {
    apiFetch<User>("auth/me/").then(setUser).catch((err) => {
      if (err instanceof ApiError && err.status === 401) router.push("/login");
    });
  }, [router]);
  return (
    <section className="page-section narrow">
      <p className="eyebrow">Customer profile</p><h1>Account</h1>
      {!user ? <div className="loading">Loading profile…</div> : (
        <div className="panel profile-card"><span className="avatar">{(user.first_name[0] || user.email[0]).toUpperCase()}</span><div><h2>{[user.first_name, user.last_name].filter(Boolean).join(" ") || "Customer"}</h2><p>{user.email}</p><p>{user.phone || "No phone number saved"}</p></div></div>
      )}
    </section>
  );
}
