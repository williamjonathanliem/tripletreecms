import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfilePageView } from '@/components/profile/ProfilePageView'
import type { Subject } from '@/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers').select('*').eq('id', user.id).single()

  return (
    <ProfilePageView
      name={teacher?.name ?? 'Teacher'}
      email={user.email ?? ''}
      role={teacher?.role ?? 'teacher'}
      subjects={(teacher?.subjects ?? []) as Subject[]}
      teacherId={user.id}
    />
  )
}
