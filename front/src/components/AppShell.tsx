"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
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
  href?: string;            // ausente quando o item e um grupo (so abre o submenu)
  Icon: SvgIconComponent;
  activePaths?: string[];
  // exact: so fica ativo na rota exata. Necessario para /financeiro (Despesas)
  // nao acender junto com a rota filha /financeiro/receitas.
  exact?: boolean;
  // children: submenu recolhivel. Ex.: Financeiro > Receitas / Despesas.
  children?: NavItem[];
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
  {
    label: "Financeiro",
    Icon: BarChartOutlinedIcon,
    children: [
      { label: "Receitas", href: "/financeiro/receitas", Icon: TrendingUpOutlinedIcon },
      { label: "Despesas", href: "/financeiro", Icon: TrendingDownOutlinedIcon, exact: true },
    ],
  },
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

  // grupos recolhidos/expandidos do menu (ex.: Financeiro)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const isActive = (item: NavItem) => {
    const paths = item.activePaths ?? (item.href ? [item.href] : []);
    if (item.exact) return paths.some((p) => pathname === p);
    return paths.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
  };

  const isGroupActive = (item: NavItem) => item.children?.some(isActive) ?? false;

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
            // grupo com submenu (ex.: Financeiro > Receitas / Despesas)
            if (item.children) {
              const grupoAtivo = isGroupActive(item);
              const aberto = openGroups[item.label] ?? grupoAtivo;
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    className={`${styles.navItem} ${styles.navGroupToggle} ${grupoAtivo ? styles.active : ""}`}
                    onClick={() => toggleGroup(item.label)}
                    aria-expanded={aberto}
                  >
                    <item.Icon className={styles.navIcon} fontSize="small" />
                    <span>{item.label}</span>
                    <ExpandMoreOutlinedIcon
                      className={styles.navChevron}
                      style={{ transform: aberto ? "rotate(180deg)" : "none" }}
                    />
                  </button>

                  {aberto && (
                    <div className={styles.subNav}>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href!}
                          className={`${styles.navItem} ${styles.subNavItem} ${isActive(child) ? styles.active : ""}`}
                        >
                          <child.Icon className={styles.navIcon} fontSize="small" />
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href!}
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
