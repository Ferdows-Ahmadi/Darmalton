import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CmsInfoPage } from "@/components/CmsInfoPage";
import { publicContentPage } from "@/lib/public-cms";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const page = await publicContentPage((await params).slug);
  return { title: page?.title_dari || page?.title || "معلومات درملتون" };
}

export default async function PublicCmsPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const page = await publicContentPage((await params).slug);
  if (!page) notFound();
  return <CmsInfoPage page={page} eyebrow="معلومات درملتون" />;
}
