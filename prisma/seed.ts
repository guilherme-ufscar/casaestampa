import { PrismaClient, Role, TipoTecido } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Usuários
  const adminSenha = await bcrypt.hash('admin123', 12)
  const vendedorSenha = await bcrypt.hash('vendedor123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@casaestampa.com.br' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@casaestampa.com.br',
      senha: adminSenha,
      role: Role.ADMIN,
      ativo: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'vendedor@casaestampa.com.br' },
    update: {},
    create: {
      nome: 'Vendedor Teste',
      email: 'vendedor@casaestampa.com.br',
      senha: vendedorSenha,
      role: Role.VENDEDOR,
      ativo: true,
    },
  })

  // Limpar tecidos e trilhos existentes para re-seed limpo
  await prisma.tecido.deleteMany()
  await prisma.trilhoVarao.deleteMany()

  // ─── TECIDOS — Tabela Deccor Casa 21/01/2026 ───────────────────────────────
  // Fonte: "Tabela de Preço - DECCOR CASA (( Completa )) - 21.01.2026.xlsx"
  // Tipo BLACKOUT detectado pelo nome do produto
  const tecidos: { nome: string; larguraMaxima: number; valorMetro: number; tipo: TipoTecido }[] = [
    // ── VOIL ──
    { nome: '011/01 - VOIL CRISTAL 100%PES BRANCO', larguraMaxima: 3.00, valorMetro: 19.80, tipo: TipoTecido.PRINCIPAL },
    { nome: '011/02 - VOIL CRISTAL 100%PES PÉROLA', larguraMaxima: 3.00, valorMetro: 19.80, tipo: TipoTecido.PRINCIPAL },
    { nome: '011/4846 - VOIL CRISTAL 100%PES 4846 CZ', larguraMaxima: 3.00, valorMetro: 20.90, tipo: TipoTecido.PRINCIPAL },
    { nome: '012/01 - VOIL FABIANA 100%PES BRANCO', larguraMaxima: 3.00, valorMetro: 29.42, tipo: TipoTecido.PRINCIPAL },
    { nome: '012/02 - VOIL FABIANA 100%PES MARFIM', larguraMaxima: 3.00, valorMetro: 29.42, tipo: TipoTecido.PRINCIPAL },
    // ── LINHO ──
    { nome: '020/26110/050 - LINHO BOGOTÁ 40%CMO20%CO19%CL18%PES3%CV', larguraMaxima: 2.95, valorMetro: 53.28, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/26210/050 - LINHO SANTIAGO 45%CO30%PES15%CV10%CL', larguraMaxima: 2.95, valorMetro: 62.30, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/2671110/50 - LINHO FORTALEZA 43%PES30%CV16%CO11%CL', larguraMaxima: 2.95, valorMetro: 73.31, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/95115/0050 - MEDELLIN 91%PES9%CL', larguraMaxima: 2.95, valorMetro: 53.14, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/95116/0050 - HAVANA LINHO 86%PES14%CO', larguraMaxima: 2.95, valorMetro: 61.28, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/95116/01 - HAVANA LINHO 54%PES46%CO COR 01', larguraMaxima: 2.95, valorMetro: 61.28, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/95116/02 - HAVANA LINHO 54%PES46%CO COR 02', larguraMaxima: 2.95, valorMetro: 61.28, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/95116/03 - HAVANA LINHO 54%PES46%CO COR 03', larguraMaxima: 2.95, valorMetro: 61.28, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/9512/01 - PUEBLA 77%CO23%PES COR 01', larguraMaxima: 2.95, valorMetro: 59.95, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/9512/02 - PUEBLA 77%CO23%PES COR 02', larguraMaxima: 2.95, valorMetro: 59.95, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/9512/03 - PUEBLA 77%CO23%PES COR 03', larguraMaxima: 2.95, valorMetro: 59.95, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/95120/01 - MONTEVIDEU 72%PES28%CO COR 01', larguraMaxima: 2.95, valorMetro: 50.61, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/95120/04 - MONTEVIDEU 72%PES28%CO COR 04', larguraMaxima: 2.95, valorMetro: 50.61, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/95120/05 - MONTEVIDEU 72%PES28%CO COR 05', larguraMaxima: 2.95, valorMetro: 50.61, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/95126/01 - LINHO MENDONZA 56%CO30%PES14%CL COR 01', larguraMaxima: 2.95, valorMetro: 63.90, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/95126/03 - LINHO MENDONZA 56%CO30%PES14%CL COR 03', larguraMaxima: 2.95, valorMetro: 63.90, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/95126/04 - LINHO MENDONZA 56%CO30%PES14%CL COR 04', larguraMaxima: 2.95, valorMetro: 63.90, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/95126/05 - LINHO MENDONZA 56%CO30%PES14%CL COR 05', larguraMaxima: 2.95, valorMetro: 63.90, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/9517/01 - LINHO LA PLATA 78%PES22%CL COR 01', larguraMaxima: 2.95, valorMetro: 57.14, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/9517/02 - LINHO LA PLATA 78%PES22%CL COR 02', larguraMaxima: 2.95, valorMetro: 57.14, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/9519/01 - LINHO MONTREAL 100%PES COR 01', larguraMaxima: 2.95, valorMetro: 66.10, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/9519/02 - LINHO MONTREAL 100%PES COR 02', larguraMaxima: 2.95, valorMetro: 66.10, tipo: TipoTecido.PRINCIPAL },
    { nome: '020/9519/03 - LINHO MONTREAL 100%PES COR 03', larguraMaxima: 2.95, valorMetro: 66.10, tipo: TipoTecido.PRINCIPAL },
    { nome: '058/01 - LINHO ESTOCOLMO ORIGINAL NATURAL', larguraMaxima: 3.00, valorMetro: 124.70, tipo: TipoTecido.PRINCIPAL },
    { nome: '058/02 - LINHO ESTOCOLMO ORIGINAL PÉROLA', larguraMaxima: 3.00, valorMetro: 124.70, tipo: TipoTecido.PRINCIPAL },
    { nome: '058/04 - LINHO ESTOCOLMO ORIGINAL NATURAL ESC.', larguraMaxima: 3.00, valorMetro: 124.70, tipo: TipoTecido.PRINCIPAL },
    { nome: '058/06 - LINHO ESTOCOLMO ORIGINAL BRANCO', larguraMaxima: 3.00, valorMetro: 124.70, tipo: TipoTecido.PRINCIPAL },
    { nome: '058/10 - LINHO ESTOCOLMO ORIGINAL COR 10', larguraMaxima: 3.00, valorMetro: 124.70, tipo: TipoTecido.PRINCIPAL },
    { nome: '058/11 - LINHO ESTOCOLMO ORIGINAL CINZA', larguraMaxima: 3.00, valorMetro: 124.70, tipo: TipoTecido.PRINCIPAL },
    { nome: '058/97 - LINHO ESTOCOLMO ORIGINAL ROSA ANTIGO', larguraMaxima: 3.00, valorMetro: 124.70, tipo: TipoTecido.PRINCIPAL },
    // ── CORTA LUZ ──
    { nome: '059/01 - CORTA LUZ ESPECIAL 100%PES BRANCO 70%', larguraMaxima: 2.80, valorMetro: 25.90, tipo: TipoTecido.PRINCIPAL },
    { nome: '059/02 - CORTA LUZ ESPECIAL 100%PES PÉROLA 70%', larguraMaxima: 2.80, valorMetro: 25.90, tipo: TipoTecido.PRINCIPAL },
    { nome: '059/50 - CORTA LUZ ESPECIAL 100%PES PRETO 70%', larguraMaxima: 2.80, valorMetro: 25.90, tipo: TipoTecido.PRINCIPAL },
    { nome: '059/55 - CORTA LUZ ESPECIAL 100%PES OFF-WHITE 70%', larguraMaxima: 2.80, valorMetro: 25.90, tipo: TipoTecido.PRINCIPAL },
    { nome: '059/60 - CORTA LUZ ESPECIAL 100%PES CINZA 70%', larguraMaxima: 2.80, valorMetro: 25.90, tipo: TipoTecido.PRINCIPAL },
    { nome: '059/70 - CORTA LUZ ESPECIAL 100%PES EXTRA WHITE 50%', larguraMaxima: 2.80, valorMetro: 25.90, tipo: TipoTecido.PRINCIPAL },
    { nome: '059/75 - CORTA LUZ ESPECIAL 100%PES BEGE ESCURO 70%', larguraMaxima: 2.80, valorMetro: 25.90, tipo: TipoTecido.PRINCIPAL },
    // ── BLACKOUT — Fornecedor Deccor ──
    { nome: '100/012/02 - BLACKOUT SALERMO 100%PES BEGE', larguraMaxima: 2.80, valorMetro: 53.90, tipo: TipoTecido.BLACKOUT },
    { nome: '100/012/09 - BLACKOUT SALERMO 100%PES MARFIM', larguraMaxima: 2.80, valorMetro: 53.90, tipo: TipoTecido.BLACKOUT },
    { nome: '100/012/22 - BLACKOUT SALERMO 100%PES PRATA', larguraMaxima: 2.80, valorMetro: 53.90, tipo: TipoTecido.BLACKOUT },
    { nome: '100/012/57 - BLACKOUT SALERMO 100%PES CINZA', larguraMaxima: 2.80, valorMetro: 53.90, tipo: TipoTecido.BLACKOUT },
    { nome: '876/350/01 - BLACKOUT TORONTO 90%PES10%CL', larguraMaxima: 2.80, valorMetro: 88.70, tipo: TipoTecido.BLACKOUT },
    { nome: '876/360/01 - BLACKOUT MONTREAL 95%PES5%CL', larguraMaxima: 2.80, valorMetro: 74.60, tipo: TipoTecido.BLACKOUT },
  ]

  for (const t of tecidos) {
    await prisma.tecido.create({ data: { ...t, ativo: true } })
  }

  // ─── TRILHOS E VARÕES — Fornecedor Venetillo ───────────────────────────────
  // Fonte: "TABELA DE TRILHO.xlsx" — preços por metro linear
  await prisma.trilhoVarao.createMany({
    data: [
      { nome: 'Trilho Max 1 Via (Venetillo)', valorUnitario: 11.88, ativo: true },
      { nome: 'Trilho Max 2 Vias (Venetillo)', valorUnitario: 24.51, ativo: true },
      { nome: 'Trilho Max 2 Vias Largo (Venetillo)', valorUnitario: 27.00, ativo: true },
      { nome: 'Trilho Max 3 Vias (Venetillo)', valorUnitario: 41.75, ativo: true },
      { nome: 'Trilho Mini Luxo Curvo (Venetillo)', valorUnitario: 18.80, ativo: true },
      { nome: 'Varão Tubo Simples 19mm (Venetillo)', valorUnitario: 15.90, ativo: true },
      { nome: 'Varão Tubo Grosso 29mm (Venetillo)', valorUnitario: 18.50, ativo: true },
      { nome: 'Tubo Wave (Venetillo)', valorUnitario: 28.00, ativo: true },
      { nome: 'Suporte Trilho Curvo (Venetillo)', valorUnitario: 10.00, ativo: true },
      { nome: 'Ilhões Varão Branco (Venetillo)', valorUnitario: 0.40, ativo: true },
      { nome: 'Ilhões Varão Cromado (Venetillo)', valorUnitario: 1.50, ativo: true },
      { nome: 'Ponteira do Varão Branco (Venetillo)', valorUnitario: 10.00, ativo: true },
      { nome: 'Suporte Varão (Venetillo)', valorUnitario: 17.00, ativo: true },
      // Rio Flex Persianas
      { nome: 'Trilho Max 1 Via (Rio Flex)', valorUnitario: 10.00, ativo: true },
      { nome: 'Trilho Max 2 Vias (Rio Flex)', valorUnitario: 20.00, ativo: true },
      { nome: 'Trilho Max 2 Vias Largo (Rio Flex)', valorUnitario: 25.00, ativo: true },
    ],
  })

  // ─── CONFIGURAÇÕES DE CÁLCULO ──────────────────────────────────────────────
  // Confecção por m² por modelo — Costureira Cici
  // Instalação por m² — R$35/m² (trilho ou varão)
  const configs = [
    { chave: 'markup_padrao', valor: '40' },
    { chave: 'comissao_padrao', valor: '8' },
    { chave: 'rt_padrao', valor: '5' },
    // Confecção por m² por modelo (Costureira Cici)
    { chave: 'confeccao_prega_macho', valor: '27' },
    { chave: 'confeccao_prega_femea', valor: '27' },
    { chave: 'confeccao_prega_americana', valor: '30' },
    { chave: 'confeccao_prega_franzida', valor: '27' },
    { chave: 'confeccao_prega_reta', valor: '24' },
    { chave: 'confeccao_wave', valor: '38' },
    { chave: 'confeccao_soft_wave', valor: '30' },
    { chave: 'confeccao_varao', valor: '39' },
    // Instalação por m² (cortina trilho ou varão = R$35/m²)
    { chave: 'instalacao_valor_m2', valor: '35' },
    // Fatores de prega
    { chave: 'fator_prega_macho', valor: '3' },
    { chave: 'fator_prega_femea', valor: '2.5' },
    { chave: 'fator_prega_americana', valor: '2.5' },
    { chave: 'fator_prega_franzida', valor: '3' },
    { chave: 'fator_prega_reta', valor: '1' },
    { chave: 'fator_wave', valor: '2' },
    { chave: 'fator_soft_wave', valor: '2' },
    { chave: 'fator_varao', valor: '1.5' },
  ]

  for (const c of configs) {
    await prisma.configuracaoCalculo.upsert({
      where: { chave: c.chave },
      update: { valor: c.valor },
      create: c,
    })
  }

  console.log('Seed concluído com sucesso!')
  console.log(`  ${tecidos.length} tecidos inseridos`)
  console.log(`  16 trilhos/varões inseridos`)
  console.log(`  ${configs.length} configurações inseridas`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
