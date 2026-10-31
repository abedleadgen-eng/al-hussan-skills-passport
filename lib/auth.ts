import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AppRole, Profile } from '@/lib/types'

export const getSession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()
  if (!profile) return null
  return { user, profile, supabase }
})

export async function requireSession() {
  const session = await getSession()
  if (!session) redirect('/auth/login')
  return session
}

export async function requireRole(roles: AppRole[]) {
  const session = await requireSession()
  if (!roles.includes(session.profile.role)) redirect('/dashboard')
  return session
}

export function isAdminRole(role: AppRole) {
  return role === 'super_admin' || role === 'hr_admin'
}
