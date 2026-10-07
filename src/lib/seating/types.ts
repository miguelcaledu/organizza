// Seating-plan domain model. All lengths are in centimetres, angles in degrees
// (clockwise, since the drawing uses SVG's y-down coordinate system).

export type Pt = { x: number; y: number };

export type TableKind = "round160" | "round180" | "rect250";
export type FeatureKind = "danceFloor" | "bar" | "buffet" | "dj";
export type ItemKind = TableKind | FeatureKind;

export type SeatSides = "both" | "one";

export interface PlanItem {
  id: string;
  kind: ItemKind;
  /** centre of the item */
  x: number;
  y: number;
  rotation: number;
  /** footprint of the furniture itself (without chairs). Round tables: w = h = diameter. */
  w: number;
  h: number;
  label: string;
  /** tables only */
  seats?: number;
  /** rectangular tables only: chairs on both long sides, or only one (head table) */
  seatSides?: SeatSides;
}

export interface Door {
  id: string;
  /** index of the wall segment: outline[wall] → outline[wall + 1] */
  wall: number;
  /** distance from the wall's start point to the door's centre */
  offset: number;
  width: number;
  label: string;
}

export interface SeatRef {
  tableId: string;
  index: number;
}

export interface Guest {
  id: string;
  name: string;
  group?: string;
  note?: string;
  seat: SeatRef | null;
}

export interface PlanSettings {
  snap: boolean;
  snapStep: number;
  showGrid: boolean;
  showNames: boolean;
}

export interface Plan {
  version: 1;
  title: string;
  date?: string;
  room: { outline: Pt[]; doors: Door[] };
  items: PlanItem[];
  guests: Guest[];
  settings: PlanSettings;
}
