"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user?.perfil === "ADMIN") {
      router.replace("/dashboard/admin");
    } else {
      router.replace("/dashboard/funcionario");
    }
  }, [loading, isAuthenticated, user, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f2f5",
        color: "#94a3b8",
        fontSize: "0.875rem",
      }}
    >
      Redirecionando...
    </div>
  );
}
