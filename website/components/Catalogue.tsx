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
    router.push(`/?${next}`);
  }

  function categoryChanged(value: string) {
    setCategory(value);
    const next = new URLSearchParams(params);
    if (value) next.set("category", value);
    else next.delete("category");
    next.delete("page");
    router.push(`/?${next}`);
  }

  return (
    <>
      <form className="catalogue-tools" onSubmit={apply} role="search">
        <label>
          <span>Search medicines</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Brand, generic name, or SKU"
          />
        </label>
        <label>
          <span>Category</span>
          <select value={category} onChange={(event) => categoryChanged(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>{category.name}</option>
            ))}
          </select>
        </label>
        <button type="submit">Search</button>
      </form>
      <p className="results-count">{medicines.count} medicine{medicines.count === 1 ? "" : "s"}</p>
      {medicines.results.length ? (
        <div className="medicine-grid">
          {medicines.results.map((medicine) => (
            <MedicineCard medicine={medicine} key={medicine.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No medicines found</h2>
          <p>Try a broader search or choose another category.</p>
        </div>
      )}
    </>
  );
}
