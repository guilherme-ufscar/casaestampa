import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

function initVapid() {
  const email = process.env.VAPID_EMAIL
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!email || !pub || !priv) return false
  const subject = email.startsWith('mailto:') ? email : `mailto:${email}`
  webpush.setVapidDetails(subject, pub, priv)
  return true
}

export async function notificarAdmins(payload: { title: string; body: string; url?: string }) {
  if (!initVapid()) return
  const subs = await prisma.pushSubscription.findMany({
    where: { user: { role: 'ADMIN' } },
  })

  await Promise.allSettled(
    subs.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload)
      ).catch(async err => {
        // Remove subscriptions inválidas (410 = unsubscribed)
        if (err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {})
        }
      })
    )
  )
}
