import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import path from 'path'
import fs from 'fs'

const LOGO_FILE = path.join(process.cwd(), 'public', 'logo-casa-estampa.png')
const LOGO_EXISTS = fs.existsSync(LOGO_FILE)

const GOLD = '#C9A84C'
const DARK = '#1C1C1C'
const MUTED = '#6B6B6B'
const LIGHT_BG = '#F8F8F8'
const BORDER = '#F0EDE8'

const s = StyleSheet.create({
  page: { fontSize: 9, color: DARK, padding: 36, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  logoArea: { flexDirection: 'column' },
  logoImage: { width: 120, height: 38, objectFit: 'contain' },
  logoNome: { fontSize: 18, fontWeight: 700, color: GOLD, letterSpacing: 1 },
  logoSub: { fontSize: 8, color: MUTED, letterSpacing: 3, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  orcNumero: { fontSize: 13, fontWeight: 700, color: DARK },
  orcMeta: { fontSize: 8, color: MUTED, marginTop: 2 },
  sectionTitle: { fontSize: 8, fontWeight: 600, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, marginTop: 14 },
  sectionLine: { height: 1, backgroundColor: GOLD, opacity: 0.3, marginBottom: 10 },
  clienteBox: { backgroundColor: LIGHT_BG, borderRadius: 6, padding: 12, marginBottom: 4 },
  clienteRow: { flexDirection: 'row', marginBottom: 3 },
  clienteLabel: { fontSize: 8, color: MUTED, width: 86 },
  clienteValue: { fontSize: 8, color: DARK, fontWeight: 600, flex: 1 },
  ambienteCard: { borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 12, marginBottom: 10 },
  ambienteNome: { fontSize: 10, fontWeight: 700, color: GOLD, marginBottom: 6 },
  linha: { fontSize: 8, color: MUTED, marginBottom: 3 },
  destaque: { fontSize: 8, color: DARK, fontWeight: 600 },
  totalBox: { marginTop: 18, padding: 14, borderRadius: 8, backgroundColor: '#FFFBF2', borderWidth: 1, borderColor: '#E8C97A', alignItems: 'center' },
  totalLabel: { fontSize: 9, color: MUTED, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  totalValue: { fontSize: 22, fontWeight: 700, color: DARK },
  totalParc: { fontSize: 8, color: MUTED, marginTop: 4 },
  condicoesBox: { marginTop: 14, padding: 12, backgroundColor: LIGHT_BG, borderRadius: 6 },
  condicoesText: { fontSize: 8, color: MUTED, lineHeight: 1.6 },
  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, alignItems: 'center', borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8 },
  footerText: { fontSize: 7, color: MUTED },
})

function fmt(v: number) {
  const fixed = v.toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `R$ ${intFormatted},${decPart}`
}

const MODELO_LABELS: Record<string, string> = {
  prega_macho: 'Prega Macho',
  prega_femea: 'Prega Fêmea',
  prega_americana: 'Prega Americana',
  prega_franzida: 'Prega Franzida',
  prega_reta: 'Prega Reta',
  wave: 'Wave',
  soft_wave: 'Soft Wave',
  varao: 'Varão',
}

export type AmbientePDF = {
  nomeAmbiente: string
  largura: number
  altura: number
  modeloCortina: string
  trilhoTipo: string
  tipoAbertura: string
  tipoAberturaBlackout?: string | null
  bainhaDesejada?: number | null
  tecidoNome: string
  quantidadeTecido: number
  blackoutNome?: string | null
  quantidadeBlackout?: number | null
  instalacao: boolean
  precoFinalVenda: number
}

export type AmbientePapelPDF = {
  nomeAmbiente: string
  album: string
  referencia: string
  metrosQuadrados: number
  quantidadeRolos: number
  precoFinalVenda: number
  instalacao: boolean
  custoInstalacao: number
}

export type AmbientePersianaPDF = {
  nomeAmbiente: string
  tipo: string
  colecao: string
  modelo: string
  largura: number
  altura: number
  quantidade: number
  m2Cobrado: number
  acionamento: string
  instalacao: boolean
  bandoNome?: string | null
  guiaLateralNome?: string | null
  guiaBaseName?: string | null
  motorNome?: string | null
  controleNome?: string | null
  precoFinalVenda: number
}

const TIPO_PDF: Record<string, string> = {
  ROLO: 'Rolo', ROMANA: 'Romana', PAINEL_COM_HASTES: 'Painel com hastes', PAINEL_SEM_HASTES: 'Painel sem hastes',
  HORIZONTAL_16: 'Horizontal 16mm', HORIZONTAL_25: 'Horizontal 25mm', HORIZONTAL_50: 'Horizontal 50mm',
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
  ambientesPapel?: AmbientePapelPDF[]
  ambientesPersiana?: AmbientePersianaPDF[]
  precoFinalTotal: number
  condicoesComerciais?: string
  telefoneEmpresa?: string
  mostrarMedidas?: boolean
  mostrarModelo?: boolean
  mostrarTecido?: boolean
  mostrarPrega?: boolean
  mostrarBainha?: boolean
  mostrarPapelMetragem?: boolean
  mostrarPapelRolos?: boolean
}

export default function OrcamentoPDFDoc({ orc }: { orc: OrcamentoPDF }) {
  const dataGeracao = new Date().toLocaleDateString('pt-BR')
  const dataOrc = new Date(orc.createdAt).toLocaleDateString('pt-BR')
  const mostrarMedidas = orc.mostrarMedidas !== false
  const mostrarModelo = orc.mostrarModelo !== false
  const mostrarTecido = orc.mostrarTecido !== false
  const mostrarPrega = orc.mostrarPrega !== false
  const mostrarBainha = orc.mostrarBainha !== false
  const mostrarPapelMetragem = orc.mostrarPapelMetragem !== false
  const mostrarPapelRolos = orc.mostrarPapelRolos !== false
  const condicoes = orc.condicoesComerciais || 'Prazo de 20 dias úteis para confecção. Trilho e instalação inclusos quando previstos no orçamento.'
  const telefone = orc.telefoneEmpresa || ''

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.logoArea}>
            {LOGO_EXISTS ? (
              <Image style={s.logoImage} src={LOGO_FILE} />
            ) : (
              <>
                <Text style={s.logoNome}>Casa Estampa</Text>
                <Text style={s.logoSub}>INTERIORES</Text>
              </>
            )}
          </View>
          <View style={s.headerRight}>
            <Text style={s.orcNumero}>Orçamento #{String(orc.numero).padStart(4, '0')}</Text>
            <Text style={s.orcMeta}>Emitido em: {dataGeracao}</Text>
            <Text style={s.orcMeta}>Data: {dataOrc}</Text>
            <Text style={s.orcMeta}>Vendedor: {orc.vendedorNome}</Text>
          </View>
        </View>

        {orc.clienteNome && (
          <>
            <Text style={s.sectionTitle}>Dados do Cliente</Text>
            <View style={s.sectionLine} />
            <View style={s.clienteBox}>
              <View style={s.clienteRow}><Text style={s.clienteLabel}>Nome:</Text><Text style={s.clienteValue}>{orc.clienteNome}</Text></View>
              {orc.clienteTelefone && <View style={s.clienteRow}><Text style={s.clienteLabel}>Telefone:</Text><Text style={s.clienteValue}>{orc.clienteTelefone}</Text></View>}
              {orc.clienteEmail && <View style={s.clienteRow}><Text style={s.clienteLabel}>Email:</Text><Text style={s.clienteValue}>{orc.clienteEmail}</Text></View>}
              {orc.clienteEndereco && <View style={s.clienteRow}><Text style={s.clienteLabel}>Endereço:</Text><Text style={s.clienteValue}>{orc.clienteEndereco}</Text></View>}
              {orc.clienteArquiteto && <View style={s.clienteRow}><Text style={s.clienteLabel}>Arquiteto / RT:</Text><Text style={s.clienteValue}>{orc.clienteArquiteto}</Text></View>}
            </View>
          </>
        )}

        <Text style={s.sectionTitle}>Detalhamento</Text>
        <View style={s.sectionLine} />
        {orc.ambientes.map((a, i) => (
          <View key={i} style={s.ambienteCard} wrap={false}>
            <Text style={s.ambienteNome}>{a.nomeAmbiente}</Text>
            {mostrarPrega && <Text style={s.linha}><Text style={s.destaque}>Prega:</Text> {MODELO_LABELS[a.modeloCortina] ?? a.modeloCortina}</Text>}
            {mostrarModelo && <Text style={s.linha}><Text style={s.destaque}>Suporte:</Text> {a.trilhoTipo === 'varao' ? 'Varão' : 'Cortina Trilho Suíço'}</Text>}
            {mostrarMedidas && <Text style={s.linha}><Text style={s.destaque}>Medidas:</Text> {a.largura.toFixed(2)} x {a.altura.toFixed(2)} m</Text>}
            {mostrarTecido && <Text style={s.linha}><Text style={s.destaque}>Tecido:</Text> {a.tecidoNome} — {a.quantidadeTecido.toFixed(2)}m</Text>}
            {mostrarTecido && a.blackoutNome && a.quantidadeBlackout && <Text style={s.linha}><Text style={s.destaque}>Blackout:</Text> {a.blackoutNome} — {a.quantidadeBlackout.toFixed(2)}m</Text>}
            {mostrarTecido && <Text style={s.linha}><Text style={s.destaque}>Abertura tecido:</Text> {a.tipoAbertura === 'CENTRAL' ? 'Central' : 'Inteira'}</Text>}
            {mostrarTecido && a.blackoutNome && <Text style={s.linha}><Text style={s.destaque}>Abertura blackout:</Text> {a.tipoAberturaBlackout === 'CENTRAL' ? 'Central' : 'Inteira'}</Text>}
            {mostrarBainha && a.bainhaDesejada != null && <Text style={s.linha}><Text style={s.destaque}>Bainha:</Text> {a.bainhaDesejada.toFixed(2)}m</Text>}
            <Text style={s.linha}><Text style={s.destaque}>Inclusos:</Text> Trilho e instalação {a.instalacao ? 'incluídos' : 'conforme orçamento'}</Text>
            <Text style={s.linha}><Text style={s.destaque}>Valor do ambiente:</Text> {fmt(a.precoFinalVenda)}</Text>
          </View>
        ))}

        {orc.ambientesPapel && orc.ambientesPapel.length > 0 && orc.ambientesPapel.map((a, i) => (
          <View key={`papel-${i}`} style={s.ambienteCard} wrap={false}>
            <Text style={s.ambienteNome}>{a.nomeAmbiente} — Papel de Parede</Text>
            <Text style={s.linha}><Text style={s.destaque}>Álbum:</Text> {a.album}</Text>
            {a.referencia && <Text style={s.linha}><Text style={s.destaque}>Referência:</Text> {a.referencia}</Text>}
            {mostrarPapelMetragem && <Text style={s.linha}><Text style={s.destaque}>Metragem:</Text> {a.metrosQuadrados.toFixed(2)} m²</Text>}
            {mostrarPapelRolos && <Text style={s.linha}><Text style={s.destaque}>Quantidade de rolos:</Text> {a.quantidadeRolos}</Text>}
            {a.instalacao ? (
              <Text style={s.linha}><Text style={s.destaque}>Valor total:</Text> {fmt(a.precoFinalVenda)}</Text>
            ) : (
              <>
                <Text style={s.linha}><Text style={s.destaque}>Valor do papel de parede:</Text> {fmt(a.precoFinalVenda)}</Text>
                {a.custoInstalacao > 0 && (
                  <>
                    <Text style={s.linha}><Text style={s.destaque}>Valor da instalação:</Text> {fmt(a.custoInstalacao)}</Text>
                    <Text style={[s.linha, { fontStyle: 'italic', color: MUTED }]}>(Instalação paga diretamente ao instalador após a finalização do serviço.)</Text>
                  </>
                )}
              </>
            )}
          </View>
        ))}

        {orc.ambientesPersiana && orc.ambientesPersiana.length > 0 && orc.ambientesPersiana.map((a, i) => (
          <View key={`persiana-${i}`} style={s.ambienteCard} wrap={false}>
            <Text style={s.ambienteNome}>{a.nomeAmbiente} — Persiana {TIPO_PDF[a.tipo] ?? a.tipo}</Text>
            <Text style={s.linha}><Text style={s.destaque}>Modelo:</Text> {a.colecao} {a.modelo}</Text>
            <Text style={s.linha}><Text style={s.destaque}>Medidas:</Text> {a.largura.toFixed(2)} × {a.altura.toFixed(2)} m · {a.quantidade} {a.quantidade === 1 ? 'peça' : 'peças'} · {a.m2Cobrado.toFixed(2)} m²</Text>
            <Text style={s.linha}><Text style={s.destaque}>Acionamento:</Text> {a.acionamento === 'motorizada' ? 'Motorizado' : 'Manual'}</Text>
            {a.bandoNome && <Text style={s.linha}><Text style={s.destaque}>Bandô:</Text> {a.bandoNome}</Text>}
            {a.guiaLateralNome && <Text style={s.linha}><Text style={s.destaque}>Guia lateral:</Text> {a.guiaLateralNome}</Text>}
            {a.guiaBaseName && <Text style={s.linha}><Text style={s.destaque}>Guia base:</Text> {a.guiaBaseName}</Text>}
            {a.motorNome && <Text style={s.linha}><Text style={s.destaque}>Motor:</Text> {a.motorNome}</Text>}
            {a.controleNome && <Text style={s.linha}><Text style={s.destaque}>Controle remoto:</Text> {a.controleNome}</Text>}
            <Text style={s.linha}><Text style={s.destaque}>Instalação:</Text> {a.instalacao ? 'Incluída' : 'Não incluída'}</Text>
            <Text style={s.linha}><Text style={s.destaque}>Valor do ambiente:</Text> {fmt(a.precoFinalVenda)}</Text>
          </View>
        ))}

        <View style={s.totalBox}>
          <Text style={s.totalLabel}>Valor do Orçamento</Text>
          <Text style={s.totalValue}>{fmt(orc.precoFinalTotal)}</Text>
          <Text style={s.totalParc}>à vista</Text>
          <Text style={[s.totalParc, { marginTop: 4 }]}>ou 10x de {fmt(orc.precoFinalTotal * 1.1106 / 10)}</Text>
        </View>

        <Text style={s.sectionTitle}>Condições Comerciais</Text>
        <View style={s.sectionLine} />
        <View style={s.condicoesBox}>
          <Text style={s.condicoesText}>{condicoes}</Text>
          <Text style={[s.condicoesText, { marginTop: 6 }]}>Prazo de 20 dias úteis para confecção.</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Casa Estampa Interiores{telefone ? ` · ${telefone}` : ''}</Text>
          <Text style={[s.footerText, { marginTop: 2 }]}>Orçamento #{String(orc.numero).padStart(4, '0')} · Gerado em {dataGeracao}</Text>
        </View>
      </Page>
    </Document>
  )
}
