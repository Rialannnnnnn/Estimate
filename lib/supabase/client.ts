import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicConfig } from './config'
export { getSupabaseClientErrorMessage } from './config'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  const { url, anonKey } = getSupabasePublicConfig()

  if (typeof window === 'undefined') {
    return createBrowserClient(url, anonKey, { isSingleton: false })
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, anonKey, { isSingleton: true })
  }

  return browserClient
}
