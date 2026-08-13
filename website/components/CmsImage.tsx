"use client";

import Image from "next/image";
import { useState } from "react";

export function CmsImage({
  src,
  alt,
  className,
  priority = false
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    <Image
      className={className}
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 820px) 100vw, 58vw"
      onError={() => setFailed(true)}
    />
  );
}
