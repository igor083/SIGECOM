"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* ---------- Tipos ---------- */

export interface SidebarItem {
  label: string;
  href: string;
  /** SVG path data (d attribute) para o ícone. */
  icon: string;
}

/* ---------- Componente ---------- */

interface SidebarProps {
  items: SidebarItem[];
}

/**
 * Sidebar reutilizável que recebe uma lista de itens com ícones SVG.
 * Criado para resolver dependência faltante em configuracoes/financeiro.
 */
export default function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        background: "#1e293b",
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "0 24px 20px",
          fontSize: "1.25rem",
          fontWeight: 800,
          color: "#3b82f6",
          letterSpacing: "-0.02em",
        }}
      >
        SIGECOM
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: active ? 600 : 400,
                color: active ? "#fff" : "#94a3b8",
                background: active ? "rgba(59,130,246,0.15)" : "transparent",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                width={20}
                height={20}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
