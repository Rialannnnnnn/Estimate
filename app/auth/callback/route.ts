import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseClientErrorMessage } from '@/lib/supabase/config'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        // Only permit the recovery destination explicitly; never redirect to arbitrary URLs.
        const destination = searchParams.get('next') === '/auth/update-password'
          ? '/auth/update-password'
          : '/dashboard'
        return NextResponse.redirect(`${origin}${destination}`)
      }
    } catch (error) {
      const message = getSupabaseClientErrorMessage(
        error,
        'Supabase callback could not initialize.',
      )
      console.warn(message)
      return NextResponse.redirect(`${origin}/auth/login?error=configuration`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=callback`)
}
