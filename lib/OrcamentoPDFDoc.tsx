import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrJJfecg.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2', fontWeight: 700 },
  ],
})

const GOLD = '#C9A84C'
const DARK = '#1C1C1C'
const MUTED = '#6B6B6B'
const LIGHT_BG = '#F8F8F8'
const BORDER = '#F0EDE8'

const s = StyleSheet.create({
  page: { fontFamily: 'Poppins', fontSize: 9, color: DARK, padding: 40, backgroundColor: '#FFFFFF' },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  logoArea: { flexDirection: 'column' },
  logoNome: { fontSize: 18, fontWeight: 700, color: GOLD, letterSpacing: 1 },
  logoSub: { fontSize: 8, color: MUTED, letterSpacing: 3, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  orcNumero: { fontSize: 13, fontWeight: 700, color: DARK },
  orcMeta: { fontSize: 8, color: MUTED, marginTop: 2 },
  // Section title
  sectionTitle: { fontSize: 8, fontWeight: 600, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, marginTop: 16 },
  sectionLine: { height: 1, backgroundColor: GOLD, opacity: 0.3, marginBottom: 10 },
  // Cliente
  clienteBox: { backgroundColor: LIGHT_BG, borderRadius: 6, padding: 12, marginBottom: 4 },
  clienteRow: { flexDirection: 'row', marginBottom: 3 },
  clienteLabel: { fontSize: 8, color: MUTED, width: 80 },
  clienteValue: { fontSize: 8, color: DARK, fontWeight: 600, flex: 1 },
  // Ambiente
  ambienteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginTop: 12 },
  ambienteNome: { fontSize: 10, fontWeight: 700, color: GOLD },
  // Tabela
  tableHeader: { flexDirection: 'row', backgroundColor: LIGHT_BG, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 4, marginBottom: 2 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  colItem: { width: '30%', fontSize: 8, fontWeight: 600, color: DARK },
  colDesc: { width: '45%', fontSize: 8, color: MUTED },
  colQtd: { width: '10%', fontSize: 8, color: DARK, textAlign: 'center' },
  colValor: { width: '15%', fontSize: 8, color: DARK, textAlign: 'right' },
  colItemH: { width: '30%', fontSize: 7, fontWeight: 600, color: MUTED, textTransform: 'uppercase' },
  colDescH: { width: '45%', fontSize: 7, fontWeight: 600, color: MUTED, textTransform: 'uppercase' },
  colQtdH: { width: '10%', fontSize: 7, fontWeight: 600, color: MUTED, textTransform: 'uppercase', textAlign: 'center' },
  colValorH: { width: '15%', fontSize: 7, fontWeight: 600, color: MUTED, textTransform: 'uppercase', textAlign: 'right' },
  ambienteTotal: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: BORDER },
  ambienteTotalLabel: { fontSize: 9, color: MUTED, marginRight: 8 },
  ambienteTotalValue: { fontSize: 11, fontWeight: 700, color: DARK },
  // Total geral
  totalBox: { marginTop: 20, paddingTop: 16, borderTopWidth: 2, borderTopColor: GOLD, alignItems: 'center' },
  totalLabel: { fontSize: 9, color: MUTED, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  totalValue: { fontSize: 22, fontWeight: 700, color: DARK },
  totalParc: { fontSize: 8, color: MUTED, marginTop: 4 },
  // Condições
  condicoesBox: { marginTop: 16, padding: 12, backgroundColor: LIGHT_BG, borderRadius: 6 },
  condicoesText: { fontSize: 8, color: MUTED, lineHeight: 1.6 },
  // Assinatura
  assinaturaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 },
  assinaturaBox: { width: '45%', alignItems: 'center' },
  assinaturaLinha: { width: '100%', height: 1, backgroundColor: DARK, marginBottom: 4 },
  assinaturaLabel: { fontSize: 8, color: MUTED },
  // Rodapé
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8 },
  footerText: { fontSize: 7, color: MUTED },
})

function fmt(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export type AmbientePDF = {
  nomeAmbiente: string
  tecidoNome: string
  quantidadeTecido: number
  blackoutNome?: string | null
  quantidadeBlackout?: number | null
  trilhoAcessoriosValor?: number | null
  instalacao: boolean
  outrosValor?: number | null
  precoFinalVenda: number
}

export type OrcamentoPDF = {
  numero: number
  createdAt: Date | string
  vendedorNome: string
  clienteNome?: string | null
  clienteTelefone?: string | null
  clienteEmail?: string | null
  clienteEndereco?: string | null
  clienteArquiteto?: string | null
  ambientes: AmbientePDF[]
  precoFinalTotal: number
  condicoesComerciais?: string
  telefoneEmpresa?: string
}

export default function OrcamentoPDFDoc({ orc }: { orc: OrcamentoPDF }) {
  const dataGeracao = new Date().toLocaleDateString('pt-BR')
  const dataOrc = new Date(orc.createdAt).toLocaleDateString('pt-BR')
  const condicoes = orc.condicoesComerciais ||
    'Este orçamento tem validade de 15 dias a partir da data de emissão. Os preços estão sujeitos a alteração sem aviso prévio. O prazo de entrega será confirmado no momento da aprovação. Forma de pagamento: entrada + saldo na entrega ou parcelamento conforme negociação.'
  const telefone = orc.telefoneEmpresa || ''

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Cabeçalho */}
        <View style={s.header}>
          <View style={s.logoArea}>
            <Text style={s.logoNome}>Casa Estampa</Text>
            <Text style={s.logoSub}>INTERIORES</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.orcNumero}>Orçamento #{String(orc.numero).padStart(4, '0')}</Text>
            <Text style={s.orcMeta}>Emitido em: {dataGeracao}</Text>
            <Text style={s.orcMeta}>Data: {dataOrc}</Text>
            <Text style={s.orcMeta}>Vendedor: {orc.vendedorNome}</Text>
          </View>
        </View>

        {/* Dados do cliente */}
        {orc.clienteNome && (
          <>
            <Text style={s.sectionTitle}>Dados do Cliente</Text>
            <View style={s.sectionLine} />
            <View style={s.clienteBox}>
              {orc.clienteNome && <View style={s.clienteRow}><Text style={s.clienteLabel}>Nome:</Text><Text style={s.clienteValue}>{orc.clienteNome}</Text></View>}
              {orc.clienteTelefone && <View style={s.clienteRow}><Text style={s.clienteLabel}>Telefone:</Text><Text style={s.clienteValue}>{orc.clienteTelefone}</Text></View>}
              {orc.clienteEmail && <View style={s.clienteRow}><Text style={s.clienteLabel}>Email:</Text><Text style={s.clienteValue}>{orc.clienteEmail}</Text></View>}
              {orc.clienteEndereco && <View style={s.clienteRow}><Text style={s.clienteLabel}>Endereço:</Text><Text style={s.clienteValue}>{orc.clienteEndereco}</Text></View>}
              {orc.clienteArquiteto && <View style={s.clienteRow}><Text style={s.clienteLabel}>Arquiteto/RT:</Text><Text style={s.clienteValue}>{orc.clienteArquiteto}</Text></View>}
            </View>
          </>
        )}

        {/* Ambientes */}
        <Text style={[s.sectionTitle, { marginTop: 16 }]}>Detalhamento por Ambiente</Text>
        <View style={s.sectionLine} />

        {orc.ambientes.map((a, i) => (
          <View key={i} wrap={false}>
            <View style={s.ambienteHeader}>
              <Text style={s.ambienteNome}>{a.nomeAmbiente}</Text>
            </View>

            <View style={s.tableHeader}>
              <Text style={s.colItemH}>Item</Text>
              <Text style={s.colDescH}>Descrição</Text>
              <Text style={s.colQtdH}>Qtd</Text>
              <Text style={s.colValorH}>Valor</Text>
            </View>

            <View style={s.tableRow}>
              <Text style={s.colItem}>Tecido</Text>
              <Text style={s.colDesc}>{a.tecidoNome}</Text>
              <Text style={s.colQtd}>{a.quantidadeTecido.toFixed(2)}m</Text>
              <Text style={s.colValor}>—</Text>
            </View>

            {a.blackoutNome && a.quantidadeBlackout && (
              <View style={s.tableRow}>
                <Text style={s.colItem}>Blackout</Text>
                <Text style={s.colDesc}>{a.blackoutNome}</Text>
                <Text style={s.colQtd}>{a.quantidadeBlackout.toFixed(2)}m</Text>
                <Text style={s.colValor}>—</Text>
              </View>
            )}

            {a.trilhoAcessoriosValor && Number(a.trilhoAcessoriosValor) > 0 && (
              <View style={s.tableRow}>
                <Text style={s.colItem}>Trilho/Acessórios</Text>
                <Text style={s.colDesc}>Trilho e acessórios de instalação</Text>
                <Text style={s.colQtd}>1</Text>
                <Text style={s.colValor}>—</Text>
              </View>
            )}

            {a.instalacao && (
              <View style={s.tableRow}>
                <Text style={s.colItem}>Instalação</Text>
                <Text style={s.colDesc}>Serviço de instalação</Text>
                <Text style={s.colQtd}>1</Text>
                <Text style={s.colValor}>—</Text>
              </View>
            )}

            {a.outrosValor && Number(a.outrosValor) > 0 && (
              <View style={s.tableRow}>
                <Text style={s.colItem}>Outros</Text>
                <Text style={s.colDesc}>Custos adicionais</Text>
                <Text style={s.colQtd}>1</Text>
                <Text style={s.colValor}>—</Text>
              </View>
            )}

            <View style={s.ambienteTotal}>
              <Text style={s.ambienteTotalLabel}>Valor do ambiente:</Text>
              <Text style={s.ambienteTotalValue}>{fmt(a.precoFinalVenda)}</Text>
            </View>
          </View>
        ))}

        {/* Total */}
        <View style={s.totalBox}>
          <Text style={s.totalLabel}>Valor Total do Orçamento</Text>
          <Text style={s.totalValue}>{fmt(orc.precoFinalTotal)}</Text>
          <Text style={s.totalParc}>em até 10x sem juros</Text>
        </View>

        {/* Condições comerciais */}
        <Text style={[s.sectionTitle, { marginTop: 20 }]}>Condições Comerciais</Text>
        <View style={s.sectionLine} />
        <View style={s.condicoesBox}>
          <Text style={s.condicoesText}>{condicoes}</Text>
        </View>

        {/* Assinatura */}
        <View style={s.assinaturaRow}>
          <View style={s.assinaturaBox}>
            <View style={s.assinaturaLinha} />
            <Text style={s.assinaturaLabel}>{orc.clienteNome ?? 'Cliente'}</Text>
          </View>
          <View style={s.assinaturaBox}>
            <View style={s.assinaturaLinha} />
            <Text style={s.assinaturaLabel}>Casa Estampa Interiores</Text>
          </View>
        </View>

        {/* Rodapé */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Casa Estampa Interiores{telefone ? ` · ${telefone}` : ''} · casaestampa.com.br
          </Text>
          <Text style={[s.footerText, { marginTop: 2 }]}>
            Orçamento #{String(orc.numero).padStart(4, '0')} · Gerado em {dataGeracao}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
