"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import type { SvgIconComponent } from "@mui/icons-material";
import styles from "./AppShell.module.css";

interface NavItem {
  label: string;
  href: string;
  Icon: SvgIconComponent;
  activePaths?: string[];
}

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin", Icon: HomeOutlinedIcon },
  {
    label: "Produtos",
    href: "/estoque",
    Icon: Inventory2OutlinedIcon,
    activePaths: ["/estoque", "/produtos"],
  },
  { label: "PDV", href: "/pdv", Icon: PointOfSaleOutlinedIcon },
  { label: "Financeiro", href: "/financeiro", Icon: BarChartOutlinedIcon },
  { label: "Caixa", href: "/caixa", Icon: ReceiptLongOutlinedIcon },
  { label: "Relatórios", href: "/relatorios", Icon: AssessmentOutlinedIcon },
  { label: "Usuários", href: "/usuarios", Icon: PeopleOutlinedIcon },
  { label: "Configurações", href: "/configuracoes", Icon: SettingsOutlinedIcon },
];

const FUNC_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/funcionario", Icon: HomeOutlinedIcon },
  { label: "Produtos", href: "/produtos", Icon: Inventory2OutlinedIcon },
  { label: "PDV", href: "/pdv", Icon: PointOfSaleOutlinedIcon },
  { label: "Caixa", href: "/caixa", Icon: ReceiptLongOutlinedIcon },
];

interface AppShellProps {
  title: string;
  children: React.ReactNode;
}

export default function AppShell({ title, children }: AppShellProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = user?.perfil === "ADMIN" ? ADMIN_NAV : FUNC_NAV;

  const isActive = (item: NavItem) => {
    const paths = item.activePaths ?? [item.href];
    return paths.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
  };

  const initials = user?.email?.charAt(0).toUpperCase() ?? "U";

  function handleLogout() {
    localStorage.clear();
    logout();
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>SIGECOM</div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.active : ""}`}
              >
                <item.Icon className={styles.navIcon} fontSize="small" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>{title}</h1>
          <div className={styles.topbarRight}>
            <button className={styles.iconBtn} title="Configurações">
              <SettingsOutlinedIcon sx={{ fontSize: 20, color: "#94a3b8" }} />
            </button>
            <button className={styles.iconBtn} title="Notificações">
              <NotificationsOutlinedIcon sx={{ fontSize: 20, color: "#94a3b8" }} />
            </button>

            <div className={styles.userMenuWrapper} ref={menuRef}>
              <button
                className={`${styles.avatar} ${menuOpen ? styles.avatarActive : ""}`}
                onClick={() => setMenuOpen((v) => !v)}
                title={user?.email}
              >
                {initials}
              </button>

              {menuOpen && (
                <div className={styles.userMenu}>
                  <div className={styles.userMenuHeader}>
                    <span className={styles.userMenuEmail}>{user?.email}</span>
                    <span className={styles.userMenuRole}>
                      {user?.perfil === "ADMIN" ? "Administrador" : "Funcionário"}
                    </span>
                  </div>
                  <div className={styles.userMenuDivider} />
                  <button className={styles.userMenuItem} onClick={handleLogout}>
                    <LogoutIcon sx={{ fontSize: 16 }} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
