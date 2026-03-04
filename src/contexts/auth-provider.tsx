"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth as useAuthCore } from "@/hooks/use-auth";

type AuthContextType = ReturnType<typeof useAuthCore>;

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthCore();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useSharedAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useSharedAuth must be used within AuthProvider");
  }
  return ctx;
}
