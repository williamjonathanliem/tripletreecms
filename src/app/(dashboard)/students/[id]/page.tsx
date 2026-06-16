import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditStudentDialog } from '@/components/students/EditStudentDialog'
import { CURRICULUM } from '@/lib/curriculum'
import { TIER_COLORS } from '@/types'
import { Phone, Calendar, StickyNote, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const STATUS_STYLES = {
  present: 'bg-green-50 text-green-700 border-green-200',
  absent: 'bg-red-50 text-red-700 border-red-200',
  late: 'bg-amber-50 text-amber-700 border-amber-200',
  excused: 'bg-blue-50 text-blue-700 border-blue-200',
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', params.id)
    .eq('teacher_id', user.id)
    .single()

  if (!student) notFound()

  const { data: attendanceRecords } = await supabase
    .from('attendance')
    .select('*, class:classes(tier, branch, session_date, session_time)')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const modules = CURRICULUM[student.tier] ?? []
  const color = TIER_COLORS[student.tier] || '#6B7280'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/students">
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500 hover:text-gray-900 -ml-2">
            <ChevronLeft className="w-4 h-4" /> Students
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: color }}
          >
            {getInitials(student.name)}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{student.name}</h1>
            <p className="text-sm text-gray-500">Age {student.age} · {student.tier}</p>
          </div>
        </div>
        <EditStudentDialog student={student} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="border-gray-200 shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-gray-500 mb-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs">Branch</span>
            </div>
            <p className="font-medium text-gray-900">{student.branch}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-gray-500 mb-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs">Enrolled</span>
            </div>
            <p className="font-medium text-gray-900">{student.enrolled_date}</p>
          </CardContent>
        </Card>
        {student.parent_contact && (
          <Card className="border-gray-200 shadow-none">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 mb-0.5">
                <Phone className="w-3.5 h-3.5" />
                <span className="text-xs">Parent Contact</span>
              </div>
              <p className="font-medium text-gray-900">{student.parent_contact}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {student.notes && (
        <Card className="border-gray-200 shadow-none">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1.5">
              <StickyNote className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Notes</span>
            </div>
            <p className="text-sm text-gray-700">{student.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Module Progress */}
      <Card className="border-gray-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900">
            Curriculum Progress — {student.tier}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {modules.map((module, idx) => {
              const isDone = idx < student.module_current
              const isCurrent = idx === student.module_current
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                    isCurrent
                      ? 'bg-blue-50 border border-blue-200'
                      : isDone
                      ? 'bg-gray-50'
                      : 'opacity-50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isDone
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'border-2 border-blue-500 text-blue-500'
                        : 'border border-gray-300 text-gray-400'
                    }`}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <span className={`text-sm ${isCurrent ? 'font-semibold text-blue-800' : isDone ? 'text-gray-700' : 'text-gray-400'}`}>
                    {module}
                  </span>
                  {isCurrent && (
                    <Badge className="ml-auto text-xs bg-blue-100 text-blue-700 border-blue-200">Current</Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card className="border-gray-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900">Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          {!attendanceRecords || attendanceRecords.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No attendance records yet.</p>
          ) : (
            <div className="space-y-2">
              {attendanceRecords.map(record => (
                <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">
                      {(record.class as { tier?: string })?.tier} · {(record.class as { branch?: string })?.branch}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(record.class as { session_date?: string })?.session_date} {(record.class as { session_time?: string })?.session_time?.slice(0, 5)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`text-xs capitalize ${STATUS_STYLES[record.status as keyof typeof STATUS_STYLES]}`}>
                      {record.status}
                    </Badge>
                    {record.note && <p className="text-xs text-gray-400 mt-0.5">{record.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
