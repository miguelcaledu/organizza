"use client";

import { CHAIR_D, CHAIR_W, formatM, isTable, KINDS, seatGeometry, toWorld } from "@/lib/seating/catalog";
import { bounds, dist, doorInward, localFootprint, wallAt } from "@/lib/seating/geometry";
import { CHANGE_COLORS, type ChangeHighlights } from "@/lib/seating/clientEdits";
import type { Guest, PlanItem, SpacePlan } from "@/lib/seating/types";

// Pure SVG rendering of a plan in world units (cm). Interactive bits are tagged
// with data-* attributes (data-item, data-seat, data-handle, data-vertex,
// data-mid, data-door) and FloorCanvas handles pointer events by delegation, so
// the same drawing also serves the read-only view and the print sheet.

export type DrawingMode = "items" | "room" | "static";

export function guestsBySeat(guests: Guest[]) {
  const m = new Map<string, Guest>();
  for (const g of guests) if (g.seat) m.set(`${g.seat.tableId}:${g.seat.index}`, g);
  return m;
}

function shortName(name: string, compact: boolean) {
  if (compact) {
    const [first, ...rest] = name.trim().split(/\s+/);
    const last = rest.filter((w) => /^\p{Lu}/u.test(w)).pop();
    const s = last ? `${first} ${last[0]}.` : first;
    return s.length > 12 ? s.slice(0, 11) + "…" : s;
  }
  return name.length > 18 ? name.slice(0, 17) + "…" : name;
}

const INK = "#1C1A17";
const SAGE = "#8A9A7B";
const GOLD = "#B8A88A";
const TERRA = "#C4703F";

export function PlanDrawing({
  plan,
  mode,
  zoom,
  selectedId,
  warnIds,
  seatTargets,
  hoverSeat,
  handleScale = 1,
  layoutEditable = true,
  highlights,
}: {
  plan: SpacePlan;
  mode: DrawingMode;
  /** false hides move/rotate/resize handles (clients, read-only) */
  layoutEditable?: boolean;
  /** staff view: colour chairs touched by unreviewed client changes */
  highlights?: ChangeHighlights;
  /** enlarge drag handles for fingers */
  handleScale?: number;
  /** screen px per cm; omitted for print (fixed sizes) */
  zoom?: number;
  selectedId?: string | null;
  warnIds?: Set<string>;
  /** highlight empty seats while a guest is being placed */
  seatTargets?: boolean;
  hoverSeat?: string | null;
}) {
  const { outline, doors } = plan.room;
  const px = zoom ? 1 / zoom : 1.6; // cm per screen pixel
  const seated = guestsBySeat(plan.guests);
  const roomPts = outline.map((p) => `${p.x},${p.y}`).join(" ");
  const b = outline.length ? bounds(outline) : { minX: 0, minY: 0, w: 0, h: 0, maxX: 0, maxY: 0 };
  // names keep a legible on-screen size; when zoomed far out they shrink to "First L."
  const showNames = plan.settings.showNames && (!zoom || zoom >= 0.18);
  const nameFs = zoom ? Math.min(24, Math.max(14, 7.5 / zoom)) : 14;
  const compactNames = !!zoom && 14 * zoom < 7.5;
  const editingRoom = mode === "room";
  const ordered = [...plan.items].sort((a, b2) => Number(isTable(a)) - Number(isTable(b2)));

  return (
    <g>
      <defs>
        <pattern id="grid-minor" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#EDE8E0" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </pattern>
        <pattern id="grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#grid-minor)" />
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#DED7CB" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </pattern>
        <pattern id="parquet" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#F3ECDD" />
          <path d="M0 20 H40 M20 0 V20 M0 40 V20 M40 40 V20" stroke="#E4D9C3" strokeWidth={1} vectorEffect="non-scaling-stroke" fill="none" />
        </pattern>
        <clipPath id="room-clip">
          <polygon points={roomPts} />
        </clipPath>
      </defs>

      {/* floor + grid */}
      <polygon points={roomPts} fill="#FFFFFF" />
      {plan.settings.showGrid && mode !== "static" && (
        <rect x={b.minX} y={b.minY} width={b.w} height={b.h} fill="url(#grid-major)" clipPath="url(#room-clip)" />
      )}
      <polygon points={roomPts} fill="none" stroke={INK} strokeWidth={10} strokeLinejoin="miter" />

      {/* wall lengths */}
      {(editingRoom || mode === "static") &&
        outline.map((_, i) => {
          const [a, c] = wallAt(outline, i);
          const len = dist(a, c);
          if (len < 50) return null;
          const mid = { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 };
          const ang = (Math.atan2(c.y - a.y, c.x - a.x) * 180) / Math.PI;
          const upright = ang > 90 || ang < -90 ? ang + 180 : ang;
          // label sits outside the room: nudge away from the centroid
          const cx = b.minX + b.w / 2, cy = b.minY + b.h / 2;
          const nx = mid.x - cx, ny = mid.y - cy;
          const nl = Math.hypot(nx, ny) || 1;
          const off = 30 * px + 8;
          const fs = Math.max(12 * px, 16);
          return (
            <text
              key={`len${i}`}
              x={mid.x + (nx / nl) * off}
              y={mid.y + (ny / nl) * off}
              fontSize={fs}
              fill="#6B655D"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${upright} ${mid.x + (nx / nl) * off} ${mid.y + (ny / nl) * off})`}
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              {formatM(len)}
            </text>
          );
        })}

      {/* doors */}
      {doors.map((d) => {
        if (d.wall >= outline.length) return null;
        const { center, u, n } = doorInward(outline, d);
        const hw = d.width / 2;
        const L = { x: center.x - u.x * hw, y: center.y - u.y * hw };
        const R = { x: center.x + u.x * hw, y: center.y + u.y * hw };
        const Lo = { x: L.x + n.x * hw, y: L.y + n.y * hw };
        const Ro = { x: R.x + n.x * hw, y: R.y + n.y * hw };
        const fs = Math.min(Math.max(14, 11 * px), d.width * 0.18);
        const lp = { x: center.x + n.x * (hw + fs), y: center.y + n.y * (hw + fs) };
        return (
          <g key={d.id} data-door={editingRoom ? d.id : undefined} style={{ cursor: editingRoom ? "grab" : undefined }}>
            <line x1={L.x} y1={L.y} x2={R.x} y2={R.y} stroke="#FFFFFF" strokeWidth={14} />
            <line x1={L.x} y1={L.y} x2={R.x} y2={R.y} stroke={GOLD} strokeWidth={4} />
            <path
              d={`M ${L.x} ${L.y} L ${Lo.x} ${Lo.y} A ${hw} ${hw} 0 0 ${sweep(L, Lo, center)} ${center.x} ${center.y}
                  M ${R.x} ${R.y} L ${Ro.x} ${Ro.y} A ${hw} ${hw} 0 0 ${sweep(R, Ro, center)} ${center.x} ${center.y}`}
              fill="none"
              stroke={GOLD}
              strokeWidth={1.2}
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
            />
            <text x={lp.x} y={lp.y} fontSize={fs} fill="#8A7F6E" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
              {d.label}
            </text>
          </g>
        );
      })}

      {/* furniture */}
      <g opacity={editingRoom ? 0.45 : 1} style={{ pointerEvents: editingRoom ? "none" : undefined }}>
        {ordered.map((it) => (
          <ItemShape
            key={it.id}
            item={it}
            px={px}
            selected={selectedId === it.id}
            warn={!!warnIds?.has(it.id)}
            seated={seated}
            seatTargets={!!seatTargets}
            hoverSeat={hoverSeat}
            interactive={mode !== "static"}
            handles={mode !== "static" && layoutEditable}
            hs={handleScale}
            highlights={highlights}
          />
        ))}
      </g>

      {/* guest names — drawn in world space so they stay upright whatever the table rotation */}
      {showNames && !editingRoom && (
        <g style={{ pointerEvents: "none", fontFamily: "var(--font-inter), sans-serif" }}>
          {plan.items.filter(isTable).flatMap((it) =>
            seatGeometry(it).map((s, i) => {
              const g = seated.get(`${it.id}:${i}`);
              if (!g) return null;
              const out = s.out + it.rotation;
              const rad = (out * Math.PI) / 180;
              const anchor = toWorld(it, s);
              const start = { x: Math.round(anchor.x + Math.cos(rad) * (CHAIR_D / 2 + 8)), y: Math.round(anchor.y + Math.sin(rad) * (CHAIR_D / 2 + 8)) };
              const norm = ((out % 360) + 360) % 360;
              const flip = norm > 90 && norm < 270;
              return (
                <text
                  key={`${it.id}:${i}`}
                  x={start.x}
                  y={start.y}
                  fontSize={nameFs}
                  fill={INK}
                  textAnchor={flip ? "end" : "start"}
                  dominantBaseline="middle"
                  transform={`rotate(${flip ? norm - 180 : norm} ${start.x} ${start.y})`}
                >
                  {shortName(g.name, compactNames)}
                </text>
              );
            }),
          )}
        </g>
      )}

      {/* room editing handles */}
      {editingRoom && (
        <g>
          {outline.map((p, i) => {
            const q = outline[(i + 1) % outline.length];
            // keep the "+" clear of any door sitting mid-wall
            const len = dist(p, q);
            const busy = doors.some((d) => d.wall === i && Math.abs(d.offset - len / 2) < d.width / 2 + 40 * px);
            const t = busy ? 0.2 : 0.5;
            if (len < 60 * px) return null;
            const m = { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
            return (
              <g key={`mid${i}`} data-mid={i} style={{ cursor: "copy" }}>
                <circle cx={m.x} cy={m.y} r={9 * px} fill="#fff" stroke={SAGE} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                <path d={`M ${m.x - 4 * px} ${m.y} H ${m.x + 4 * px} M ${m.x} ${m.y - 4 * px} V ${m.y + 4 * px}`} stroke={SAGE} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
          {doors.map((d) => {
            if (d.wall >= outline.length) return null;
            const { center } = doorInward(outline, d);
            return (
              <circle key={d.id} data-door={d.id} cx={center.x} cy={center.y} r={9 * px} fill={GOLD} stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" style={{ cursor: "grab" }} />
            );
          })}
          {outline.map((p, i) => (
            <circle key={`v${i}`} data-vertex={i} cx={p.x} cy={p.y} r={10 * px} fill={SAGE} stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" style={{ cursor: "move" }} />
          ))}
        </g>
      )}
    </g>
  );
}

function sweep(hinge: { x: number; y: number }, open: { x: number; y: number }, closed: { x: number; y: number }) {
  // arc from open leaf position back to the closed position, around the hinge
  const a = { x: open.x - hinge.x, y: open.y - hinge.y };
  const c = { x: closed.x - hinge.x, y: closed.y - hinge.y };
  return a.x * c.y - a.y * c.x > 0 ? 1 : 0;
}

function ItemShape({
  item,
  px,
  selected,
  warn,
  seated,
  seatTargets,
  hoverSeat,
  interactive,
  handles,
  hs,
  highlights,
}: {
  item: PlanItem;
  handles: boolean;
  hs: number;
  highlights?: ChangeHighlights;
  px: number;
  selected: boolean;
  warn: boolean;
  seated: Map<string, Guest>;
  seatTargets: boolean;
  hoverSeat?: string | null;
  interactive: boolean;
}) {
  const spec = KINDS[item.kind];
  const round = item.kind === "round160" || item.kind === "round180" || !!spec.round;
  // too small for a label; the shape says it all
  const quiet = item.kind === "decor" || item.kind === "armchair";
  const table = spec.isTable;
  const seats = table ? seatGeometry(item) : [];
  const stroke = warn ? TERRA : spec.stroke;
  const fp = localFootprint(item);
  const labelFs = Math.min(Math.max(24, 11 * px), Math.min(item.w, item.h) * 0.32);
  const topY = Math.min(...fp.map((p) => p.y));
  const used = seats.filter((_, i) => seated.has(`${item.id}:${i}`)).length;

  return (
    <g transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`} data-item={item.id} style={{ cursor: interactive ? "grab" : undefined }}>
      {(selected || warn) && (
        <polygon
          points={fp.map((p) => `${p.x},${p.y}`).join(" ")}
          fill={warn ? "#C4703F10" : "#8A9A7B10"}
          stroke={warn ? TERRA : SAGE}
          strokeWidth={selected ? 1.8 : 1.2}
          strokeDasharray={selected ? "6 4" : "3 3"}
          vectorEffect="non-scaling-stroke"
        />
      )}

      {seats.map((s, i) => {
        const key = `${item.id}:${i}`;
        const g = seated.get(key);
        const target = seatTargets && !g;
        const hover = hoverSeat === key;
        const gMark = g ? highlights?.guests.get(g.id) : undefined;
        const mark = gMark === "added" ? CHANGE_COLORS.guest_added : gMark === "changed" ? CHANGE_COLORS.guest_changed : undefined;
        const newSeat = highlights?.seats.has(key);
        return (
          <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.out + 90})`} data-seat={key} style={{ cursor: interactive ? "pointer" : undefined }}>
            {/* generous invisible hit area for fingers */}
            <circle r={CHAIR_W * 0.75} fill="transparent" />
            <rect
              x={-CHAIR_W / 2}
              y={-CHAIR_D / 2}
              width={CHAIR_W}
              height={CHAIR_D}
              rx={9}
              fill={hover ? SAGE : mark ? mark.fill : g ? "#B9C4AE" : newSeat ? CHANGE_COLORS.seat_added.fill : target ? "#F1F4EC" : "#FFFFFF"}
              stroke={hover || target ? SAGE : mark ? mark.stroke : g ? SAGE : "#CFC6B6"}
              strokeWidth={target || hover || mark ? 2 : 1.1}
              vectorEffect="non-scaling-stroke"
            />
            {newSeat && (
              <rect
                x={-CHAIR_W / 2 - 5}
                y={-CHAIR_D / 2 - 5}
                width={CHAIR_W + 10}
                height={CHAIR_D + 10}
                rx={12}
                fill="none"
                stroke={CHANGE_COLORS.seat_added.stroke}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            )}
            <line x1={-CHAIR_W / 2 + 6} x2={CHAIR_W / 2 - 6} y1={CHAIR_D / 2 - 7} y2={CHAIR_D / 2 - 7} stroke={g ? "#8A9A7B" : "#DED7CB"} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}

      <ItemBody item={item} fill={spec.fill} stroke={stroke} strokeWidth={warn ? 2 : 1.4} round={round} table={table} />

      {/* label, counter-rotated to stay upright */}
      <g transform={`rotate(${-item.rotation})`} style={{ pointerEvents: "none", fontFamily: "var(--font-inter), sans-serif", display: quiet ? "none" : undefined }}>
        <text y={table ? -labelFs * 0.15 : -labelFs * 0.1} fontSize={labelFs} textAnchor="middle" dominantBaseline="middle" fill={INK} style={{ fontFamily: "var(--font-fraunces), serif" }}>
          {item.label}
        </text>
        <text y={labelFs * 0.85} fontSize={labelFs * 0.6} textAnchor="middle" dominantBaseline="middle" fill="#8A7F6E" display={round && !table ? "none" : undefined}>
          {table ? `${used}/${item.seats ?? 0}` : round ? `Ø ${formatM(item.w)}` : `${formatM(item.w)} × ${formatM(item.h)}`.replace(/ m ×/, " ×")}
        </text>
      </g>

      {/* manipulation handles (screen-constant size; bigger on touch screens) */}
      {selected && handles && (
        <g>
          <line x1={0} y1={topY} x2={0} y2={topY - 26 * px * hs} stroke={SAGE} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
          <g data-handle="rotate" style={{ cursor: "grab" }}>
            <circle cy={topY - 26 * px * hs} r={16 * px * hs} fill="transparent" />
            <circle cy={topY - 26 * px * hs} r={9 * px * hs} fill="#fff" stroke={SAGE} strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <path
              d={`M ${-4 * px * hs} ${topY - 26 * px * hs} a ${4 * px * hs} ${4 * px * hs} 0 1 1 ${4 * px * hs} ${4 * px * hs}`}
              fill="none"
              stroke={SAGE}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          </g>
          {!table && (
            <g data-handle="resize" style={{ cursor: "nwse-resize" }}>
              <circle cx={item.w / 2} cy={item.h / 2} r={16 * px * hs} fill="transparent" />
              <rect x={item.w / 2 - 8 * px * hs} y={item.h / 2 - 8 * px * hs} width={16 * px * hs} height={16 * px * hs} rx={3 * px * hs} fill={SAGE} stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            </g>
          )}
          {item.kind === "rect250" && (
            // rectangular tables: only the width is adjustable (length is fixed at 250 cm)
            <g data-handle="width" style={{ cursor: "ns-resize" }}>
              <circle cy={item.h / 2} r={16 * px * hs} fill="transparent" />
              <rect x={-10 * px * hs} y={item.h / 2 - 5 * px * hs} width={20 * px * hs} height={10 * px * hs} rx={4 * px * hs} fill={SAGE} stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            </g>
          )}
        </g>
      )}
    </g>
  );
}

/** The furniture itself, in local coordinates (centre at 0,0, unrotated). */
function ItemBody({ item, fill, stroke, strokeWidth, round, table }: { item: PlanItem; fill: string; stroke: string; strokeWidth: number; round: boolean; table: boolean }) {
  const w = item.w, h = item.h;
  const line = { stroke, strokeWidth, vectorEffect: "non-scaling-stroke" as const, fill };
  const thin = { stroke, strokeWidth: 1, vectorEffect: "non-scaling-stroke" as const, fill: "none" };

  switch (item.kind) {
    case "sofa":
    case "armchair": {
      // seat facing +y: backrest along the top edge, armrests on both sides
      const back = Math.min(h * 0.3, 28), arm = Math.min(w * 0.14, 22);
      const cushions = item.kind === "sofa" ? Math.max(2, Math.round((w - 2 * arm) / 70)) : 1;
      const cw = (w - 2 * arm) / cushions;
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} {...line} />
          <rect x={-w / 2} y={-h / 2} width={w} height={back} rx={8} {...line} fill="#E2D7C4" />
          <rect x={-w / 2} y={-h / 2} width={arm} height={h} rx={8} {...line} fill="#E2D7C4" />
          <rect x={w / 2 - arm} y={-h / 2} width={arm} height={h} rx={8} {...line} fill="#E2D7C4" />
          {Array.from({ length: cushions - 1 }, (_, i) => (
            <line key={i} x1={-w / 2 + arm + cw * (i + 1)} x2={-w / 2 + arm + cw * (i + 1)} y1={-h / 2 + back} y2={h / 2 - 4} {...thin} />
          ))}
        </g>
      );
    }
    case "stage":
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} {...line} />
          {/* front edge of the stage */}
          <line x1={-w / 2} x2={w / 2} y1={h / 2 - 12} y2={h / 2 - 12} {...thin} strokeDasharray="6 4" />
        </g>
      );
    case "photobooth":
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} {...line} strokeDasharray="10 6" />
          {/* backdrop along the back wall */}
          <rect x={-w / 2 + 12} y={-h / 2 + 10} width={w - 24} height={14} rx={3} fill={stroke} opacity={0.35} />
        </g>
      );
    case "decor": {
      // plant / flower arrangement seen from above: a ring of leaves around a centre
      const r = w / 2, n = 7;
      return (
        <g>
          {Array.from({ length: n }, (_, i) => {
            const a = (360 * i) / n;
            return <ellipse key={i} cx={0} cy={-r * 0.5} rx={r * 0.32} ry={r * 0.5} transform={`rotate(${a})`} fill={fill} stroke={stroke} strokeWidth={1} vectorEffect="non-scaling-stroke" />;
          })}
          <circle r={r * 0.28} fill="#F4E3D7" stroke="#C4703F" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </g>
      );
    }
    case "cakeTable":
      return (
        <g>
          <circle r={w / 2} {...line} />
          <circle r={w * 0.24} {...thin} fill="#FFFFFF" />
          <circle r={w * 0.14} {...thin} />
        </g>
      );
  }
  if (round) return <circle r={w / 2} {...line} />;
  return (
    <rect
      x={-w / 2}
      y={-h / 2}
      width={w}
      height={h}
      rx={table ? 4 : 6}
      {...line}
      fill={item.kind === "danceFloor" ? "url(#parquet)" : fill}
    />
  );
}
