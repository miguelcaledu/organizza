"use client";

import { useEffect, useMemo, useState } from "react";
import { useIsAdmin, useProfile } from "@/components/AppContext";
import { Icon } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/lib/types";

const CATEGORIES = ["Todos", "Contratos", "Seguros", "Certificados", "Fichas de Evento", "Modelos"];
const CAT_COLORS: Record<string, string> = {
  Contratos: "#8A9A7B", Seguros: "#B8A88A", Certificados: "#6B7B9A", "Fichas de Evento": "#6B7B9A", Modelos: "#A8A199",
};

export default function DocumentsPage() {
  const isAdmin = useIsAdmin();
  const me = useProfile();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Modelos");

  async function load() {
    const { data } = await createClient().from("documents").select("*").is("event_id", null).order("created_at", { ascending: false });
    setDocs(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => (category === "Todos" || d.category === category) && (!q || d.name.toLowerCase().includes(q)));
  }, [docs, category, query]);

  async function upload(file: File) {
    const supabase = createClient();
    const path = `company/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (!error) {
      const { data } = await supabase
        .from("documents")
        .insert({ name: file.name, category: uploadCategory, storage_path: path, uploaded_by: me.id, size_bytes: file.size })
        .select()
        .single();
      if (data) setDocs((prev) => [data, ...prev]);
    }
  }

  async function download(doc: Document) {
    const supabase = createClient();
    const { data } = await supabase.storage.from("documents").createSignedUrl(doc.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function remove(doc: Document) {
    const supabase = createClient();
    await supabase.storage.from("documents").remove([doc.storage_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  }

  return (
    <div className="px-10 pb-16 pt-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-serif-display text-[26px] font-medium">Documentos</h1>
        {isAdmin && (
          <label className="flex cursor-pointer items-center gap-1.5 rounded bg-sage px-4 py-2.5 text-sm font-medium text-white hover:bg-sage-hover">
            <Icon name="plus" size={14} />
            Carregar documento
            <select
              value={uploadCategory}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="ml-1 rounded bg-sage-hover px-1 py-0.5 text-xs text-white"
            >
              {CATEGORIES.slice(1).map((c) => <option key={c}>{c}</option>)}
            </select>
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                active ? "border-sage bg-sage-tint text-[#5F6E52]" : "border-border bg-surface text-ink-soft"
              }`}
            >
              {c}
            </button>
          );
        })}
        <div className="ml-auto flex w-[200px] items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1.5">
          <Icon name="search" size={12} className="text-ink-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar documentos" className="w-full bg-transparent text-xs outline-none" />
        </div>
      </div>

      <div className="overflow-hidden rounded border border-border bg-surface">
        <div className="grid gap-3 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint" style={{ gridTemplateColumns: "1fr 140px 160px 110px 100px 90px" }}>
          <div>Nome</div><div>Categoria</div><div>Enviado por</div><div>Data</div><div>Tamanho</div><div></div>
        </div>
        {loading ? (
          <div className="py-16 text-center text-sm text-ink-faint">A carregar…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-1.5 font-serif-display text-lg font-medium">Nenhum documento encontrado.</div>
            <div className="text-sm text-ink-soft">Ajuste a pesquisa ou a categoria selecionada.</div>
          </div>
        ) : (
          filtered.map((d) => (
            <div key={d.id} className="grid items-center gap-3 border-b border-border px-4 py-3" style={{ gridTemplateColumns: "1fr 140px 160px 110px 100px 90px" }}>
              <div className="flex min-w-0 items-center gap-2.5">
                <Icon name="documents" size={16} className="shrink-0 text-ink-faint" />
                <span className="truncate text-sm">{d.name}</span>
              </div>
              <div>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ color: CAT_COLORS[d.category], background: CAT_COLORS[d.category] + "1A" }}
                >
                  {d.category}
                </span>
              </div>
              <div className="text-xs text-ink-soft">—</div>
              <div className="text-xs tabular-nums text-ink-soft">{new Date(d.created_at).toLocaleDateString("pt-PT")}</div>
              <div className="text-xs text-ink-faint">{(d.size_bytes / 1024).toFixed(0)} KB</div>
              <div className="flex items-center justify-end gap-2.5">
                <button onClick={() => download(d)} title="Transferir" className="text-ink-soft">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" />
                  </svg>
                </button>
                {isAdmin && (
                  <button onClick={() => remove(d)} title="Eliminar" className="text-terracotta">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6" /><path d="M14 11v6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
