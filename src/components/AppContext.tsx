"use client";

import { createContext, useContext } from "react";
import type { Profile } from "@/lib/types";

const AppContext = createContext<Profile | null>(null);

export function AppProvider({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return <AppContext.Provider value={profile}>{children}</AppContext.Provider>;
}

export function useProfile() {
  const profile = useContext(AppContext);
  if (!profile) throw new Error("useProfile must be used within AppProvider");
  return profile;
}

export function useIsAdmin() {
  return useProfile().role === "admin";
}
