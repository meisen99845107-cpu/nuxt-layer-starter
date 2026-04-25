import { ensureRequestEncryptionConfig } from '../utils/fetch'

export default defineNuxtPlugin(() => {
  const enabled = String(import.meta.env.VITE_API_ENCRYPTION_ENABLED ?? 'true').toLowerCase()
  if (enabled === 'false' || enabled === '0') return

  ensureRequestEncryptionConfig().catch((error) => {
    console.error('[request-encryption] warmup failed:', error)
  })
})
