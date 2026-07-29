import Link from "next/link";

export function InfoPage({
  eyebrow,
  title,
  intro,
  children
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section className="info-page">
      <div className="info-page-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      <article className="info-document">{children}</article>
      <Link className="button secondary" href="/">
        بازگشت به خانه
      </Link>
    </section>
  );
}
