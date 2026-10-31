'use server'

import { revalidatePath } from 'next/cache'
import { requireSession, isAdminRole } from '@/lib/auth'
import { int, isDate, isUuid, str } from '@/lib/form'
import type { ActionResult } from '@/lib/types'

const MAX_CERT_BYTES = 5 * 1024 * 1024
const CERT_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

async function canManage(employeeId: string) {
  const session = await requireSession()
  if (isAdminRole(session.profile.role)) return { session, admin: true }
  const { data } = await session.supabase
    .from('profiles')
    .select('id')
    .eq('id', employeeId)
    .eq('manager_id', session.profile.id)
    .maybeSingle()
  return { session, admin: false, isManager: !!data }
}

function done(employeeId: string): ActionResult {
  revalidatePath(`/employees/${employeeId}`)
  revalidatePath('/passport')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function recordCompletion(employeeId: string, fd: FormData): Promise<ActionResult> {
  if (!isUuid(employeeId)) return { ok: false, error: 'Invalid employee' }
  const { session, admin } = await canManage(employeeId)
  if (!admin) return { ok: false, error: 'Not allowed' }

  const courseId = str(fd, 'course_id', 64)
  const completedAt = str(fd, 'completed_at', 10)
  const score = int(fd, 'score', 0, 100)
  if (!isUuid(courseId)) return { ok: false, error: 'Choose a course' }
  if (!isDate(completedAt)) return { ok: false, error: 'Invalid date' }
  if (Number.isNaN(score)) return { ok: false, error: 'Score must be 0-100' }

  let certificatePath: string | null = null
  const file = fd.get('certificate')
  if (file instanceof File && file.size > 0) {
    const ext = CERT_TYPES[file.type]
    if (!ext) return { ok: false, error: 'Certificate must be PDF, PNG, JPG, or WEBP' }
    if (file.size > MAX_CERT_BYTES) return { ok: false, error: 'Certificate exceeds 5 MB' }
    certificatePath = `${employeeId}/${crypto.randomUUID()}.${ext}`
    const { error } = await session.supabase.storage
      .from('certificates')
      .upload(certificatePath, file, { contentType: file.type, upsert: false })
    if (error) return { ok: false, error: 'Certificate upload failed' }
  }

  const { error } = await session.supabase.from('course_completions').upsert(
    {
      employee_id: employeeId,
      course_id: courseId,
      completed_at: completedAt,
      score,
      ...(certificatePath ? { certificate_path: certificatePath } : {}),
    },
    { onConflict: 'employee_id,course_id' },
  )
  if (error) return { ok: false, error: 'Could not save completion' }
  return done(employeeId)
}

export async function deleteCompletion(employeeId: string, id: string): Promise<ActionResult> {
  if (!isUuid(employeeId) || !isUuid(id)) return { ok: false, error: 'Invalid request' }
  const { session, admin } = await canManage(employeeId)
  if (!admin) return { ok: false, error: 'Not allowed' }
  const { data } = await session.supabase
    .from('course_completions')
    .delete()
    .eq('id', id)
    .eq('employee_id', employeeId)
    .select('certificate_path')
    .maybeSingle()
  if (data?.certificate_path) await session.supabase.storage.from('certificates').remove([data.certificate_path])
  return done(employeeId)
}

export async function addAchievement(employeeId: string, fd: FormData): Promise<ActionResult> {
  if (!isUuid(employeeId)) return { ok: false, error: 'Invalid employee' }
  const { session, admin, isManager } = await canManage(employeeId)
  if (!admin && !isManager) return { ok: false, error: 'Not allowed' }
  const titleEn = str(fd, 'title_en', 200)
  const awardedAt = str(fd, 'awarded_at', 10)
  if (!titleEn) return { ok: false, error: 'Title is required' }
  if (!isDate(awardedAt)) return { ok: false, error: 'Invalid date' }
  const { error } = await session.supabase.from('achievements').insert({
    employee_id: employeeId,
    title_en: titleEn,
    title_ar: str(fd, 'title_ar', 200),
    description: str(fd, 'description', 1000),
    awarded_at: awardedAt,
  })
  if (error) return { ok: false, error: 'Could not save achievement' }
  return done(employeeId)
}

export async function deleteAchievement(employeeId: string, id: string): Promise<ActionResult> {
  if (!isUuid(employeeId) || !isUuid(id)) return { ok: false, error: 'Invalid request' }
  const { session, admin, isManager } = await canManage(employeeId)
  if (!admin && !isManager) return { ok: false, error: 'Not allowed' }
  await session.supabase.from('achievements').delete().eq('id', id).eq('employee_id', employeeId)
  return done(employeeId)
}

export async function rateSkill(employeeId: string, fd: FormData): Promise<ActionResult> {
  if (!isUuid(employeeId)) return { ok: false, error: 'Invalid employee' }
  const { session, admin, isManager } = await canManage(employeeId)
  if (!admin && !isManager) return { ok: false, error: 'Not allowed' }
  const skillId = str(fd, 'skill_id', 64)
  const level = int(fd, 'level', 1, 5)
  if (!isUuid(skillId)) return { ok: false, error: 'Choose a skill' }
  if (level === null || Number.isNaN(level)) return { ok: false, error: 'Level must be 1-5' }
  const { error } = await session.supabase
    .from('employee_skills')
    .upsert({ employee_id: employeeId, skill_id: skillId, level, updated_at: new Date().toISOString() })
  if (error) return { ok: false, error: 'Could not save skill' }
  return done(employeeId)
}

export async function removeSkill(employeeId: string, skillId: string): Promise<ActionResult> {
  if (!isUuid(employeeId) || !isUuid(skillId)) return { ok: false, error: 'Invalid request' }
  const { session, admin, isManager } = await canManage(employeeId)
  if (!admin && !isManager) return { ok: false, error: 'Not allowed' }
  await session.supabase.from('employee_skills').delete().eq('employee_id', employeeId).eq('skill_id', skillId)
  return done(employeeId)
}

export async function addEvaluation(employeeId: string, fd: FormData): Promise<ActionResult> {
  if (!isUuid(employeeId)) return { ok: false, error: 'Invalid employee' }
  const { session, admin, isManager } = await canManage(employeeId)
  if (!admin && !isManager) return { ok: false, error: 'Not allowed' }
  if (employeeId === session.profile.id) return { ok: false, error: 'You cannot evaluate yourself' }
  const period = str(fd, 'period', 60)
  const rating = int(fd, 'rating', 1, 5)
  if (!period) return { ok: false, error: 'Period is required' }
  if (rating === null || Number.isNaN(rating)) return { ok: false, error: 'Rating must be 1-5' }
  const { error } = await session.supabase.from('evaluations').insert({
    employee_id: employeeId,
    evaluator_id: session.profile.id,
    period,
    rating,
    strengths: str(fd, 'strengths', 2000),
    improvements: str(fd, 'improvements', 2000),
  })
  if (error) return { ok: false, error: 'Could not save evaluation' }
  return done(employeeId)
}

export async function deleteEvaluation(employeeId: string, id: string): Promise<ActionResult> {
  if (!isUuid(employeeId) || !isUuid(id)) return { ok: false, error: 'Invalid request' }
  const session = await requireSession()
  await session.supabase.from('evaluations').delete().eq('id', id).eq('employee_id', employeeId)
  return done(employeeId)
}
