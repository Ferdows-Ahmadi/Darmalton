import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CmsInfoPage } from "@/components/CmsInfoPage";
import { publicContentPage } from "@/lib/public-cms";
import { serverLocale } from "@/lib/server-locale";
import { textFor } from "@/lib/locale";
import { cmsText } from "@/lib/cms-locale";
import styles from "@/components/HealthContent.module.css";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const page = await publicContentPage((await params).slug);
  const locale = await serverLocale();
  return { title: page ? cmsText(page.title, page.title_dari, locale) : textFor(locale, "cmsContext") };
}

export default async function PublicCmsPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const page = await publicContentPage((await params).slug);
  if (!page) notFound();
  const locale = await serverLocale();
  return <CmsInfoPage utility className={locale === "fa-AF" ? styles.cmsDocument : undefined} page={page} locale={locale} eyebrow={textFor(locale, "cmsContext")} />;
}
