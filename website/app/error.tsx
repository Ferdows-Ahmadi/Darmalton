"use client";

import { useEffect } from "react";

import { ApplicationState } from "@/components/ApplicationState";

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
    <ApplicationState title="generalError" body="connection" retry={reset} />
  );
}
