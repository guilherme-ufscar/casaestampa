import { randomBytes } from 'crypto'

export function gerarToken(): string {
  return randomBytes(32).toString('hex')
}

export function tokenExpiracao(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d
}
