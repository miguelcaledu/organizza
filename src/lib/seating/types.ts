import type { ItemDetails, Materials } from "./materials";

// Seating-plan domain model. All lengths are in centimetres, angles in degrees
// (clockwise, since the drawing uses SVG's y-down coordinate system).

export type Pt = { x: number; y: number };

export type TableKind = "round160" | "round180" | "rect250";
export type FeatureKind =
  | "danceFloor" | "bar" | "buffet" | "dj"
  | "stage" | "photobooth"
  | "sofa" | "armchair"
  | "decor" | "cakeTable";
export type ItemKind = TableKind | FeatureKind;

export type SeatSides = "both" | "one";

export interface PlanItem {
  id: string;
  /** which space (Cocktail, Jantar…) the item stands in */
  spaceId: string;
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
  /** tablecloth, napkins, chairs… overriding the plan defaults (see materials.ts) */
  details?: ItemDetails;
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

export interface Room {
  outline: Pt[];
  doors: Door[];
}

/** One area of the event — e.g. "Cocktail", "Jantar", "Cerimónia" — with its own room and layout. */
export interface Space {
  id: string;
  name: string;
  room: Room;
}

/** The stored document: one or more spaces sharing a single guest list. */
export interface Plan {
  version: 2;
  title: string;
  date?: string;
  spaces: Space[];
  /** items of every space (each tagged with spaceId) */
  items: PlanItem[];
  guests: Guest[];
  settings: PlanSettings;
  /** material defaults and spare margins for the folha de obra (staff only) */
  materials?: Materials;
}

/** A single space projected for the layout tools: its room and items, plus the shared guests. */
export interface SpacePlan extends Omit<Plan, "spaces"> {
  spaceId: string;
  room: Room;
}
