'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { isUuid, str } from '@/lib/form'
import type { ActionResult } from '@/lib/types'

const admins = ['super_admin', 'hr_admin'] as const

export async function saveCourse(id: string | null, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireRole([...admins])
  const titleEn = str(fd, 'title_en', 200)
  const hours = Number(str(fd, 'hours', 10) || '0')
  if (!titleEn) return { ok: false, error: 'Title is required' }
  if (!Number.isFinite(hours) || hours < 0 || hours > 10000) return { ok: false, error: 'Invalid hours' }
  const row = {
    title_en: titleEn,
    title_ar: str(fd, 'title_ar', 200),
    description: str(fd, 'description', 2000),
    provider: str(fd, 'provider', 200),
    category: str(fd, 'category', 80) || 'General',
    hours: Math.round(hours * 10) / 10,
  }
  const { error } =
    id && isUuid(id)
      ? await supabase.from('courses').update(row).eq('id', id)
      : await supabase.from('courses').insert(row)
  if (error) return { ok: false, error: 'Could not save course' }
  revalidatePath('/training')
  return { ok: true }
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  const { supabase } = await requireRole([...admins])
  if (!isUuid(id)) return { ok: false, error: 'Invalid course' }
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) return { ok: false, error: 'Could not delete course' }
  revalidatePath('/training')
  return { ok: true }
}

export async function saveNamedItem(
  table: 'departments' | 'skills',
  id: string | null,
  fd: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireRole([...admins])
  if (table !== 'departments' && table !== 'skills') return { ok: false, error: 'Invalid' }
  const nameEn = str(fd, 'name_en', 120)
  if (!nameEn) return { ok: false, error: 'Name is required' }
  const row: Record<string, string> = { name_en: nameEn, name_ar: str(fd, 'name_ar', 120) }
  if (table === 'skills') row.category = str(fd, 'category', 80) || 'General'
  const { error } =
    id && isUuid(id)
      ? await supabase.from(table).update(row).eq('id', id)
      : await supabase.from(table).insert(row)
  if (error) return { ok: false, error: 'Could not save' }
  revalidatePath('/settings')
  return { ok: true }
}

export async function deleteNamedItem(table: 'departments' | 'skills', id: string): Promise<ActionResult> {
  const { supabase } = await requireRole([...admins])
  if ((table !== 'departments' && table !== 'skills') || !isUuid(id)) return { ok: false, error: 'Invalid' }
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) return { ok: false, error: 'Could not delete' }
  revalidatePath('/settings')
  return { ok: true }
}

export async function saveOrganization(fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireRole(['super_admin'])
  const nameEn = str(fd, 'name_en', 120)
  if (!nameEn) return { ok: false, error: 'Name is required' }
  const { error } = await supabase
    .from('organization_settings')
    .update({ name_en: nameEn, name_ar: str(fd, 'name_ar', 120), updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) return { ok: false, error: 'Could not save' }
  revalidatePath('/', 'layout')
  return { ok: true }
}
