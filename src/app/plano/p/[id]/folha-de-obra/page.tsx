import { notFound, redirect } from "next/navigation";
import { WorkSheet } from "@/components/seating/WorkSheet";
import { getViewer, isStaff, loadPlan } from "@/lib/seating/store";

export const metadata = { title: "Folha de obra — Organizza" };

// Staff only: the automatic material count for the warehouse / set-up team.
export default async function WorkSheetPage({ params }: PageProps<"/plano/p/[id]/folha-de-obra">) {
  const { id } = await params;
  const access = await getViewer();
  if (!access) redirect(`/plano?next=${encodeURIComponent(`/plano/p/${id}/folha-de-obra`)}`);
  if (!isStaff(access.viewer)) redirect(`/plano/p/${id}`);
  const loaded = await loadPlan(access.db, id);
  if (!loaded) notFound();
  return <WorkSheet plan={loaded.plan} planId={id} />;
}
