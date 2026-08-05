import { notFound } from "next/navigation";

import { StaffCmsManager } from "@/components/staff/StaffCmsManager";
import { isCmsResource } from "@/lib/staff-cms";

export default async function StaffCmsResourcePage({
  params
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
  if (!isCmsResource(resource)) notFound();
  return <StaffCmsManager resource={resource} />;
}
