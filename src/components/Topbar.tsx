"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, formatLongDate, initialsOf } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function Topbar({ profile }: { profile: Profile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const today = new Date();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between border-b border-border px-10 py-4">
      <div className="flex w-[280px] items-center gap-2 rounded border border-border bg-surface px-3 py-2">
        <Icon name="search" size={14} className="text-ink-faint shrink-0" />
        <input
          placeholder="Pesquisar"
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </div>
      <div className="flex items-center gap-5">
        <div className="text-sm text-ink-soft capitalize">{formatLongDate(today.toISOString().slice(0, 10))}</div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-sage-tint text-xs font-semibold text-sage"
          >
            {initialsOf(profile.full_name)}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-[38px] z-50 w-[220px] overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                <div className="border-b border-border-soft px-4 py-3.5">
                  <div className="text-sm font-medium">{profile.full_name}</div>
                  <div className="text-xs text-ink-faint">{profile.email}</div>
                </div>
                <a href="/settings" className="block px-4 py-2.5 text-sm hover:bg-canvas">
                  Definições
                </a>
                <button
                  onClick={logout}
                  className="block w-full border-t border-border-soft px-4 py-2.5 text-left text-sm text-terracotta hover:bg-canvas"
                >
                  Terminar sessão
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
