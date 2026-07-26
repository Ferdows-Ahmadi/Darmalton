import { Catalogue } from "@/components/Catalogue";
import { publicApi } from "@/lib/server-api";
import type { Category, Medicine, PageResult } from "@/lib/types";

export default async function Home({
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
      <section className="hero">
        <div className="hero-copy">
          <span className="promo-pill">خدمات داروخانه‌ای قابل اعتماد</span>
          <h1>
            سلامتی شما،
            <br />
            اولویت ماست.
          </h1>
          <p>
            دوا و محصولات صحی مورد نیاز خود را با قیمت و موجودی واقعی انتخاب
            کنید و در خانه تحویل بگیرید.
          </p>
          <a className="button hero-button" href="#catalogue">
            مشاهده محصولات
          </a>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="medicine-bag">+</div>
          <span className="hero-orbit orbit-one">✦</span>
          <span className="hero-orbit orbit-two">●</span>
        </div>
      </section>
      <section className="trust-strip" aria-label="خدمات درملتون">
        <div>
          <span>✓</span>
          <strong>محصولات اصل</strong>
          <small>تضمین کیفیت</small>
        </div>
        <div>
          <span>⌁</span>
          <strong>تحویل سریع</strong>
          <small>در شهر کابل</small>
        </div>
        <div>
          <span>▣</span>
          <strong>پرداخت امن</strong>
          <small>پرداخت هنگام تحویل</small>
        </div>
        <div>
          <span>☎</span>
          <strong>پشتیبانی</strong>
          <small>همراه شما</small>
        </div>
      </section>
      <section className="page-section" id="catalogue">
        <div className="section-heading">
          <div>
            <p className="eyebrow">فروشگاه درملتون</p>
            <h2>محصول مورد نیاز خود را پیدا کنید</h2>
          </div>
          <p>
            معلومات دوا برای آگاهی عمومی است. برای مصرف، با داکتر یا فارمسست
            مشورت کنید.
          </p>
        </div>
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
