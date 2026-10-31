import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Achievement, Completion, Department, EmployeeSkill, Evaluation, Profile } from '@/lib/types'

export type PassportData = {
  profile: Profile
  department: Department | null
  manager: Pick<Profile, 'full_name' | 'full_name_ar'> | null
  completions: Completion[]
  achievements: Achievement[]
  skills: EmployeeSkill[]
  evaluations: Evaluation[]
  totalHours: number
}

export async function getPassportData(supabase: SupabaseClient, employeeId: string): Promise<PassportData | null> {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', employeeId).maybeSingle<Profile>()
  if (!profile) return null

  const [dept, manager, completions, achievements, skills, evaluations] = await Promise.all([
    profile.department_id
      ? supabase.from('departments').select('id, name_en, name_ar').eq('id', profile.department_id).maybeSingle<Department>()
      : Promise.resolve({ data: null }),
    profile.manager_id
      ? supabase.rpc('get_manager_name', { emp: employeeId }).maybeSingle<{ full_name: string; full_name_ar: string }>()
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
      .select('*, evaluator:profiles!evaluations_evaluator_id_fkey(full_name, full_name_ar)')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .returns<Evaluation[]>(),
  ])

  const list = completions.data ?? []
  return {
    profile,
    department: dept.data ?? null,
    manager: manager.data ?? null,
    completions: list,
    achievements: achievements.data ?? [],
    skills: skills.data ?? [],
    evaluations: evaluations.data ?? [],
    totalHours: list.reduce((sum, c) => sum + Number(c.courses?.hours ?? 0), 0),
  }
}
