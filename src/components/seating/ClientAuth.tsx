"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Couple-facing auth for the seating planner. Accounts are created by staff
// (invite email); couples set their password from that email and then sign in
// here with email + password.

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const fieldCls = "w-full rounded-md border border-border px-3 py-2.5 text-sm outline-none focus:border-sage max-md:text-base";

function safeNext(next: string | null) {
  return next && next.startsWith("/plano/") && !next.startsWith("//") ? next : "/plano/conta";
}

/**
 * Recovery emails are sent with the implicit flow (tokens in the URL #hash)
 * rather than PKCE, so the link works even when opened on a different device
 * or browser from the one that requested it.
 */
async function sendResetEmail(email: string) {
  const sb = createPlainClient(URL_, ANON, { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false } });
  return sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/plano/definir-password` });
}

export function ClientLoginForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "forgot") {
      const { error } = await sendResetEmail(email.trim());
      setBusy(false);
      // same message either way — don't reveal which emails have accounts
      if (error && error.status && error.status >= 500) return setMsg({ kind: "error", text: "Não foi possível enviar o email. Tente mais tarde." });
      return setMsg({ kind: "ok", text: "Se existir uma conta com este email, vai receber um link para definir a palavra-passe." });
    }
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      const unreachable = error.name === "AuthRetryableFetchError" || !error.status;
      return setMsg({ kind: "error", text: unreachable ? "Não foi possível contactar o servidor. Tente novamente." : "Email ou palavra-passe incorretos." });
    }
    router.push(safeNext(next));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="w-full rounded-xl border border-border bg-surface p-6 shadow-sm md:w-[380px] md:p-7">
      <div className="font-serif-display text-xl font-medium">{mode === "login" ? "Entrar no vosso plano" : "Recuperar acesso"}</div>
      <p className="mt-1 text-[13px] text-ink-soft">
        {mode === "login" ? "Use o email com que a equipa Organizza vos convidou." : "Enviamos um link para definir uma nova palavra-passe."}
      </p>

      <label className="mt-6 block">
        <span className="mb-1.5 block text-[11px] text-ink-faint">Email</span>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} />
      </label>
      {mode === "login" && (
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[11px] text-ink-faint">Palavra-passe</span>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldCls} />
        </label>
      )}

      {msg && <div className={`mt-3 text-[12px] ${msg.kind === "error" ? "text-terracotta" : "text-sage"}`}>{msg.text}</div>}

      <button disabled={busy} className="mt-6 w-full rounded-md bg-sage py-2.5 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60">
        {busy ? "Um momento…" : mode === "login" ? "Entrar" : "Enviar link"}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "forgot" : "login");
          setMsg(null);
        }}
        className="mt-3 w-full text-center text-[12px] text-ink-soft hover:text-ink"
      >
        {mode === "login" ? "Esqueci-me da palavra-passe" : "← Voltar a entrar"}
      </button>
      <p className="mt-4 border-t border-border-soft pt-3 text-center text-[11px] text-ink-faint">
        Ainda sem conta? A equipa Organizza envia-vos o convite por email.
      </p>
    </form>
  );
}

type Stage = "checking" | "ready" | "invalid" | "saving";

/** Landing page for invite and password-reset emails. */
export function SetPasswordForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("checking");
  const [isInvite, setIsInvite] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    (async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);
      setIsInvite(hash.get("type") === "invite" || query.get("type") === "invite");
      // the app's shared browser client is PKCE-only and would reject #token links,
      // so this page reads the tokens itself and hands them to a dedicated client
      const sb = createBrowserClient(URL_, ANON, { isSingleton: false, auth: { detectSessionInUrl: false } });
      let ok = false;
      if (hash.get("access_token") && hash.get("refresh_token")) {
        const { error } = await sb.auth.setSession({ access_token: hash.get("access_token")!, refresh_token: hash.get("refresh_token")! });
        ok = !error;
      } else if (query.get("token_hash") && query.get("type")) {
        const { error } = await sb.auth.verifyOtp({ token_hash: query.get("token_hash")!, type: query.get("type") as "invite" | "recovery" });
        ok = !error;
      } else if (query.get("code")) {
        const { error } = await createClient().auth.exchangeCodeForSession(query.get("code")!);
        ok = !error;
      } else {
        // already signed in (e.g. changing password from the account)
        ok = !!(await createClient().auth.getUser()).data.user;
      }
      window.history.replaceState(null, "", window.location.pathname);
      setStage(ok ? "ready" : "invalid");
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use pelo menos 8 caracteres.");
    if (password !== confirm) return setError("As palavras-passe não coincidem.");
    setStage("saving");
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setStage("ready");
      return setError(error.message.includes("different") ? "Escolha uma palavra-passe diferente da anterior." : "Não foi possível guardar. Tente novamente.");
    }
    router.push("/plano/conta");
    router.refresh();
  }

  if (stage === "checking") return <div className="text-sm text-ink-soft">A verificar o link…</div>;

  if (stage === "invalid") {
    return (
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6">
        <div className="font-serif-display text-xl font-medium">Link inválido ou expirado</div>
        <p className="mt-1.5 text-[13px] text-ink-soft">Os links são válidos durante pouco tempo e só podem ser usados uma vez. Peça um novo:</p>
        {resent ? (
          <p className="mt-4 text-[13px] text-sage">Se existir uma conta com este email, vai receber um novo link.</p>
        ) : (
          <form
            className="mt-4 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await sendResetEmail(email.trim());
              setResent(true);
            }}
          >
            <input type="email" required placeholder="O seu email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} />
            <button className="shrink-0 rounded-md bg-sage px-4 text-sm font-medium text-white hover:bg-sage-hover">Enviar</button>
          </form>
        )}
        <a href="/plano" className="mt-4 block text-center text-[12px] text-ink-soft hover:text-ink">← Voltar a entrar</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="font-serif-display text-xl font-medium">{isInvite ? "Bem-vindos! 💍" : "Nova palavra-passe"}</div>
      <p className="mt-1 text-[13px] text-ink-soft">
        {isInvite ? "Escolham uma palavra-passe para entrar no vosso plano de sala e lugares." : "Escolha uma nova palavra-passe."}
      </p>
      <label className="mt-5 block">
        <span className="mb-1.5 block text-[11px] text-ink-faint">Palavra-passe (mín. 8 caracteres)</span>
        <input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={fieldCls} />
      </label>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-[11px] text-ink-faint">Repetir palavra-passe</span>
        <input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={fieldCls} />
      </label>
      {error && <div className="mt-3 text-[12px] text-terracotta">{error}</div>}
      <button disabled={stage === "saving"} className="mt-6 w-full rounded-md bg-sage py-2.5 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60">
        {stage === "saving" ? "A guardar…" : "Guardar e entrar"}
      </button>
    </form>
  );
}

export function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/plano");
        router.refresh();
      }}
      className={`rounded-md px-2.5 py-1.5 text-[13px] text-ink-soft hover:bg-border-soft hover:text-ink ${className}`}
    >
      Sair
    </button>
  );
}
