import { Catalogue } from "@/components/Catalogue";
import { publicApi } from "@/lib/server-api";
import type { Category, Medicine, PageResult } from "@/lib/types";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.page) query.set("page", params.page);

  let categories: Category[] = [];
  let medicines: PageResult<Medicine> = { count: 0, next: null, previous: null, results: [] };
  let unavailable = false;
  try {
    [categories, medicines] = await Promise.all([
      publicApi<Category[]>("categories/"),
      publicApi<PageResult<Medicine>>(`medicines/?${query}`)
    ]);
  } catch {
    unavailable = true;
  }

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow light">Trusted essentials, clearly presented</p>
          <h1>Everyday medicines.<br />Reliable local care.</h1>
          <p>Browse live catalogue data and complete a secure cash-on-delivery order.</p>
        </div>
        <div className="hero-note"><strong>Server-verified</strong><span>Price · stock · ownership</span></div>
      </section>
      <section className="page-section">
        <div className="section-heading">
          <div><p className="eyebrow">Catalogue</p><h2>Find what you need</h2></div>
          <p>Medicine information is for demonstration only. Consult a qualified professional.</p>
        </div>
        {unavailable ? (
          <div className="empty-state error-state"><h2>Catalogue unavailable</h2><p>Start the backend, then refresh this page.</p></div>
        ) : (
          <Catalogue categories={categories} medicines={medicines} />
        )}
      </section>
    </>
  );
}
