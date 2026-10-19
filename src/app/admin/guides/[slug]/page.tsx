import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminEditGuidePage({ params }: Props) {
  const { slug } = await params;
  redirect(`/admin/guides/${slug}/edit`);
}
