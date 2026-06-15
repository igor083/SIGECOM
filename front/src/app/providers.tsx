"use client";

import { AuthProvider } from "@/hooks/useAuth";
import type { ReactNode } from "react";

/**
 * Providers wrapper — envolve a app com todos os
 * Context Providers necessários.
 *
 * Separado do layout.tsx porque Providers precisam ser
 * "use client" mas o layout raiz é Server Component.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
