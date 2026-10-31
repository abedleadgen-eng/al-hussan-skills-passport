'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { isDate, isUuid, optStr, optUuid, str } from '@/lib/form'
import { ROLES, type ActionResult, type AppRole } from '@/lib/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function allowedRole(actor: AppRole, role: AppRole) {
  if (actor === 'super_admin') return true
  return role === 'manager' || role === 'employee'
}

function parseRole(value: string): AppRole {
  return (ROLES as string[]).includes(value) ? (value as AppRole) : 'employee'
}

function generatePassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Buffer.from(bytes).toString('base64url')
}

export async function createEmployee(fd: FormData): Promise<ActionResult> {
  const { profile: actor } = await requireRole(['super_admin', 'hr_admin'])
  const email = str(fd, 'email', 254).toLowerCase()
  const password = str(fd, 'password', 128)
  const role = parseRole(str(fd, 'role', 20))
  const hireDate = optStr(fd, 'hire_date', 10)
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Invalid email' }
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters' }
  if (!allowedRole(actor.role, role)) return { ok: false, error: 'You cannot assign this role' }
  if (hireDate && !isDate(hireDate)) return { ok: false, error: 'Invalid date' }

  const admin = createAdminClient()
  const fullName = str(fd, 'full_name', 120)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error || !data.user) {
    return { ok: false, error: error?.code === 'email_exists' ? 'Email already registered' : 'Could not create user' }
  }

  const { error: upErr } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      full_name_ar: str(fd, 'full_name_ar', 120),
      job_title: str(fd, 'job_title', 120),
      employee_code: optStr(fd, 'employee_code', 40),
      department_id: optUuid(fd, 'department_id'),
      manager_id: optUuid(fd, 'manager_id'),
      hire_date: hireDate,
      role,
    })
    .eq('id', data.user.id)
  if (upErr) {
    return { ok: false, error: upErr.code === '23505' ? 'Employee number already in use' : 'User created, profile update failed' }
  }
  revalidatePath('/employees')
  return { ok: true }
}

export async function updateEmployee(id: string, fd: FormData): Promise<ActionResult> {
  const { profile: actor, supabase } = await requireRole(['super_admin', 'hr_admin'])
  if (!isUuid(id)) return { ok: false, error: 'Invalid employee' }
  const hireDate = optStr(fd, 'hire_date', 10)
  if (hireDate && !isDate(hireDate)) return { ok: false, error: 'Invalid date' }
  const managerId = optUuid(fd, 'manager_id')
  if (managerId === id) return { ok: false, error: 'An employee cannot manage themselves' }

  const update: Record<string, unknown> = {
    full_name: str(fd, 'full_name', 120),
    full_name_ar: str(fd, 'full_name_ar', 120),
    job_title: str(fd, 'job_title', 120),
    employee_code: optStr(fd, 'employee_code', 40),
    department_id: optUuid(fd, 'department_id'),
    manager_id: managerId,
    hire_date: hireDate,
  }
  const roleRaw = str(fd, 'role', 20)
  if (roleRaw) {
    const role = parseRole(roleRaw)
    if (id === actor.id && role !== actor.role) return { ok: false, error: 'You cannot change your own role' }
    update.role = role
  }

  const { error } = await supabase.from('profiles').update(update).eq('id', id)
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Employee number already in use' }
    if (error.message.includes('Not allowed')) return { ok: false, error: 'You cannot assign this role' }
    return { ok: false, error: 'Could not update employee' }
  }
  revalidatePath('/employees')
  revalidatePath(`/employees/${id}`)
  revalidatePath('/settings')
  return { ok: true }
}

export async function deleteEmployee(id: string): Promise<ActionResult> {
  const { profile: actor } = await requireRole(['super_admin'])
  if (!isUuid(id) || id === actor.id) return { ok: false, error: 'Not allowed' }
  const admin = createAdminClient()
  const { data: files } = await admin.storage.from('certificates').list(id, { limit: 1000 })
  if (files?.length) await admin.storage.from('certificates').remove(files.map((f) => `${id}/${f.name}`))
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { ok: false, error: 'Could not delete employee' }
  revalidatePath('/employees')
  return { ok: true }
}

export type ImportRow = Record<string, string>
export type ImportResult = { row: number; email: string; ok: boolean; error?: string; password?: string }

export async function importEmployees(rows: ImportRow[]): Promise<{ results: ImportResult[] } | { error: string }> {
  const { profile: actor } = await requireRole(['super_admin', 'hr_admin'])
  if (!Array.isArray(rows) || rows.length === 0) return { error: 'No rows' }
  if (rows.length > 500) return { error: 'Maximum 500 rows per import' }

  const admin = createAdminClient()
  const [{ data: departments }, { data: existing }] = await Promise.all([
    admin.from('departments').select('id, name_en, name_ar'),
    admin.from('profiles').select('id, email'),
  ])
  const deptByName = new Map<string, string>()
  for (const d of departments ?? []) {
    deptByName.set(d.name_en.toLowerCase(), d.id)
    if (d.name_ar) deptByName.set(d.name_ar.toLowerCase(), d.id)
  }
  const idByEmail = new Map((existing ?? []).map((p) => [p.email.toLowerCase(), p.id as string]))

  const results: ImportResult[] = []
  const pendingManagers: { id: string; managerEmail: string; index: number }[] = []

  for (const [i, raw] of rows.entries()) {
    const get = (k: string, max = 200) => String(raw[k] ?? '').trim().slice(0, max)
    const email = get('email', 254).toLowerCase()
    const rowNo = i + 2
    if (!EMAIL_RE.test(email)) {
      results.push({ row: rowNo, email, ok: false, error: 'Invalid email' })
      continue
    }
    if (idByEmail.has(email)) {
      results.push({ row: rowNo, email, ok: false, error: 'Email already registered' })
      continue
    }
    const role = parseRole(get('role', 20).toLowerCase() || 'employee')
    if (!allowedRole(actor.role, role)) {
      results.push({ row: rowNo, email, ok: false, error: 'Role not permitted' })
      continue
    }
    const hireDate = get('hire_date', 10) || null
    if (hireDate && !isDate(hireDate)) {
      results.push({ row: rowNo, email, ok: false, error: 'Invalid hire_date' })
      continue
    }
    let deptId: string | null = null
    const deptName = get('department')
    if (deptName) {
      deptId = deptByName.get(deptName.toLowerCase()) ?? null
      if (!deptId) {
        const { data: created } = await admin.from('departments').insert({ name_en: deptName }).select('id').single()
        if (created) {
          deptId = created.id
          deptByName.set(deptName.toLowerCase(), created.id)
        }
      }
    }
    const provided = get('password', 128)
    const password = provided.length >= 8 ? provided : generatePassword()
    const fullName = get('full_name', 120)

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (error || !data.user) {
      results.push({ row: rowNo, email, ok: false, error: 'Could not create user' })
      continue
    }
    const { error: upErr } = await admin
      .from('profiles')
      .update({
        full_name: fullName,
        full_name_ar: get('full_name_ar', 120),
        job_title: get('job_title', 120),
        employee_code: get('employee_code', 40) || null,
        department_id: deptId,
        hire_date: hireDate,
        role,
      })
      .eq('id', data.user.id)
    idByEmail.set(email, data.user.id)
    const managerEmail = get('manager_email', 254).toLowerCase()
    if (managerEmail) pendingManagers.push({ id: data.user.id, managerEmail, index: results.length })
    results.push({
      row: rowNo,
      email,
      ok: true,
      error: upErr ? (upErr.code === '23505' ? 'Duplicate employee number (skipped)' : 'Profile details not saved') : undefined,
      password: provided.length >= 8 ? undefined : password,
    })
  }

  for (const p of pendingManagers) {
    const managerId = idByEmail.get(p.managerEmail)
    if (managerId && managerId !== p.id) {
      await admin.from('profiles').update({ manager_id: managerId }).eq('id', p.id)
    } else {
      results[p.index].error = 'Manager email not found'
    }
  }

  revalidatePath('/employees')
  return { results }
}
