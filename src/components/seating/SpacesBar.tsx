"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Space } from "@/lib/seating/types";
import { I } from "./ui";

const SUGGESTED = ["Cocktail", "Cerimónia", "Jantar", "Festa", "Lounge"];

/**
 * Tabs for the spaces of an event (Cocktail, Jantar…). Staff can add, rename,
 * reorder and delete spaces; everyone else just switches between them.
 */
export function SpacesBar({
  spaces,
  activeId,
  editable,
  seatedIn,
  onSelect,
  onAdd,
  onRename,
  onMove,
  onDelete,
}: {
  spaces: Space[];
  activeId: string;
  editable: boolean;
  /** number of seated guests per space, for the delete warning */
  seatedIn: (spaceId: string) => number;
  onSelect: (id: string) => void;
  onAdd?: (name: string) => void;
  onRename?: (id: string, name: string) => void;
  onMove?: (id: string, dir: -1 | 1) => void;
  onDelete?: (id: string) => void;
}) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirming = spaces.find((s) => s.id === confirmId);
  const used = new Set(spaces.map((s) => s.name.toLowerCase()));

  if (!editable && spaces.length < 2) return null;

  const finishRename = () => {
    if (renaming && draft.trim()) onRename?.(renaming, draft);
    setRenaming(null);
  };

  return (
    <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-1.5 print:hidden" role="tablist" aria-label="Espaços do evento">
      {spaces.map((sp, i) => {
        const active = sp.id === activeId;
        if (renaming === sp.id) {
          return (
            <input
              key={sp.id}
              autoFocus
              value={draft}
              maxLength={40}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={finishRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") finishRename();
                if (e.key === "Escape") setRenaming(null);
              }}
              className="w-36 shrink-0 rounded-full border border-sage bg-surface px-3 py-1 text-[13px] outline-none max-md:text-base"
              aria-label="Nome do espaço"
            />
          );
        }
        return (
          <div key={sp.id} className={`flex shrink-0 items-center rounded-full ${active ? "bg-sage-tint" : ""}`}>
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(sp.id)}
              onDoubleClick={() => {
                if (!editable) return;
                setRenaming(sp.id);
                setDraft(sp.name);
              }}
              className={`rounded-full px-3 py-1 text-[13px] whitespace-nowrap ${active ? "font-medium text-ink" : "text-ink-soft hover:text-ink"}`}
            >
              {sp.name}
            </button>
            {active && editable && (
              <span className="flex items-center pr-1 text-ink-faint">
                <button type="button" title="Mover para a esquerda" disabled={i === 0} onClick={() => onMove?.(sp.id, -1)} className="rounded px-1 hover:text-ink disabled:opacity-30">
                  ‹
                </button>
                <button type="button" title="Mover para a direita" disabled={i === spaces.length - 1} onClick={() => onMove?.(sp.id, 1)} className="rounded px-1 hover:text-ink disabled:opacity-30">
                  ›
                </button>
                <button
                  type="button"
                  title="Mudar o nome"
                  onClick={() => {
                    setRenaming(sp.id);
                    setDraft(sp.name);
                  }}
                  className="rounded px-1 text-[12px] hover:text-ink"
                >
                  ✎
                </button>
                {spaces.length > 1 && (
                  <button type="button" title="Eliminar espaço" onClick={() => setConfirmId(sp.id)} className="rounded px-1 hover:text-terracotta">
                    <I name="trash" size={13} />
                  </button>
                )}
              </span>
            )}
          </div>
        );
      })}

      {editable && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setAdding((a) => !a)}
            className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-[12px] text-ink-soft hover:border-sage hover:text-ink"
          >
            <I name="plus" size={12} /> Espaço
          </button>
          {adding && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setAdding(false)} />
              <div className="fixed z-40 mt-1 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
                {SUGGESTED.filter((n) => !used.has(n.toLowerCase())).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      onAdd?.(n);
                      setAdding(false);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-[13px] hover:bg-canvas"
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    onAdd?.("");
                    setAdding(false);
                  }}
                  className="block w-full border-t border-border-soft px-3 py-1.5 text-left text-[13px] text-ink-soft hover:bg-canvas"
                >
                  Outro…
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirming}
        title={`Eliminar o espaço “${confirming?.name}”?`}
        confirmLabel="Eliminar espaço"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) onDelete?.(confirmId);
          setConfirmId(null);
        }}
      >
        A sala, as mesas e os móveis deste espaço são removidos.
        {confirming && seatedIn(confirming.id) > 0 && (
          <>
            {" "}
            <b>{seatedIn(confirming.id)} convidado(s)</b> sentado(s) aqui ficam por sentar (continuam na lista).
          </>
        )}{" "}
        Pode desfazer com ⌘Z.
      </ConfirmDialog>
    </div>
  );
}
