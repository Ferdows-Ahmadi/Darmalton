"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const FALLBACK_IMAGE = "/api/assets/static/medicine-fallback.svg";

type MedicineMediaProps = Omit<ImageProps, "src" | "alt" | "onError"> & {
  imageUrl: string;
  alt: string;
};

export function MedicineMedia({
  imageUrl,
  alt,
  className,
  ...imageProps
}: MedicineMediaProps) {
  const [source, setSource] = useState(imageUrl || FALLBACK_IMAGE);

  useEffect(() => {
    setSource(imageUrl || FALLBACK_IMAGE);
  }, [imageUrl]);

  return (
    <Image
      {...imageProps}
      className={["media-product", className].filter(Boolean).join(" ")}
      src={source}
      alt={alt}
      unoptimized={source.endsWith(".svg")}
      onError={() => setSource(FALLBACK_IMAGE)}
    />
  );
}
