import { PrescriptionDetail } from "@/components/PrescriptionDetail";

export default async function PrescriptionDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  return <PrescriptionDetail id={(await params).id} />;
}
