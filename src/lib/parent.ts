import { createClient } from '@/lib/supabase/server'

export type ParentContext = {
  userId: string
  email: string
}

export async function getParentContext(): Promise<ParentContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  // Teachers are not parents — check the teachers table
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (teacher) return null

  return { userId: user.id, email: user.email }
}
