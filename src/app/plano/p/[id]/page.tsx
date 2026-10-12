import { notFound, redirect } from "next/navigation";
import { PlanEditor } from "@/components/seating/PlanEditor";
import type { PlanChange } from "@/lib/seating/clientEdits";
import { getViewer, isStaff, loadPlan } from "@/lib/seating/store";

export default async function PlanPage({ params }: PageProps<"/plano/p/[id]">) {
  const { id } = await params;
  const access = await getViewer();
  if (!access) redirect(`/plano?next=${encodeURIComponent(`/plano/p/${id}`)}`);
  const loaded = await loadPlan(access.db, id);
  // RLS hides other couples' plans, so "not yours" and "doesn't exist" look the same
  if (!loaded) notFound();

  const staff = isStaff(access.viewer);
  const { data: changes } = staff
    ? await access.db.from("seating_plan_changes").select("*").eq("plan_id", id).order("created_at", { ascending: false }).limit(300)
    : { data: null };

  return (
    <PlanEditor
      initial={loaded.plan}
      planId={loaded.id}
      viewToken={loaded.viewToken}
      viewer={{ name: access.viewer.name, email: access.viewer.email, staff }}
      changes={(changes ?? undefined) as PlanChange[] | undefined}
    />
  );
}
