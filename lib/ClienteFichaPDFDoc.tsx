import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const GOLD = '#C9A84C'
const DARK = '#1C1C1C'
const MUTED = '#6B6B6B'
const LIGHT = '#F8F8F8'
const BORDER = '#F0EDE8'

const s = StyleSheet.create({
  page: { fontSize: 9, color: DARK, padding: 36, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  brand: { fontSize: 18, fontWeight: 700, color: GOLD },
  brandSub: { fontSize: 8, color: MUTED, letterSpacing: 3, marginTop: 2 },
  title: { fontSize: 14, fontWeight: 700, color: DARK },
  meta: { fontSize: 8, color: MUTED, marginTop: 2 },
  sectionTitle: { fontSize: 8, fontWeight: 600, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, marginTop: 14 },
  sectionLine: { height: 1, backgroundColor: GOLD, opacity: 0.3, marginBottom: 10 },
  infoBox: { backgroundColor: LIGHT, borderRadius: 6, padding: 12 },
  infoRow: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 90, fontSize: 8, color: MUTED },
  value: { flex: 1, fontSize: 8, color: DARK, fontWeight: 600 },
  card: { borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 10, marginBottom: 8 },
  cardTitle: { fontSize: 9, fontWeight: 700, color: DARK, marginBottom: 4 },
  text: { fontSize: 8, color: MUTED, marginBottom: 2 },
  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8, alignItems: 'center' },
  footerText: { fontSize: 7, color: MUTED },
})

function fmt(v: number) {
  const fixed = v.toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `R$ ${intFormatted},${decPart}`
}

type OrcamentoFicha = {
  numero: number
  status: string
  createdAt: string
  precoFinalTotal: number | null
  vendedorNome: string
  ambientes: { nomeAmbiente: string; modeloCortina: string; instaladorNome?: string | null }[]
  origemHistorico?: boolean
  servicoHistorico?: string | null
  descricaoHistorico?: string | null
  instaladorHistoricoNome?: string | null
  indicacaoHistorica?: string | null
}

type ClienteFicha = {
  nome: string
  telefone?: string | null
  email?: string | null
  endereco?: string | null
  arquiteto?: string | null
  createdAt: string
  orcamentos: OrcamentoFicha[]
}

export default function ClienteFichaPDFDoc({ cliente }: { cliente: ClienteFicha }) {
  const dataGeracao = new Date().toLocaleDateString('pt-BR')

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>Casa Estampa</Text>
            <Text style={s.brandSub}>INTERIORES</Text>
          </View>
          <View>
            <Text style={s.title}>Ficha do Cliente</Text>
            <Text style={s.meta}>Gerado em: {dataGeracao}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Dados cadastrais</Text>
        <View style={s.sectionLine} />
        <View style={s.infoBox}>
          <View style={s.infoRow}><Text style={s.label}>Nome:</Text><Text style={s.value}>{cliente.nome}</Text></View>
          {cliente.telefone && <View style={s.infoRow}><Text style={s.label}>Telefone:</Text><Text style={s.value}>{cliente.telefone}</Text></View>}
          {cliente.email && <View style={s.infoRow}><Text style={s.label}>Email:</Text><Text style={s.value}>{cliente.email}</Text></View>}
          {cliente.endereco && <View style={s.infoRow}><Text style={s.label}>Endereço:</Text><Text style={s.value}>{cliente.endereco}</Text></View>}
          {cliente.arquiteto && <View style={s.infoRow}><Text style={s.label}>Arquiteto / RT:</Text><Text style={s.value}>{cliente.arquiteto}</Text></View>}
          <View style={s.infoRow}><Text style={s.label}>Cliente desde:</Text><Text style={s.value}>{new Date(cliente.createdAt).toLocaleDateString('pt-BR')}</Text></View>
        </View>

        <Text style={s.sectionTitle}>Histórico de orçamentos</Text>
        <View style={s.sectionLine} />
        {cliente.orcamentos.length === 0 ? (
          <Text style={s.text}>Nenhum orçamento encontrado.</Text>
        ) : (
          cliente.orcamentos.map((orcamento, index) => (
            <View key={index} style={s.card} wrap={false}>
              <Text style={s.cardTitle}>
                {orcamento.origemHistorico ? 'Atendimento (histórico)' : `Orçamento #${String(orcamento.numero).padStart(4, '0')}`}
              </Text>
              <Text style={s.text}>Data: {new Date(orcamento.createdAt).toLocaleDateString('pt-BR')}</Text>
              {!orcamento.origemHistorico && <Text style={s.text}>Status: {orcamento.status.replace(/_/g, ' ')}</Text>}
              <Text style={s.text}>Vendedor: {orcamento.vendedorNome}</Text>
              <Text style={s.text}>Valor: {orcamento.precoFinalTotal != null ? fmt(orcamento.precoFinalTotal) : '—'}</Text>
              {orcamento.origemHistorico ? (
                <>
                  {orcamento.servicoHistorico && <Text style={s.text}>Serviço: {orcamento.servicoHistorico}</Text>}
                  {orcamento.descricaoHistorico && <Text style={s.text}>Descrição: {orcamento.descricaoHistorico}</Text>}
                  {orcamento.instaladorHistoricoNome && <Text style={s.text}>Instalador: {orcamento.instaladorHistoricoNome}</Text>}
                  {orcamento.indicacaoHistorica && <Text style={s.text}>Indicação: {orcamento.indicacaoHistorica}</Text>}
                </>
              ) : (
                orcamento.ambientes.map((ambiente, ambienteIndex) => (
                  <Text key={ambienteIndex} style={s.text}>
                    • {ambiente.nomeAmbiente} — {ambiente.modeloCortina.replace(/_/g, ' ')}{ambiente.instaladorNome ? ` — Instalador: ${ambiente.instaladorNome}` : ''}
                  </Text>
                ))
              )}
            </View>
          ))
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Casa Estampa Interiores · Ficha do cliente</Text>
        </View>
      </Page>
    </Document>
  )
}
