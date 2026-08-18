"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Email ou palavra-passe incorretos.");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="flex w-full max-w-[400px] flex-col gap-7">
        <div className="flex flex-col gap-1.5 text-center">
          <div className="font-serif-display text-[26px] font-medium">Organizza</div>
          <div className="text-sm text-ink-soft">
            {mode === "signin" ? "Inicie sessão para continuar" : "Criar a primeira conta de administrador"}
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-7">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ink-soft">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@organizza.pt"
              className="rounded border border-border px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ink-soft">Palavra-passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded border border-border px-3 py-2.5 text-sm outline-none"
            />
          </div>
          {error && <div className="text-xs text-terracotta">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="mt-1.5 rounded bg-sage px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-hover disabled:opacity-60"
          >
            {loading ? "A processar…" : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setError("");
          }}
          className="text-center text-xs text-ink-soft hover:text-ink"
        >
          {mode === "signin" ? (
            <>
              Ainda sem conta? <span className="text-sage">Criar a primeira conta de administrador</span>
            </>
          ) : (
            <>
              Já tem conta? <span className="text-sage">Iniciar sessão</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
