import { prisma } from '@/lib/prisma'

export const CONFIG_KEY_ARQUITETOS = 'arquitetos_cadastrados_json'

export type ArquitetoCadastro = {
  id: string
  nome: string
  telefone: string
  email: string
  observacoes: string
  ativo: boolean
  createdAt: string
  updatedAt: string
}

function parseArquitetos(raw: string | null | undefined): ArquitetoCadastro[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map(item => ({
        id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
        nome: typeof item.nome === 'string' ? item.nome : '',
        telefone: typeof item.telefone === 'string' ? item.telefone : '',
        email: typeof item.email === 'string' ? item.email : '',
        observacoes: typeof item.observacoes === 'string' ? item.observacoes : '',
        ativo: typeof item.ativo === 'boolean' ? item.ativo : true,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
      }))
      .filter(item => item.nome)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  } catch {
    return []
  }
}

async function salvarArquitetos(arquitetos: ArquitetoCadastro[]) {
  await prisma.configuracaoCalculo.upsert({
    where: { chave: CONFIG_KEY_ARQUITETOS },
    update: { valor: JSON.stringify(arquitetos) },
    create: { chave: CONFIG_KEY_ARQUITETOS, valor: JSON.stringify(arquitetos) },
  })
}

export async function listarArquitetos() {
  const config = await prisma.configuracaoCalculo.findUnique({
    where: { chave: CONFIG_KEY_ARQUITETOS },
    select: { valor: true },
  })

  return parseArquitetos(config?.valor)
}

export async function criarArquiteto(input: Pick<ArquitetoCadastro, 'nome' | 'telefone' | 'email' | 'observacoes'> & { ativo?: boolean }) {
  const arquitetos = await listarArquitetos()
  const now = new Date().toISOString()
  const arquiteto: ArquitetoCadastro = {
    id: crypto.randomUUID(),
    nome: input.nome.trim(),
    telefone: input.telefone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    observacoes: input.observacoes?.trim() ?? '',
    ativo: input.ativo ?? true,
    createdAt: now,
    updatedAt: now,
  }

  arquitetos.push(arquiteto)
  await salvarArquitetos(arquitetos)
  return arquiteto
}

export async function atualizarArquiteto(id: string, input: Partial<Pick<ArquitetoCadastro, 'nome' | 'telefone' | 'email' | 'observacoes' | 'ativo'>>) {
  const arquitetos = await listarArquitetos()
  const index = arquitetos.findIndex(item => item.id === id)
  if (index === -1) return null

  arquitetos[index] = {
    ...arquitetos[index],
    nome: input.nome !== undefined ? input.nome.trim() : arquitetos[index].nome,
    telefone: input.telefone !== undefined ? input.telefone.trim() : arquitetos[index].telefone,
    email: input.email !== undefined ? input.email.trim() : arquitetos[index].email,
    observacoes: input.observacoes !== undefined ? input.observacoes.trim() : arquitetos[index].observacoes,
    ativo: input.ativo !== undefined ? input.ativo : arquitetos[index].ativo,
    updatedAt: new Date().toISOString(),
  }

  await salvarArquitetos(arquitetos)
  return arquitetos[index]
}
