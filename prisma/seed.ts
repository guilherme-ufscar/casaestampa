import { PrismaClient, Role, TipoTecido } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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
      nome: 'Vendedor',
      email: 'vendedor@casaestampa.com.br',
      senha: vendedorSenha,
      role: Role.VENDEDOR,
      ativo: true,
    },
  })

  // Tecidos
  const tecidos = [
    { nome: 'Linho Bege Premium', larguraMaxima: 3.00, valorMetro: 120, tipo: TipoTecido.PRINCIPAL },
    { nome: 'Veludo Cinza Escuro', larguraMaxima: 2.80, valorMetro: 180, tipo: TipoTecido.PRINCIPAL },
    { nome: 'Voil Branco Puro', larguraMaxima: 2.80, valorMetro: 65, tipo: TipoTecido.PRINCIPAL },
    { nome: 'Blackout Marfim', larguraMaxima: 3.00, valorMetro: 45, tipo: TipoTecido.BLACKOUT },
    { nome: 'Seda Fria Champagne', larguraMaxima: 2.80, valorMetro: 220, tipo: TipoTecido.PRINCIPAL },
  ]

  for (const t of tecidos) {
    await prisma.tecido.create({ data: { ...t, ativo: true } })
  }

  // Trilhos e Varões
  await prisma.trilhoVarao.createMany({
    data: [
      { nome: 'Trilho Suíço Simples', valorUnitario: 85, ativo: true },
      { nome: 'Trilho Suíço Duplo', valorUnitario: 140, ativo: true },
      { nome: 'Varão Alumínio 28mm', valorUnitario: 65, ativo: true },
      { nome: 'Varão Madeira 35mm', valorUnitario: 95, ativo: true },
    ],
  })

  // Configurações de cálculo
  const configs = [
    { chave: 'markup_padrao', valor: '40' },
    { chave: 'comissao_padrao', valor: '8' },
    { chave: 'rt_padrao', valor: '5' },
    { chave: 'confeccao_valor_metro', valor: '25' },
    { chave: 'instalacao_valor_fixo', valor: '150' },
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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
