import Link from "next/link";

export default function NotFound() {
  return <section className="page-section narrow"><div className="empty-state"><h1>Page not found</h1><p>The requested medicine or page does not exist.</p><Link className="button" href="/">Return to catalogue</Link></div></section>;
}
