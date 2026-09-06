import { AddressEditor } from "@/components/AddressEditor";

export default async function EditAddressPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  return <AddressEditor id={(await params).id} />;
}
