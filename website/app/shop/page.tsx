import { Catalogue } from "@/components/Catalogue";
import { publicApi } from "@/lib/server-api";
import type { Category, Medicine, PageResult } from "@/lib/types";

export const metadata = {
  title: "فروشگاه دارو و محصولات صحی"
};

export default async function ShopPage({
  searchParams
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.page) query.set("page", params.page);

  let categories: Category[] = [];
  let medicines: PageResult<Medicine> = {
    count: 0,
    next: null,
    previous: null,
    results: []
  };
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
      <section className="shop-intro">
        <div>
          <p className="eyebrow">فروشگاه درملتون</p>
          <h1>دارو و محصولات صحی مورد نیاز خود را پیدا کنید</h1>
          <p>
            جستجو برای همه باز است. قیمت و موجودی هنگام ثبت سفارش دوباره توسط
            سرور داروخانه تأیید می‌شود.
          </p>
        </div>
      </section>
      <section className="page-section shop-section">
        {unavailable ? (
          <div className="empty-state error-state">
            <h2>فهرست محصولات در دسترس نیست</h2>
            <p>ارتباط با سرور را بررسی و صفحه را تازه کنید.</p>
          </div>
        ) : (
          <Catalogue categories={categories} medicines={medicines} />
        )}
      </section>
    </>
  );
}
