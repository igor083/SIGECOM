"use client";

// US-018 (SCRUM-21): registro de receitas, so ADMIN entra
// reaproveita PaginaLancamentos com tipo="RECEITA" — mesmo form, hook e saldo
// da tela de despesas; a receita registrada reflete no saldo operacional na hora.

import PaginaLancamentos from "@/components/PaginaLancamentos";

export default function ReceitasPage() {
  return <PaginaLancamentos tipo="RECEITA" />;
}
