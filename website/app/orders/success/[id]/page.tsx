import { redirect } from "next/navigation";

export default async function OrderSuccessPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  redirect(`/account/orders/${(await params).id}?placed=1`);
}
