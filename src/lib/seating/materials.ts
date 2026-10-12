import { isTable, KINDS } from "./catalog";
import type { ItemKind, Plan, PlanItem } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// Material details per item (tablecloths, napkins, chairs…) and the automatic
// material count ("folha de obra"). Plan-level defaults apply to every dining
// table; an item's own details override them field by field.
// ─────────────────────────────────────────────────────────────────────────

export type ClothDrop = "floor" | "short" | "none";

export interface ItemDetails {
  clothColor?: string;
  clothDrop?: ClothDrop;
  napkinColor?: string;
  chairModel?: string;
  /** colour of the chair covers; empty = no covers */
  chairCover?: string;
  centerpiece?: boolean;
  tableNumber?: boolean;
  note?: string;
}

export interface Materials {
  /** defaults for dining tables */
  tables: ItemDetails;
  /** defaults for bars, buffets, DJ and cake tables (tablecloth only) */
  others: Pick<ItemDetails, "clothColor" | "clothDrop">;
  /** spare margin added to counted items, in % */
  spare: { napkins: number; cloths: number; chairs: number };
}

export const DEFAULT_MATERIALS: Materials = {
  tables: { clothColor: "Branco", clothDrop: "floor", napkinColor: "Branco", chairModel: "Cadeira Tiffany", chairCover: "", centerpiece: true, tableNumber: true },
  others: { clothColor: "Branco", clothDrop: "floor" },
  spare: { napkins: 10, cloths: 0, chairs: 0 },
};

/** Items that can take a tablecloth besides dining tables, with their usual height (cm) for a floor-length drop. */
const CLOTHABLE: Partial<Record<ItemKind, number>> = { buffet: 76, dj: 76, cakeTable: 76, bar: 110 };
const TABLE_HEIGHT = 76;
const SHORT_DROP = 30;

export type DetailField = keyof ItemDetails;

/** Which detail fields make sense for an item. */
export function detailFields(item: Pick<PlanItem, "kind">): DetailField[] {
  if (isTable(item)) return ["clothColor", "clothDrop", "napkinColor", "chairModel", "chairCover", "centerpiece", "tableNumber", "note"];
  if (item.kind in CLOTHABLE) return ["clothColor", "clothDrop", "note"];
  return ["note"];
}

/** Item details with the plan defaults filled in. */
export function effectiveDetails(item: PlanItem, materials: Materials): ItemDetails {
  const own = item.details ?? {};
  const base: ItemDetails = isTable(item) ? materials.tables : item.kind in CLOTHABLE ? materials.others : {};
  const out: ItemDetails = {};
  for (const f of detailFields(item)) {
    const v = own[f] ?? base[f];
    if (v !== undefined) (out as Record<string, unknown>)[f] = v;
  }
  return out;
}

const up10 = (cm: number) => Math.ceil(cm / 10) * 10;
const m = (cm: number) => (cm / 100).toLocaleString("pt-PT", { maximumFractionDigits: 2 });

/** Tablecloth size for an item, rounded up to the next 10 cm. Null when it has no cloth. */
export function clothSize(item: PlanItem, drop: ClothDrop | undefined): { round: boolean; a: number; b: number; label: string } | null {
  if (!drop || drop === "none") return null;
  const height = isTable(item) ? TABLE_HEIGHT : CLOTHABLE[item.kind];
  if (height === undefined) return null;
  const d = drop === "floor" ? height : SHORT_DROP;
  const round = item.kind === "round160" || item.kind === "round180" || !!KINDS[item.kind].round;
  if (round) {
    const a = up10(item.w + 2 * d);
    return { round, a, b: a, label: `Redonda Ø ${m(a)} m` };
  }
  const a = up10(Math.max(item.w, item.h) + 2 * d), b = up10(Math.min(item.w, item.h) + 2 * d);
  return { round, a, b, label: `Retangular ${m(a)} × ${m(b)} m` };
}

export const DROP_LABEL: Record<ClothDrop, string> = { floor: "Até ao chão", short: "Queda curta (30 cm)", none: "Sem toalha" };

// ── material count ──────────────────────────────────────────────────────

export interface CountLine {
  label: string;
  /** e.g. colour or size */
  detail?: string;
  qty: number;
  /** quantity including the spare margin */
  withSpare?: number;
}

export interface MaterialSection {
  title: string;
  lines: CountLine[];
}

export interface TableRow {
  item: PlanItem;
  space: string;
  seats: number;
  details: ItemDetails;
  cloth: string | null;
}

export interface MaterialCount {
  sections: MaterialSection[];
  /** per space, same structure (only filled when the plan has several spaces) */
  bySpace: { space: string; sections: MaterialSection[] }[];
  rows: TableRow[];
  notes: { label: string; space: string; note: string }[];
}

function tally(map: Map<string, CountLine>, key: string, line: Omit<CountLine, "qty">, qty = 1) {
  const cur = map.get(key);
  if (cur) cur.qty += qty;
  else map.set(key, { ...line, qty });
}

const withSpare = (qty: number, pct: number) => (pct > 0 ? Math.ceil(qty * (1 + pct / 100)) : undefined);

function countItems(items: PlanItem[], materials: Materials): MaterialSection[] {
  const tables = new Map<string, CountLine>();
  const chairs = new Map<string, CountLine>();
  const cloths = new Map<string, CountLine>();
  const napkins = new Map<string, CountLine>();
  const covers = new Map<string, CountLine>();
  const extras = new Map<string, CountLine>();
  const others = new Map<string, CountLine>();

  for (const it of items) {
    const d = effectiveDetails(it, materials);
    const cloth = clothSize(it, d.clothDrop);
    if (cloth) tally(cloths, `${cloth.label}|${d.clothColor ?? ""}`, { label: cloth.label, detail: d.clothColor || "cor por definir" });

    if (isTable(it)) {
      const seats = it.seats ?? 0;
      const kind = KINDS[it.kind].label + (it.kind === "rect250" ? ` (${it.h} cm de largura)` : "");
      tally(tables, kind, { label: kind });
      if (seats) {
        tally(chairs, d.chairModel ?? "", { label: d.chairModel || "Cadeira (modelo por definir)" }, seats);
        if (d.napkinColor) tally(napkins, d.napkinColor, { label: "Guardanapos", detail: d.napkinColor }, seats);
        if (d.chairCover) tally(covers, d.chairCover, { label: "Capas de cadeira", detail: d.chairCover }, seats);
      }
      if (d.centerpiece) tally(extras, "centerpiece", { label: "Centros de mesa" });
      if (d.tableNumber) tally(extras, "tableNumber", { label: "Números / nomes de mesa" });
    } else {
      const spec = KINDS[it.kind];
      const size = spec.round ? `Ø ${m(it.w)} m` : `${m(it.w)} × ${m(it.h)} m`;
      tally(others, `${it.kind}|${size}`, { label: spec.label, detail: size });
    }
  }

  const sp = materials.spare;
  const finish = (map: Map<string, CountLine>, pct = 0) =>
    [...map.values()].map((l) => ({ ...l, withSpare: withSpare(l.qty, pct) })).sort((a, b) => a.label.localeCompare(b.label, "pt") || (a.detail ?? "").localeCompare(b.detail ?? "", "pt"));

  return [
    { title: "Mesas", lines: finish(tables) },
    { title: "Cadeiras", lines: finish(chairs, sp.chairs) },
    { title: "Toalhas", lines: finish(cloths, sp.cloths) },
    { title: "Guardanapos e capas", lines: [...finish(napkins, sp.napkins), ...finish(covers, sp.chairs)] },
    { title: "Decoração de mesa", lines: finish(extras) },
    { title: "Outros elementos", lines: finish(others) },
  ].filter((s) => s.lines.length);
}

export function countMaterials(plan: Plan, materials: Materials = plan.materials ?? DEFAULT_MATERIALS): MaterialCount {
  const spaceName = new Map(plan.spaces.map((s) => [s.id, s.name]));
  const order = new Map(plan.spaces.map((s, i) => [s.id, i]));
  const items = [...plan.items].sort((a, b) => (order.get(a.spaceId) ?? 0) - (order.get(b.spaceId) ?? 0) || a.label.localeCompare(b.label, "pt", { numeric: true }));

  const rows: TableRow[] = items.filter(isTable).map((it) => {
    const details = effectiveDetails(it, materials);
    return { item: it, space: spaceName.get(it.spaceId) ?? "", seats: it.seats ?? 0, details, cloth: clothSize(it, details.clothDrop)?.label ?? null };
  });
  const notes = items.filter((it) => it.details?.note?.trim()).map((it) => ({ label: it.label, space: spaceName.get(it.spaceId) ?? "", note: it.details!.note!.trim() }));

  return {
    sections: countItems(items, materials),
    bySpace: plan.spaces.length > 1 ? plan.spaces.map((s) => ({ space: s.name, sections: countItems(items.filter((i) => i.spaceId === s.id), materials) })) : [],
    rows,
    notes,
  };
}

/** Spreadsheet-friendly export (semicolon-separated, as Excel in Portugal expects). */
export function materialsCsv(plan: Plan, count: MaterialCount): string {
  const esc = (v: string | number | undefined) => {
    const s = v === undefined ? "" : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines: (string | number | undefined)[][] = [[`Folha de obra — ${plan.title}`], [], ["Secção", "Material", "Detalhe", "Quantidade", "Com margem"]];
  for (const s of count.sections) for (const l of s.lines) lines.push([s.title, l.label, l.detail, l.qty, l.withSpare ?? l.qty]);
  lines.push([], ["Espaço", "Mesa", "Tipo", "Lugares", "Toalha", "Cor da toalha", "Guardanapos", "Cadeiras", "Capas", "Centro", "Número", "Notas"]);
  for (const r of count.rows) {
    const d = r.details;
    lines.push([r.space, r.item.label, KINDS[r.item.kind].short, r.seats, r.cloth ?? "—", d.clothColor, d.napkinColor, d.chairModel, d.chairCover, d.centerpiece ? "sim" : "não", d.tableNumber ? "sim" : "não", d.note]);
  }
  return "﻿" + lines.map((l) => l.map(esc).join(";")).join("\r\n");
}
