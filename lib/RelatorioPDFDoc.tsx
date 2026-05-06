import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import React from "react"

const GOLD = "#C9A84C"
const DARK = "#1C1C1C"
const MUTED = "#6B6B6B"
const LIGHT = "#F8F8F8"
const BORDER = "#F0EDE8"

const s = StyleSheet.create({
  page: { fontSize: 9, color: DARK, padding: 40, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  logoNome: { fontSize: 18, fontWeight: 700, color: GOLD },
  logoSub: { fontSize: 8, color: MUTED, letterSpacing: 3, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  titulo: { fontSize: 13, fontWeight: 700, color: DARK },
  meta: { fontSize: 8, color: MUTED, marginTop: 2 },
  sectionTitle: { fontSize: 8, fontWeight: 600, color: GOLD, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, marginTop: 16 },
  sectionLine: { height: 1, backgroundColor: GOLD, opacity: 0.3, marginBottom: 10 },
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  kpiBox: { flex: 1, backgroundColor: LIGHT, borderRadius: 6, padding: 10 },
  kpiLabel: { fontSize: 7, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  kpiValue: { fontSize: 14, fontWeight: 700, color: DARK },
  tableHeader: { flexDirection: "row", backgroundColor: LIGHT, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 4, marginBottom: 2 },
  tableRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, alignItems: "center", borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8 },
  footerText: { fontSize: 7, color: MUTED },
})

function fmt(v: number) {
  const fixed = v.toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `R$ ${intFormatted},${decPart}`
}

type Props = {
  periodo: string
  faturamentoTotal: number
  totalOrcamentos: number
  fechados: number
  conversao: number
  rankingVendedores: { nome: string; orcamentos: number; fechados: number; faturamento: number; comissao: number; taxaAprovacao: number }[]
  orcamentos: { numero: number; cliente: string; vendedor: string; status: string; valor: number; data: string }[]
}

export default function RelatorioPDFDoc(props: Props) {
  const dataGeracao = new Date().toLocaleDateString("pt-BR")
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.logoNome}>Casa Estampa</Text>
            <Text style={s.logoSub}>INTERIORES</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.titulo}>Relatorio Executivo</Text>
            <Text style={s.meta}>Periodo: {props.periodo}</Text>
            <Text style={s.meta}>Gerado em: {dataGeracao}</Text>
          </View>
        </View>
        <View style={s.kpiRow}>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>Faturamento</Text><Text style={s.kpiValue}>{fmt(props.faturamentoTotal)}</Text></View>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>Orcamentos</Text><Text style={s.kpiValue}>{props.totalOrcamentos}</Text></View>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>Fechados</Text><Text style={s.kpiValue}>{props.fechados}</Text></View>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>Conversao</Text><Text style={s.kpiValue}>{props.conversao}%</Text></View>
        </View>
        <Text style={s.sectionTitle}>Ranking de Vendedores</Text>
        <View style={s.sectionLine} />
        <View style={s.tableHeader}>
          <Text style={{ width: "35%", fontSize: 7, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>Vendedor</Text>
          <Text style={{ width: "13%", fontSize: 7, fontWeight: 600, color: MUTED, textTransform: "uppercase", textAlign: "center" }}>Orcamentos</Text>
          <Text style={{ width: "13%", fontSize: 7, fontWeight: 600, color: MUTED, textTransform: "uppercase", textAlign: "center" }}>Fechados</Text>
          <Text style={{ width: "20%", fontSize: 7, fontWeight: 600, color: MUTED, textTransform: "uppercase", textAlign: "right" }}>Faturamento</Text>
          <Text style={{ width: "19%", fontSize: 7, fontWeight: 600, color: MUTED, textTransform: "uppercase", textAlign: "right" }}>Comissao</Text>
        </View>
        {props.rankingVendedores.map((v, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={{ width: "35%", fontSize: 8, fontWeight: 600, color: DARK }}>{v.nome}</Text>
            <Text style={{ width: "13%", fontSize: 8, color: DARK, textAlign: "center" }}>{v.orcamentos}</Text>
            <Text style={{ width: "13%", fontSize: 8, color: DARK, textAlign: "center" }}>{v.fechados}</Text>
            <Text style={{ width: "20%", fontSize: 8, fontWeight: 600, color: DARK, textAlign: "right" }}>{fmt(v.faturamento)}</Text>
            <Text style={{ width: "19%", fontSize: 8, color: "#22C55E", textAlign: "right" }}>{fmt(v.comissao)}</Text>
          </View>
        ))}
        <Text style={[s.sectionTitle, { marginTop: 20 }]}>Orcamentos do Periodo</Text>
        <View style={s.sectionLine} />
        <View style={s.tableHeader}>
          <Text style={{ width: "8%", fontSize: 7, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>N</Text>
          <Text style={{ width: "22%", fontSize: 7, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>Cliente</Text>
          <Text style={{ width: "18%", fontSize: 7, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>Vendedor</Text>
          <Text style={{ width: "18%", fontSize: 7, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>Status</Text>
          <Text style={{ width: "18%", fontSize: 7, fontWeight: 600, color: MUTED, textTransform: "uppercase", textAlign: "right" }}>Valor</Text>
          <Text style={{ width: "16%", fontSize: 7, fontWeight: 600, color: MUTED, textTransform: "uppercase", textAlign: "right" }}>Data</Text>
        </View>
        {props.orcamentos.slice(0, 40).map((o, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={{ width: "8%", fontSize: 8, fontWeight: 600, color: GOLD }}>#{String(o.numero).padStart(4, "0")}</Text>
            <Text style={{ width: "22%", fontSize: 8, color: DARK }}>{o.cliente}</Text>
            <Text style={{ width: "18%", fontSize: 8, color: MUTED }}>{o.vendedor}</Text>
            <Text style={{ width: "18%", fontSize: 8, color: MUTED }}>{o.status.replace(/_/g, " ")}</Text>
            <Text style={{ width: "18%", fontSize: 8, fontWeight: 600, color: DARK, textAlign: "right" }}>{fmt(o.valor)}</Text>
            <Text style={{ width: "16%", fontSize: 8, color: MUTED, textAlign: "right" }}>{o.data}</Text>
          </View>
        ))}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Casa Estampa Interiores - Relatorio Confidencial - Gerado em {dataGeracao}</Text>
        </View>
      </Page>
    </Document>
  )
}
