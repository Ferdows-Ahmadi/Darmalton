import Link from "next/link";

export function CmsActionLink({
  href,
  label,
  className = "button"
}: {
  href: string;
  label: string;
  className?: string;
}) {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a className={className} href={href} rel="noreferrer">
        {label}
      </a>
    );
  }
  return (
    <Link className={className} href={href}>
      {label}
    </Link>
  );
}
