import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 로그아웃
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/auth/login', request.url))
}
