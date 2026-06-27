import { createClient } from '@/lib/supabase/server'
import type { Subject } from '@/types'

export type TeacherContext = {
  id: string
  name: string
  email: string
  role: 'teacher' | 'hr'
  subjects: Subject[]
}

export async function getTeacherContext(): Promise<TeacherContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('teachers')
    .select('id, name, email, role, subjects')
    .eq('id', user.id)
    .single()

  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: (data.role ?? 'teacher') as 'teacher' | 'hr',
    subjects: (data.subjects ?? ['coding']) as Subject[],
  }
}

export function isHR(ctx: TeacherContext | null): boolean {
  return ctx?.role === 'hr'
}
