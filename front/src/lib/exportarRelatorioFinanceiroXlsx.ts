import ExcelJS from "exceljs";
import type { RelatorioFinanceiro } from "@/services/relatorios";

const MOEDA = "R$ #,##0.00";
const PERCENTUAL = '0.0"%"';

const COR = {
  primaria: "FF2563EB",
  primariaEscura: "FF1D4ED8",
  textoCabecalho: "FFFFFFFF",
  texto: "FF0F172A",
  textoSuave: "FF475569",
  borda: "FFE2E8F0",
  zebra: "FFF8FAFC",
  destaque: "FFEFF6FF",
  saldoNegativo: "FFDC2626",
};

function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
}

function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function bordaFina(cor = COR.borda): Partial<ExcelJS.Borders> {
  const lado = { style: "thin" as const, color: { argb: cor } };
  return { top: lado, left: lado, bottom: lado, right: lado };
}

function preencher(cell: ExcelJS.Cell, argb: string) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function estilizarCabecalho(row: ExcelJS.Row) {
  row.height = 20;
  row.eachCell((cell) => {
    preencher(cell, COR.primaria);
    cell.font = { bold: true, color: { argb: COR.textoCabecalho }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = bordaFina(COR.primaria);
  });
}

function zebrarECercar(
  ws: ExcelJS.Worksheet,
  primeiraLinha: number,
  ultimaLinha: number,
  colunasMoeda: number[],
  colunasPct: number[] = [],
) {
  for (let r = primeiraLinha; r <= ultimaLinha; r += 1) {
    const row = ws.getRow(r);
    const par = (r - primeiraLinha) % 2 === 1;
    row.eachCell((cell) => {
      if (par) preencher(cell, COR.zebra);
      cell.border = bordaFina();
      cell.font = { color: { argb: COR.texto }, size: 11 };
      cell.alignment = { vertical: "middle" };
    });
    colunasMoeda.forEach((c) => (row.getCell(c).numFmt = MOEDA));
    colunasPct.forEach((c) => (row.getCell(c).numFmt = PERCENTUAL));
  }
}

function baixar(buffer: ArrayBuffer, nome: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ExportarFinanceiroXlsxParams {
  relatorio: RelatorioFinanceiro;
  categoriaNome: string | null;
  periodoLabel: string;
}

export async function exportarRelatorioFinanceiroXlsx({
  relatorio,
  categoriaNome,
  periodoLabel,
}: ExportarFinanceiroXlsxParams): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIGECOM";
  wb.created = new Date();

  montarResumo(wb, relatorio, periodoLabel, categoriaNome);
  montarPorCategoria(wb, relatorio);

  const buffer = await wb.xlsx.writeBuffer();
  const sufCat = categoriaNome ? `_${slug(categoriaNome)}` : "";
  baixar(
    buffer,
    `relatorio-financeiro_${relatorio.dataInicio}_a_${relatorio.dataFim}${sufCat}.xlsx`,
  );
}

function montarResumo(
  wb: ExcelJS.Workbook,
  relatorio: RelatorioFinanceiro,
  periodoLabel: string,
  categoriaNome: string | null,
) {
  const ws = wb.addWorksheet("Resumo", { properties: { defaultColWidth: 18 } });
  ws.getColumn(1).width = 24;
  ws.getColumn(2).width = 32;

  ws.mergeCells("A1:B1");
  const titulo = ws.getCell("A1");
  titulo.value = "Relatório Financeiro";
  titulo.font = { bold: true, size: 16, color: { argb: COR.primariaEscura } };
  titulo.alignment = { vertical: "middle" };
  ws.getRow(1).height = 26;

  const meta: [string, string][] = [
    ["Período", periodoLabel],
    ["Intervalo", `${dataBr(relatorio.dataInicio)} a ${dataBr(relatorio.dataFim)}`],
    ["Categoria", categoriaNome ?? "Todas"],
    ["Emitido em", new Date().toLocaleString("pt-BR")],
  ];
  meta.forEach(([rotulo, valor]) => {
    const row = ws.addRow([rotulo, valor]);
    row.getCell(1).font = { bold: true, color: { argb: COR.textoSuave } };
    row.getCell(2).font = { color: { argb: COR.texto } };
  });

  ws.addRow([]);
  estilizarCabecalho(ws.addRow(["Indicador", "Valor"]));

  const kpis: [string, number, boolean][] = [
    ["Total de receitas", relatorio.totalReceitas, true],
    ["Total de despesas", relatorio.totalDespesas, true],
    ["Saldo", relatorio.saldo, true],
  ];

  kpis.forEach(([rotulo, valor, moeda]) => {
    const row = ws.addRow([rotulo, valor]);
    row.getCell(1).font = { bold: true, color: { argb: COR.texto } };
    row.getCell(1).border = bordaFina();
    const celValor = row.getCell(2);
    celValor.border = bordaFina();
    preencher(celValor, COR.destaque);
    if (moeda) celValor.numFmt = MOEDA;

    // saldo negativo em vermelho — tão visível na planilha quanto na tela
    if (rotulo === "Saldo" && relatorio.saldo < 0) {
      celValor.font = { bold: true, color: { argb: COR.saldoNegativo } };
    } else {
      celValor.font = { bold: true, color: { argb: COR.primariaEscura } };
    }
  });
}

const TIPO_ROTULO: Record<string, string> = {
  RECEITA: "Receita",
  DESPESA: "Despesa",
};

function montarPorCategoria(wb: ExcelJS.Workbook, relatorio: RelatorioFinanceiro) {
  const ws = wb.addWorksheet("Por categoria");
  ws.columns = [
    { header: "Categoria", width: 28 },
    { header: "Tipo", width: 12 },
    { header: "Total", width: 18 },
    { header: "% do tipo", width: 12 },
  ];
  estilizarCabecalho(ws.getRow(1));

  // receitas primeiro, depois despesas; dentro de cada grupo, total decrescente
  const ordenadas = [...relatorio.porCategoria].sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === "RECEITA" ? -1 : 1;
    return b.total - a.total;
  });

  const totalReceitas = relatorio.totalReceitas || 0;
  const totalDespesas = relatorio.totalDespesas || 0;

  ordenadas.forEach((cat) => {
    const base = cat.tipo === "RECEITA" ? totalReceitas : totalDespesas;
    const pct = base > 0 ? Number(((cat.total / base) * 100).toFixed(1)) : 0;
    ws.addRow([TIPO_ROTULO[cat.tipo] ? cat.categoriaNome : cat.categoriaNome, TIPO_ROTULO[cat.tipo] ?? cat.tipo, cat.total, pct]);
  });

  if (ordenadas.length > 0) zebrarECercar(ws, 2, ordenadas.length + 1, [3], [4]);

  // linha de total ao final
  const totalGeral = relatorio.totalReceitas + relatorio.totalDespesas;
  const totalRow = ws.addRow(["Total", "", totalGeral, ""]);
  totalRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COR.texto } };
    cell.border = bordaFina();
    preencher(cell, COR.destaque);
  });
  totalRow.getCell(3).numFmt = MOEDA;
}
