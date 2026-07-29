"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Category, Medicine, PageResult } from "@/lib/types";
import { MedicineCard } from "./MedicineCard";

export function Catalogue({
  categories,
  medicines
}: {
  categories: Category[];
  medicines: PageResult<Medicine>;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "");

  useEffect(() => {
    setCategory(params.get("category") || "");
  }, [params]);

  function apply(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (search.trim()) next.set("search", search.trim());
    if (category) next.set("category", category);
    router.push(`/shop?${next}`);
  }

  function categoryChanged(value: string) {
    setCategory(value);
    const next = new URLSearchParams(params);
    if (value) next.set("category", value);
    else next.delete("category");
    next.delete("page");
    router.push(`/shop?${next}`);
  }

  return (
    <>
      <form className="catalogue-tools" onSubmit={apply} role="search">
        <label>
          <span>جستجوی دوا و محصول</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="نام دوا، نام علمی یا کُد محصول..."
          />
        </label>
        <label>
          <span>دسته‌بندی</span>
          <select
            value={category}
            onChange={(event) => categoryChanged(event.target.value)}
          >
            <option value="">همه دسته‌ها</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name_dari || item.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">جستجو</button>
      </form>
      <p className="results-count">
        <strong>{medicines.count.toLocaleString("fa-AF")}</strong> محصول پیدا شد
      </p>
      {medicines.results.length ? (
        <div className="medicine-grid">
          {medicines.results.map((medicine) => (
            <MedicineCard medicine={medicine} key={medicine.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>محصولی پیدا نشد</h2>
          <p>عبارت کوتاه‌تری بنویسید یا دسته دیگری را انتخاب کنید.</p>
        </div>
      )}
    </>
  );
}
