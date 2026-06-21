// =============================================================
// components/Sidebar.tsx — Sidebar de navegação (SIGECOM)
// =============================================================
// Reutilizável: Admin e Funcionário passam itens diferentes.
// Visual: fundo claro, borda azul esquerda no item ativo.
// =============================================================

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./Sidebar.module.css";

export interface SidebarItem {
  label: string;
  href: string;
  icon: string; // SVG path "d"
}

interface SidebarProps {
  items: SidebarItem[];
}

export default function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandName}>SIGECOM</span>
      </div>

      <nav className={styles.nav}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.active : ""}`}
            >
              <svg
                className={styles.navIcon}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}