export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SupabaseConfigurationError'
  }
}

export type SupabasePublicConfig = {
  url: string
  anonKey: string
}

export function validateSupabasePublicConfig(
  supabaseUrl: string | undefined,
  supabaseAnonKey: string | undefined,
): SupabasePublicConfig {
  const url = supabaseUrl?.trim()
  const anonKey = supabaseAnonKey?.trim()
  const missing = [
    !url && 'NEXT_PUBLIC_SUPABASE_URL',
    !anonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter((value): value is string => Boolean(value))

  if (missing.length) {
    throw new SupabaseConfigurationError(
      `Autentikasi Supabase belum dikonfigurasi. Variabel lingkungan publik yang belum tersedia: ${missing.join(', ')}.`,
    )
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url!)
  } catch {
    throw new SupabaseConfigurationError(
      'NEXT_PUBLIC_SUPABASE_URL harus berupa URL HTTP atau HTTPS yang valid.',
    )
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
    throw new SupabaseConfigurationError(
      'NEXT_PUBLIC_SUPABASE_URL harus berupa URL HTTP atau HTTPS yang valid.',
    )
  }

  return { url: url!, anonKey: anonKey! }
}

export function getSupabasePublicConfig() {
  return validateSupabasePublicConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export function getSupabaseClientErrorMessage(error: unknown, fallback: string) {
  return error instanceof SupabaseConfigurationError ? error.message : fallback
}
