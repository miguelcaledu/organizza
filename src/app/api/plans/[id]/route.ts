import { NextResponse, type NextRequest } from "next/server";
import { applyClientEdits, diffClientChanges } from "@/lib/seating/clientEdits";
import { getViewer, isPlanId, isStaff, loadPlan, savePlan } from "@/lib/seating/store";
import { sanitizePlan } from "@/lib/seating/validate";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 2_000_000;

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/plans/[id]">) {
  const { id } = await ctx.params;
  if (!isPlanId(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const access = await getViewer();
  if (!access) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await request.text();
  if (body.length > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  try {
    const incoming = sanitizePlan(parsed);
    if (isStaff(access.viewer)) {
      // staff edit everything; RLS still has the last word
      const updatedAt = await savePlan(access.db, id, incoming);
      if (!updatedAt) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      return NextResponse.json({ updatedAt });
    }

    // Client: RLS only lets them *read* their own plan, so this load doubles as
    // the ownership check. Only guests + seat counts are taken from their copy,
    // and every difference is logged for staff before it's written.
    const stored = await loadPlan(access.db, id);
    if (!stored) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const next = applyClientEdits(stored.plan, incoming);
    const changes = diffClientChanges(stored.plan, next);
    if (!changes.length) return NextResponse.json({ updatedAt: stored.updatedAt });

    const admin = createAdminClient();
    const updatedAt = await savePlan(admin, id, next);
    if (!updatedAt) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const { error } = await admin
      .from("seating_plan_changes")
      .insert(changes.map((c) => ({ ...c, plan_id: id, actor_id: access.viewer.id, actor_name: access.viewer.name })));
    if (error) console.error("seating change log insert failed", error);
    return NextResponse.json({ updatedAt });
  } catch (e) {
    console.error("seating plan save failed", e);
    return NextResponse.json({ error: "store_unavailable" }, { status: 503 });
  }
}
