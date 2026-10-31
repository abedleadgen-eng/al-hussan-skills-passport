import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Achievement, Completion, Department, EmployeeSkill, Evaluation, Profile } from '@/lib/types'

type NameRow = { id: string; full_name: string; full_name_ar: string }

export type PassportData = {
  profile: Profile
  department: Department | null
  manager: Pick<Profile, 'full_name' | 'full_name_ar'> | null
  completions: Completion[]
  achievements: Achievement[]
  skills: EmployeeSkill[]
  evaluations: Evaluation[]
  totalHours: number
  certUrls: Record<string, string>
}

export async function getPassportData(supabase: SupabaseClient, employeeId: string): Promise<PassportData | null> {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', employeeId).maybeSingle<Profile>()
  if (!profile) return null

  const [dept, completions, achievements, skills, evaluations] = await Promise.all([
    profile.department_id
      ? supabase.from('departments').select('id, name_en, name_ar').eq('id', profile.department_id).maybeSingle<Department>()
      : Promise.resolve({ data: null }),
    supabase
      .from('course_completions')
      .select('id, employee_id, course_id, completed_at, score, certificate_path, courses(*)')
      .eq('employee_id', employeeId)
      .order('completed_at', { ascending: false })
      .returns<Completion[]>(),
    supabase
      .from('achievements')
      .select('*')
      .eq('employee_id', employeeId)
      .order('awarded_at', { ascending: false })
      .returns<Achievement[]>(),
    supabase
      .from('employee_skills')
      .select('skill_id, level, skills(*)')
      .eq('employee_id', employeeId)
      .order('level', { ascending: false })
      .returns<EmployeeSkill[]>(),
    supabase
      .from('evaluations')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .returns<Omit<Evaluation, 'evaluator'>[]>(),
  ])

  const evalRows = evaluations.data ?? []
  const nameIds = Array.from(
    new Set([...(profile.manager_id ? [profile.manager_id] : []), ...evalRows.map((e) => e.evaluator_id)]),
  )
  const { data: names } = nameIds.length
    ? await supabase.rpc('profile_names', { ids: nameIds }).returns<NameRow[]>()
    : { data: [] as NameRow[] }
  const nameMap = new Map((names ?? []).map((n) => [n.id, { full_name: n.full_name, full_name_ar: n.full_name_ar }]))

  const list = completions.data ?? []
  const paths = list.map((c) => c.certificate_path).filter((p): p is string => !!p)
  const certUrls: Record<string, string> = {}
  if (paths.length) {
    const { data: signed } = await supabase.storage.from('certificates').createSignedUrls(paths, 60 * 60)
    for (const s of signed ?? []) if (s.path && s.signedUrl) certUrls[s.path] = s.signedUrl
  }
  return {
    certUrls,
    profile,
    department: dept.data ?? null,
    manager: profile.manager_id ? (nameMap.get(profile.manager_id) ?? null) : null,
    completions: list,
    achievements: achievements.data ?? [],
    skills: skills.data ?? [],
    evaluations: evalRows.map((e) => ({ ...e, evaluator: nameMap.get(e.evaluator_id) ?? null })),
    totalHours: list.reduce((sum, c) => sum + Number(c.courses?.hours ?? 0), 0),
  }
}
