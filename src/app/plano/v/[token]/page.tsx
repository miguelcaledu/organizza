import { notFound } from "next/navigation";
import { PlanEditor } from "@/components/seating/PlanEditor";
import { loadByViewToken } from "@/lib/seating/store";

// Read-only link for the venue / caterer / planner — no account needed.
export default async function ViewPlanPage({ params }: PageProps<"/plano/v/[token]">) {
  const { token } = await params;
  const stored = await loadByViewToken(token);
  if (!stored) notFound();
  return <PlanEditor initial={stored.plan} viewToken={stored.viewToken} readOnly />;
}
