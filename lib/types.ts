export type AppRole = 'super_admin' | 'hr_admin' | 'manager' | 'employee'

export const ROLES: AppRole[] = ['super_admin', 'hr_admin', 'manager', 'employee']

export type Profile = {
  id: string
  email: string
  full_name: string
  full_name_ar: string
  role: AppRole
  job_title: string
  employee_code: string | null
  department_id: string | null
  manager_id: string | null
  hire_date: string | null
  created_at: string
}

export type Department = { id: string; name_en: string; name_ar: string }

export type Skill = { id: string; name_en: string; name_ar: string; category: string }

export type Course = {
  id: string
  title_en: string
  title_ar: string
  description: string
  provider: string
  category: string
  hours: number
}

export type Completion = {
  id: string
  employee_id: string
  course_id: string
  completed_at: string
  score: number | null
  certificate_path: string | null
  courses: Course | null
}

export type Achievement = {
  id: string
  employee_id: string
  title_en: string
  title_ar: string
  description: string
  awarded_at: string
}

export type Evaluation = {
  id: string
  employee_id: string
  evaluator_id: string
  period: string
  rating: number
  strengths: string
  improvements: string
  created_at: string
  evaluator: { full_name: string; full_name_ar: string } | null
}

export type EmployeeSkill = {
  skill_id: string
  level: number
  skills: Skill | null
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }
