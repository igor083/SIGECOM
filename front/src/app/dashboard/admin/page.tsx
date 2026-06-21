// =============================================================
// app/dashboard/admin/page.tsx — Dashboard Admin (US-006)
// =============================================================
// Layout Figma: 2 colunas.
// Esquerda: Vendas da Semana (barras) + Faturamento Mensal (área)
// Direita:  Últimas Vendas (lista) + Despesas por Categoria (pizza)
// =============================================================

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import Sidebar, { type SidebarItem } from "@/components/Sidebar";
import styles from "../dashboard.module.css";

// ── Menu Admin (completo) ───────────────────────────────────

const ADMIN_MENU: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/admin",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4",
  },
  {
    label: "Produtos",
    href: "/produtos",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    label: "PDV",
    href: "/pdv",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    label: "Caixa",
    href: "/caixa",
    icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    label: "Usuários",
    href: "/usuarios",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  },
];

// ── Dados mockados ──────────────────────────────────────────
// TODO: substituir por api.get() quando backend tiver endpoints

const vendasSemana = [
  { dia: "Dom", vendas: 320, devolucoes: 50 },
  { dia: "Seg", vendas: 450, devolucoes: 80 },
  { dia: "Ter", vendas: 280, devolucoes: 60 },
  { dia: "Qua", vendas: 520, devolucoes: 40 },
  { dia: "Qui", vendas: 380, devolucoes: 90 },
  { dia: "Sex", vendas: 490, devolucoes: 70 },
  { dia: "Sáb", vendas: 350, devolucoes: 55 },
];

const faturamentoMensal = [
  { mes: "Jul", valor: 320 },
  { mes: "Ago", valor: 580 },
  { mes: "Set", valor: 450 },
  { mes: "Out", valor: 620 },
  { mes: "Nov", valor: 380 },
  { mes: "Dez", valor: 520 },
  { mes: "Jan", valor: 410 },
];

const ultimasVendas = [
  { id: 1042, data: "12 Junho 2026", valor: 150.0, cor: "#f59e0b" },
  { id: 1041, data: "10 Junho 2026", valor: 250.0, cor: "#3b82f6" },
  { id: 1040, data: "06 Junho 2026", valor: 93.0, cor: "#10b981" },
];

const despesasCategoria = [
  { nome: "Fornecedores", valor: 40, cor: "#7c3aed" },
  { nome: "Aluguel", valor: 20, cor: "#06b6d4" },
  { nome: "Funcionários", valor: 25, cor: "#f97316" },
  { nome: "Impostos", valor: 15, cor: "#eab308" },
];

// ── Helpers ─────────────────────────────────────────────────

function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ── Header icons (reutilizável) ─────────────────────────────

function HeaderIcons() {
  return (
    <div className={styles.headerIcons}>
      <button className={styles.iconBtn} title="Configurações">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>
      <button className={styles.iconBtn} title="Notificações">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      </button>
      <div className={styles.logoIcon}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
          <circle cx="12" cy="12" r="10" fill="#3b82f6" opacity="0.2" />
          <path d="M8 12l3 3 5-6" stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ── Componente ──────────────────────────────────────────────

export default function DashboardAdminPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

   useEffect(() => {
     if (!loading && (!isAuthenticated || user?.perfil !== "ADMIN")) {
       router.replace("/login");
     }
   }, [loading, isAuthenticated, user, router]);

   if (loading || !user || user.perfil !== "ADMIN") {
     return (
       <div className={styles.loadingWrapper}>
         <p>Carregando...</p>
       </div>
     );
   }

  return (
    <div className={styles.layout}>
      <Sidebar items={ADMIN_MENU} />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Painel Administrativo</h1>
          <HeaderIcons />
        </header>

        <div className={styles.grid}>
          {/* Coluna esquerda */}
          <div className={styles.colLeft}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Vendas da Semana</h2>
                <div className={styles.legendInline}>
                  <span className={styles.legendDot} style={{ background: "#2b3990" }} />
                  <span className={styles.legendLabel}>Vendas</span>
                  <span className={styles.legendDot} style={{ background: "#20c997" }} />
                  <span className={styles.legendLabel}>Devoluções</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={vendasSemana} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="vendas" fill="#2b3990" radius={[3, 3, 0, 0]} barSize={14} />
                  <Bar dataKey="devolucoes" fill="#20c997" radius={[3, 3, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Faturamento Mensal</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={faturamentoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => formatBRL(Number(v))} />
                  <defs>
                    <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2b3990" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2b3990" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="valor" stroke="#2b3990" strokeWidth={2} fill="url(#gradFat)" dot={{ r: 3, fill: "#2b3990" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Coluna direita */}
          <div className={styles.colRight}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Últimas Vendas</h2>
              <div className={styles.vendaList}>
                {ultimasVendas.map((v) => (
                  <div key={v.id} className={styles.vendaItem}>
                    <div className={styles.vendaDot} style={{ background: v.cor }} />
                    <div className={styles.vendaInfo}>
                      <span className={styles.vendaId}>Venda #{v.id}</span>
                      <span className={styles.vendaData}>{v.data}</span>
                    </div>
                    <span className={styles.vendaValor}>{formatBRL(v.valor)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Despesas por Categoria</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={despesasCategoria}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="45%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {despesasCategoria.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatBRL(Number(v))} />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string, entry: { payload?: { valor?: number } }) => {
                      const item = despesasCategoria.find((d) => d.nome === value);
                      return `${item?.valor ?? ""}% ${value}`;
                    }}
                    wrapperStyle={{ fontSize: "0.72rem" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}