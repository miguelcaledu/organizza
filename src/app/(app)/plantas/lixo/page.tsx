import { redirect } from "next/navigation";
import { getViewer, isStaff } from "@/lib/seating/store";
import { TrashView, type TrashRow } from "./TrashView";

export default async function PlantasLixoPage() {
  const access = await getViewer();
  if (!access) redirect("/login");
  if (!isStaff(access.viewer)) redirect("/plano/conta");

  await access.db.rpc("purge_deleted_seating_plans");
  const { data, error } = await access.db
    .from("seating_plans")
    .select("id, title, deleted_at, date:data->>date, client:profiles!seating_plans_client_id_fkey(email), deleter:profiles!seating_plans_deleted_by_fkey(full_name)")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return <TrashView plans={(data ?? []) as unknown as TrashRow[]} loadError={error ? error.message : null} />;
}
