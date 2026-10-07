import Link from "next/link";
import { redirect } from "next/navigation";
import { formatLongDate } from "@/lib/constants";
import { getViewer, isStaff } from "@/lib/seating/store";
import { SignOutButton } from "@/components/seating/ClientAuth";

// A client's home: straight into their plan, or a list if they have several.
export default async function ClientAccountPage() {
  const access = await getViewer({ allowDevBypass: false });
  if (!access) redirect("/plano");
  if (isStaff(access.viewer)) redirect("/plantas");

  const { data: plans } = await access.db
    .from("seating_plans")
    .select("id, title, updated_at, date:data->>date")
    .eq("client_id", access.viewer.id!)
    .order("updated_at", { ascending: false });

  if (plans?.length === 1) redirect(`/plano/p/${plans[0].id}`);

  return (
    <div className="min-h-screen bg-canvas px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-medium tracking-[0.2em] text-gold uppercase">Organizza · Casamentos</div>
          <SignOutButton />
        </div>
        <h1 className="font-serif-display mt-3 text-3xl font-medium">Olá, {access.viewer.name}</h1>
        {!plans?.length ? (
          <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
            Ainda não há nenhum plano associado à sua conta. Fale com a equipa Organizza — assim que o criarem, aparece aqui.
          </p>
        ) : (
          <ul className="mt-6 space-y-2">
            {plans.map((p) => (
              <li key={p.id}>
                <Link href={`/plano/p/${p.id}`} className="block rounded-lg border border-border bg-surface px-5 py-4 hover:border-sage">
                  <div className="font-serif-display text-lg">{p.title}</div>
                  {p.date && <div className="text-[13px] text-ink-soft">{formatLongDate(p.date as string)}</div>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
