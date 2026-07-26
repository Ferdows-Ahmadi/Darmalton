import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-section narrow">
      <div className="empty-state">
        <h1>صفحه پیدا نشد</h1>
        <p>محصول یا صفحه درخواستی وجود ندارد.</p>
        <Link className="button" href="/">
          بازگشت به فروشگاه
        </Link>
      </div>
    </section>
  );
}
