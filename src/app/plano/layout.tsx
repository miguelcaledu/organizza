import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planta & lugares — Organizza",
  description: "Desenhe a sala do vosso casamento e sente cada convidado.",
  robots: { index: false, follow: false },
};

export default function PlanoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
