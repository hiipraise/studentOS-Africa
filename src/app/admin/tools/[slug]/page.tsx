import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminEditToolPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/admin/tools/${slug}/edit`);
}
