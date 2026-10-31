'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthErrorCode = 'invalid' | 'unconfirmed' | 'rateLimited' | 'weakPassword' | 'unexpected'

function classify(error: { code?: string; status?: number; message: string }): AuthErrorCode {
  if (error.code === 'email_not_confirmed') return 'unconfirmed'
  if (error.status === 429 || error.code?.includes('rate_limit')) return 'rateLimited'
  if (error.code === 'weak_password') return 'weakPassword'
  if (error.code === 'invalid_credentials' || error.code === 'user_already_exists') return 'invalid'
  console.error('[auth] unexpected error', error.code, error.message)
  return 'unexpected'
}

export async function signInAction(_: unknown, formData: FormData): Promise<{ error: AuthErrorCode } | void> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'invalid' }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: classify(error) }
  redirect('/dashboard')
}

export async function signUpAction(_: unknown, formData: FormData): Promise<{ error: AuthErrorCode } | void> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('full_name') ?? '').trim().slice(0, 120)
  const redirectTo = String(formData.get('redirect_to') ?? '')
  if (!email) return { error: 'invalid' }
  if (password.length < 8) return { error: 'weakPassword' }
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo || undefined,
      data: { full_name: fullName },
    },
  })
  if (error) return { error: classify(error) }
  if (data.session) redirect('/dashboard')
  redirect('/auth/sign-up-success')
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
