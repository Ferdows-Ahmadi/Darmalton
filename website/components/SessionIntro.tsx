"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function SessionIntro() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || sessionStorage.getItem("darmalton-intro-seen")) return;
    sessionStorage.setItem("darmalton-intro-seen", "1");
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 600);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return (
    <div className="session-intro" aria-hidden="true">
      <Image
        src="/brand/android-icon.png"
        alt=""
        width={160}
        height={160}
        priority
      />
    </div>
  );
}
