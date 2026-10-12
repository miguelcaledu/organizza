import { redirect } from "next/navigation";
import { getViewer, isStaff } from "@/lib/seating/store";
import { PlantasView, type ActivityRow, type PlanRow } from "./PlantasView";

export default async function PlantasPage() {
  const access = await getViewer();
  if (!access) redirect("/login");
  if (!isStaff(access.viewer)) redirect("/plano/conta");

  // plans left in the trash past their 30 days are removed here too, in case pg_cron isn't enabled
  await access.db.rpc("purge_deleted_seating_plans");

  const [{ data, error }, { count: trashCount }] = await Promise.all([
    access.db
      .from("seating_plans")
      .select("id, title, updated_at, view_token, date:data->>date, client:profiles!seating_plans_client_id_fkey(full_name, email)")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    access.db.from("seating_plans").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
  ]);

  const [{ data: pending }, { data: recent }] = await Promise.all([
    access.db.from("seating_plan_changes").select("plan_id").is("reviewed_at", null).limit(5000),
    access.db
      .from("seating_plan_changes")
      .select("id, plan_id, kind, summary, actor_name, created_at, reviewed_at")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);
  // ignore activity on plans that are in the trash
  const active = new Set((data ?? []).map((p) => p.id));
  const pendingByPlan: Record<string, number> = {};
  for (const r of pending ?? []) if (active.has(r.plan_id)) pendingByPlan[r.plan_id] = (pendingByPlan[r.plan_id] ?? 0) + 1;

  return (
    <PlantasView
      plans={(data ?? []) as unknown as PlanRow[]}
      pendingByPlan={pendingByPlan}
      recent={((recent ?? []) as ActivityRow[]).filter((r) => active.has(r.plan_id)).slice(0, 15)}
      trashCount={trashCount ?? 0}
      loadError={error ? error.message : null}
    />
  );
}
