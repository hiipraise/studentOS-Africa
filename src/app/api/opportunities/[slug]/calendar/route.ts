import { getOpportunityBySlug } from "@/lib/data/opportunities";
import { buildIcs, icsResponse } from "@/lib/ics";
import { appUrl } from "@/lib/tokens";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const opportunity = await getOpportunityBySlug(slug);
  if (!opportunity) return new Response("Not found", { status: 404 });
  const deadline = opportunity.cycle?.closesAt ?? opportunity.deadline;
  if (!deadline) return new Response("This opportunity has no fixed deadline.", { status: 404 });
  const ics = buildIcs(
    [
      {
        uid: `opportunity-${opportunity.slug}`,
        title: `Deadline: ${opportunity.title}`,
        description: opportunity.description.slice(0, 300),
        url: appUrl(`/go/${opportunity.slug}`),
        date: new Date(deadline),
      },
    ],
    opportunity.title
  );
  return icsResponse(ics, `${opportunity.slug}-deadline`);
}
