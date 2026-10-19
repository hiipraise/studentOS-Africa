import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminEditOpportunityPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/admin/opportunities/${slug}/edit`);
}
