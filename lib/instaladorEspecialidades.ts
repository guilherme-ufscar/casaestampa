import { prisma } from '@/lib/prisma'

export const CONFIG_KEY_INSTALADOR_ESPECIALIDADES = 'instalador_especialidades_json'
export const ESPECIALIDADES_INSTALADOR = ['CORTINA', 'PERSIANA', 'PAPEL_PAREDE', 'PISO'] as const

export type EspecialidadeInstalador = typeof ESPECIALIDADES_INSTALADOR[number]

type EspecialidadesMap = Record<string, EspecialidadeInstalador[]>

const ESPECIALIDADES_PADRAO: EspecialidadeInstalador[] = ['CORTINA', 'PERSIANA']

function isEspecialidadeInstalador(value: unknown): value is EspecialidadeInstalador {
  return typeof value === 'string' && ESPECIALIDADES_INSTALADOR.includes(value as EspecialidadeInstalador)
}

export function normalizarEspecialidades(input: unknown): EspecialidadeInstalador[] {
  if (!Array.isArray(input)) return []
  const values = input.filter(isEspecialidadeInstalador)
  return Array.from(new Set(values))
}

function parseMap(raw: string | null | undefined): EspecialidadesMap {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed).map(([instaladorId, especialidades]) => [instaladorId, normalizarEspecialidades(especialidades)])
    )
  } catch {
    return {}
  }
}

async function salvarMap(map: EspecialidadesMap) {
  await prisma.configuracaoCalculo.upsert({
    where: { chave: CONFIG_KEY_INSTALADOR_ESPECIALIDADES },
    update: { valor: JSON.stringify(map) },
    create: { chave: CONFIG_KEY_INSTALADOR_ESPECIALIDADES, valor: JSON.stringify(map) },
  })
}

export async function obterMapaEspecialidadesInstalador() {
  const config = await prisma.configuracaoCalculo.findUnique({
    where: { chave: CONFIG_KEY_INSTALADOR_ESPECIALIDADES },
    select: { valor: true },
  })

  return parseMap(config?.valor)
}

export async function salvarEspecialidadesInstalador(instaladorId: string, especialidades: unknown) {
  const map = await obterMapaEspecialidadesInstalador()
  const normalizadas = normalizarEspecialidades(especialidades)
  map[instaladorId] = normalizadas.length > 0 ? normalizadas : ESPECIALIDADES_PADRAO
  await salvarMap(map)
  return map[instaladorId]
}

export async function enriquecerInstaladores<T extends { id: string }>(instaladores: T[]) {
  const map = await obterMapaEspecialidadesInstalador()
  return instaladores.map(instalador => ({
    ...instalador,
    especialidades: map[instalador.id] && map[instalador.id].length > 0 ? map[instalador.id] : ESPECIALIDADES_PADRAO,
  }))
}
