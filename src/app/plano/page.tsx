import { redirect } from "next/navigation";
import { ClientLoginForm } from "@/components/seating/ClientAuth";
import { getViewer, isStaff } from "@/lib/seating/store";

const STEPS = [
  ["Desenhe a sala", "Medidas em metros, formas em L ou personalizadas, portas e entradas."],
  ["Disponha as mesas", "Arraste mesas, pista de dança, bar, buffet e DJ — tudo à escala real."],
  ["Sente os convidados", "Adicione nomes e coloque cada pessoa num lugar concreto."],
  ["Partilhe e imprima", "Um link só de leitura para a quinta ou wedding planner, e PDF para imprimir."],
];

export default async function PlanoLandingPage({ searchParams }: PageProps<"/plano">) {
  const { next } = await searchParams;
  // a real session only — the dev auth bypass must not hide the client login
  const access = await getViewer({ allowDevBypass: false });
  if (access) redirect(isStaff(access.viewer) ? "/plantas" : "/plano/conta");

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12 md:flex-row md:items-start md:gap-16 md:px-8 md:py-20">
        <div className="flex-1">
          <div className="text-[11px] font-medium tracking-[0.2em] text-gold uppercase">Organizza · Casamentos</div>
          <h1 className="font-serif-display mt-3 text-[40px] leading-[1.1] font-medium md:text-[52px]">
            A planta da sala e os lugares,<br />
            <span className="text-sage italic">sem complicações.</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
            Desenhem a sala do copo-d&apos;água e decidam quem se senta onde. Não é preciso experiência de design — e o progresso fica guardado automaticamente. Entrem com a conta que a equipa Organizza vos enviou por email.
          </p>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="flex gap-3">
                <span className="font-serif-display flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold text-[13px] text-gold">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-medium">{title}</div>
                  <div className="mt-0.5 text-[13px] leading-snug text-ink-soft">{body}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <ClientLoginForm next={typeof next === "string" ? next : null} />
      </div>
    </div>
  );
}
