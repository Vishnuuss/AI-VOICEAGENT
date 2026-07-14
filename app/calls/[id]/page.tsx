import { CallDetail } from "@/components/call-detail"

export const metadata = {
  title: "Call Detail — VaaniOS",
}

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CallDetail id={id} />
}
