"use client";

import { useEffect } from "react";

import { State } from "@/components/StoreUI";

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="page-section">
      <State kind="error" title="generalError" body="connection" retry={reset} />
    </section>
  );
}
