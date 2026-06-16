import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers').select('*').eq('id', user.id).single()

  const name = teacher?.name ?? 'Teacher'
  const email = user.email ?? ''

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account settings</p>
      </div>

      {/* Profile hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
          style={{ background: '#1E8449' }}>
          {getInitials(name)}
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{name}</p>
          <p className="text-sm text-gray-400">{email}</p>
          <span className="mt-1.5 inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: '#EAFAF1', color: '#1E8449' }}>
            Teacher
          </span>
        </div>
      </div>

      {/* Account details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Account Details</h2>
          <p className="text-xs text-gray-400 mt-0.5">Update your display name</p>
        </div>
        <div className="p-6">
          <ProfileForm teacherName={name} email={email} />
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Change Password</h2>
          <p className="text-xs text-gray-400 mt-0.5">Requires your current password</p>
        </div>
        <div className="p-6">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
