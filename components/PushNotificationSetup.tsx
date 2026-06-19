'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array(Array.from(rawData).map(c => c.charCodeAt(0)))
}

export default function PushNotificationSetup() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    if (!isAdmin || !('serviceWorker' in navigator) || !('PushManager' in window)) return

    async function setup() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const { publicKey } = await fetch('/api/push/subscribe').then(r => r.json())
        if (!publicKey) return

        let sub = await reg.pushManager.getSubscription()
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          })
        }

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        })
      } catch (e) {
        console.warn('Push setup failed:', e)
      }
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => { if (p === 'granted') setup() })
    } else if (Notification.permission === 'granted') {
      setup()
    }
  }, [isAdmin])

  return null
}
