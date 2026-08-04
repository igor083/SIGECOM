import ExcelJS from "exceljs";
import { listarVendas, type VendaResumoResponse } from "@/services/vendas";
import type { RelatorioVendas, TipoPagamento } from "@/services/relatorios";

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
  sucesso: "FF16A34A",
};

const PGTO_ROTULO: Record<TipoPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "Pix",
  DEBITO: "Débito",
  CREDITO: "Crédito",
};

function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
}

function partesDataHora(iso: string): [string, string] {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return [iso, ""];
  return [
    dt.toLocaleDateString("pt-BR"),
    dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  ];
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

async function buscarTodasVendas(
  dataInicio: string,
  dataFim: string,
  funcionarioId: number | null,
): Promise<VendaResumoResponse[]> {
  const tamanho = 500;
  const todas: VendaResumoResponse[] = [];
  let pagina = 0;
  while (true) {
    const resp = await listarVendas({
      page: pagina,
      size: tamanho,
      dataInicio,
      dataFim,
      funcionarioId,
    });
    todas.push(...resp.content);
    if (resp.content.length === 0 || pagina >= resp.totalPages - 1) break;
    pagina += 1;
  }
  return todas;
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

export interface ExportarXlsxParams {
  relatorio: RelatorioVendas;
  funcionarioId: number | null;
  funcionarioNome: string | null;
  periodoLabel: string;
}

export async function exportarRelatorioXlsx({
  relatorio,
  funcionarioId,
  funcionarioNome,
  periodoLabel,
}: ExportarXlsxParams): Promise<void> {
  const vendas = await buscarTodasVendas(relatorio.dataInicio, relatorio.dataFim, funcionarioId);

  const wb = new ExcelJS.Workbook();
  wb.creator = "SIGECOM";
  wb.created = new Date();

  montarResumo(wb, relatorio, periodoLabel, funcionarioNome);
  montarPorDia(wb, relatorio);
  montarPorForma(wb, relatorio);
  montarDetalhado(wb, vendas);

  const buffer = await wb.xlsx.writeBuffer();
  const sufFunc = funcionarioNome ? `_${slug(funcionarioNome)}` : "";
  baixar(buffer, `relatorio-vendas_${relatorio.dataInicio}_a_${relatorio.dataFim}${sufFunc}.xlsx`);
}

function montarResumo(
  wb: ExcelJS.Workbook,
  relatorio: RelatorioVendas,
  periodoLabel: string,
  funcionarioNome: string | null,
) {
  const ws = wb.addWorksheet("Resumo", { properties: { defaultColWidth: 18 } });
  ws.getColumn(1).width = 20;
  ws.getColumn(2).width = 32;

  ws.mergeCells("A1:B1");
  const titulo = ws.getCell("A1");
  titulo.value = "Relatório de Vendas";
  titulo.font = { bold: true, size: 16, color: { argb: COR.primariaEscura } };
  titulo.alignment = { vertical: "middle" };
  ws.getRow(1).height = 26;

  const meta: [string, string][] = [
    ["Período", periodoLabel],
    ["Intervalo", `${dataBr(relatorio.dataInicio)} a ${dataBr(relatorio.dataFim)}`],
    ["Funcionário", funcionarioNome ?? "Todos"],
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
    ["Total de vendas", relatorio.totalVendas, true],
    ["Transações", relatorio.quantidadeTransacoes, false],
    ["Ticket médio", relatorio.ticketMedio, true],
  ];
  kpis.forEach(([rotulo, valor, moeda]) => {
    const row = ws.addRow([rotulo, valor]);
    row.getCell(1).font = { bold: true, color: { argb: COR.texto } };
    row.getCell(1).border = bordaFina();
    const celValor = row.getCell(2);
    celValor.font = { bold: true, color: { argb: COR.primariaEscura } };
    celValor.border = bordaFina();
    preencher(celValor, COR.destaque);
    if (moeda) celValor.numFmt = MOEDA;
  });
}

function montarPorDia(wb: ExcelJS.Workbook, relatorio: RelatorioVendas) {
  const ws = wb.addWorksheet("Vendas por dia");
  ws.columns = [
    { header: "Data", width: 14 },
    { header: "Qtd vendas", width: 14 },
    { header: "Total", width: 18 },
  ];
  estilizarCabecalho(ws.getRow(1));

  const porDia = relatorio.vendasPorDia ?? [];
  porDia.forEach((d) => ws.addRow([dataBr(d.data), d.quantidade, d.total]));
  const primeira = 2;
  const ultima = porDia.length + 1;
  if (porDia.length > 0) zebrarECercar(ws, primeira, ultima, [3]);

  const totalRow = ws.addRow([
    "Total",
    porDia.reduce((s, d) => s + d.quantidade, 0),
    porDia.reduce((s, d) => s + d.total, 0),
  ]);
  totalRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COR.texto } };
    cell.border = bordaFina();
    preencher(cell, COR.destaque);
  });
  totalRow.getCell(3).numFmt = MOEDA;
}

function montarPorForma(wb: ExcelJS.Workbook, relatorio: RelatorioVendas) {
  const ws = wb.addWorksheet("Formas de pagamento");
  ws.columns = [
    { header: "Forma de pagamento", width: 20 },
    { header: "Qtd vendas", width: 14 },
    { header: "Total", width: 18 },
    { header: "% do total", width: 12 },
  ];
  estilizarCabecalho(ws.getRow(1));

  const porForma = relatorio.vendasPorFormaPagamento ?? [];
  const total = porForma.reduce((s, f) => s + f.total, 0);
  porForma.forEach((f) =>
    ws.addRow([
      PGTO_ROTULO[f.tipoPagamento] ?? f.tipoPagamento,
      f.quantidade,
      f.total,
      total > 0 ? Number(((f.total / total) * 100).toFixed(1)) : 0,
    ]),
  );
  if (porForma.length > 0) zebrarECercar(ws, 2, porForma.length + 1, [3], [4]);
}

function montarDetalhado(wb: ExcelJS.Workbook, vendas: VendaResumoResponse[]) {
  const ws = wb.addWorksheet("Vendas (detalhado)", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = [
    { header: "ID", width: 8 },
    { header: "Data", width: 12 },
    { header: "Hora", width: 8 },
    { header: "Funcionário", width: 24 },
    { header: "Forma de pagamento", width: 18 },
    { header: "Qtd itens", width: 10 },
    { header: "Subtotal", width: 14 },
    { header: "Desconto", width: 12 },
    { header: "Total", width: 14 },
  ];
  estilizarCabecalho(ws.getRow(1));

  vendas.forEach((v) => {
    const [data, hora] = partesDataHora(v.dataHora);
    ws.addRow([
      v.id,
      data,
      hora,
      v.operador,
      PGTO_ROTULO[v.tipoPagamento] ?? v.tipoPagamento,
      v.qtdItens,
      v.subtotal,
      v.descontoTotal,
      v.total,
    ]);
  });

  if (vendas.length > 0) zebrarECercar(ws, 2, vendas.length + 1, [7, 8, 9]);
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 9 } };
}
