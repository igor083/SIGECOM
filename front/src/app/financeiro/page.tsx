"use client";

// tela de despesas, so ADMIN entra
// todo o corpo vive em PaginaLancamentos, aqui so escolhemos o tipo
// a tela de receitas usa o mesmo componente com tipo="RECEITA"

import PaginaLancamentos from "@/components/PaginaLancamentos";

export default function FinanceiroPage() {
  return <PaginaLancamentos tipo="DESPESA" />;
}
