import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return null during SSR to prevent build errors
  if (typeof window === 'undefined') {
    return null as unknown as ReturnType<typeof createBrowserClient>
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    return null as unknown as ReturnType<typeof createBrowserClient>
  }

  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return client
}
