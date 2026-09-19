"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useLocale } from "./LocaleProvider";
import { CmsActionLink } from "./CmsActionLink";
import type { PublicBanner } from "@/lib/types";

function localized(
  locale: "en" | "fa-AF" | "ps-AF",
  english: string,
  dari: string,
  pashto: string
) {
  if (locale === "en") return english;
  if (locale === "ps-AF") return pashto || dari || english;
  return dari || english;
}

export function HeroCarousel({ slides, imageSizes = "100vw" }: { slides: PublicBanner[]; imageSizes?: string }) {
  const { locale, t } = useLocale();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const count = Math.max(slides.length, 1);
  const activeIndex = active < slides.length ? active : 0;

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      7000
    );
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const go = (index: number) => setActive((index + count) % count);
  const current = slides[activeIndex];
  const title = current
    ? localized(locale, current.title, current.title_dari, current.title_pashto)
    : t("heroTitle");
  const body = current
    ? localized(locale, current.body, current.body_dari, current.body_pashto)
    : t("heroBody");
  const alt = current
    ? localized(locale, current.alt_text, current.alt_text_dari, current.alt_text_pashto)
    : "";
  const actionLabel = current
    ? localized(
        locale,
        current.action_label,
        current.action_label_dari,
        current.action_label_pashto
      )
    : "";

  return (
    <section
      className={`hero-carousel hero-align-${current?.text_alignment?.toLowerCase() || "start"} hero-overlay-${current?.overlay_style?.toLowerCase() || "light"}`}
      aria-roledescription="carousel"
      aria-label={t("heroKicker")}
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(activeIndex - 1);
        if (event.key === "ArrowRight") go(activeIndex + 1);
      }}
      onPointerDown={(event) => {
        pointerStart.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (pointerStart.current === null) return;
        const distance = event.clientX - pointerStart.current;
        if (Math.abs(distance) > 45) go(activeIndex + (distance < 0 ? 1 : -1));
        pointerStart.current = null;
      }}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
    >
      <div className="hero-carousel-media" aria-hidden={!alt}>
        {current?.mobile_image_url && (
          <Image
            className="hero-mobile-image"
            src={current.mobile_image_url}
            alt={alt}
            fill
            priority
            sizes={imageSizes}
          />
        )}
        <Image
          className="hero-desktop-image"
          src={current?.image_url || "/campaigns/health-delivered.webp"}
          alt={alt}
          fill
          priority
          sizes={imageSizes}
        />
      </div>
      <div className="hero-carousel-shade" aria-hidden="true" />
      <div className="wrap hero-carousel-content">
        <div className="hero-carousel-copy" aria-live="polite">
          <p className="eyebrow">{t("heroKicker")}</p>
          <h1>{title}</h1>
          {body && <p>{body}</p>}
          {current ? (
            current.action_url && actionLabel ? (
              <CmsActionLink href={current.action_url} label={actionLabel} />
            ) : null
          ) : (
            <CmsActionLink href="/shop" label={t("shop")} />
          )}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="hero-carousel-controls">
          <button
            type="button"
            className="carousel-arrow carousel-arrow-previous"
            aria-label={t("previous")}
            onClick={() => go(activeIndex - 1)}
          >
            {locale === "en" ? "‹" : "›"}
          </button>
          <div className="carousel-dots">
            {slides.map((slide, index) => (
              <button
                type="button"
                key={slide.id}
                aria-label={`${index + 1} / ${slides.length}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => go(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="carousel-arrow carousel-arrow-next"
            aria-label={t("next")}
            onClick={() => go(activeIndex + 1)}
          >
            {locale === "en" ? "›" : "‹"}
          </button>
        </div>
      )}
    </section>
  );
}
