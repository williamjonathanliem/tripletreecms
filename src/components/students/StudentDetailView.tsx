'use client'

import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'
import { EditStudentDialog } from '@/components/students/EditStudentDialog'
import { FeeStatusCard } from '@/components/students/FeeStatusCard'
import { ModuleProgressCard } from '@/components/students/ModuleProgressCard'
import { TIER_COLORS, SUBJECT_META, type Subject, type Student } from '@/types'
import { Phone, Calendar, StickyNote, ChevronLeft, ClipboardList, MessageCircle, BookOpen, Send, FileDown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { downloadProgressReport } from '@/components/students/ProgressReportPDF'

type AttendanceRecord = {
  id: string
  status: string
  note?: string | null
  class: { tier?: string; branch?: string } | null
  session: { session_date?: string; session_time?: string } | null
}

type StudentDetailViewProps = {
  student: Record<string, unknown>
  teacher: { name: string } | null
  attendanceRecords: AttendanceRecord[]
  modules: string[]
  subject: Subject
  isHR: boolean
}

const STATUS_STYLES: Record<string, string> = {
  present: 'bg-green-50 text-green-700 border border-green-200',
  absent:  'bg-red-50 text-red-700 border border-red-200',
  late:    'bg-amber-50 text-amber-700 border border-amber-200',
  excused: 'bg-blue-50 text-blue-700 border border-blue-200',
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function StudentDetailView({
  student, teacher, attendanceRecords, modules, subject, isHR,
}: StudentDetailViewProps) {
  const { lang } = useCmsLang()
  const sd = CMS_T[lang].student_detail
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState((student.parent_email as string) ?? '')
  const [downloadingReport, setDownloadingReport] = useState(false)

  async function handleDownloadReport() {
    setDownloadingReport(true)
    const present = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length
    await downloadProgressReport({
      studentName: student.name as string,
      age: student.age as number,
      tier: student.tier as string,
      branch: student.branch as string,
      subject: subject,
      teacherName: teacher?.name ?? 'Teacher',
      enrolledDate: student.enrolled_date
        ? new Date((student.enrolled_date as string) + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
        : '—',
      moduleCurrent: student.module_current as number,
      moduleTotal: student.module_total as number,
      modules,
      attendancePresent: present,
      attendanceTotal: attendanceRecords.length,
      feeStatus: (student.fee_status as 'paid' | 'unpaid' | 'partial') ?? 'unpaid',
      feeNote: student.fee_note as string | null,
      generatedDate: new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' }),
    })
    setDownloadingReport(false)
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    const res = await fetch('/api/invite-parent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: student.id, email: inviteEmail.trim() }),
    })
    setInviting(false)
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Failed to send invite')
      return
    }
    if (json.method === 'existing') {
      toast.info(`${inviteEmail} already has an account — they can log in at /parent-login`)
    } else if (json.method === 'magic') {
      toast.success(`Login link sent to ${inviteEmail}`)
    } else {
      toast.success(`Invite email sent to ${inviteEmail}`)
    }
  }

  const name = student.name as string
  const age = student.age as number
  const tier = student.tier as string
  const branch = student.branch as string
  const color = TIER_COLORS[tier] || SUBJECT_META[subject]?.color || '#6B7280'

  const done = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length
  const total = attendanceRecords.length
  const attendancePct = total > 0 ? Math.round((done / total) * 100) : null

  function toWhatsApp(phone: string) {
    const digits = phone.replace(/\D/g, '')
    const intl = digits.startsWith('60') ? digits : `60${digits.replace(/^0/, '')}`
    const msg = encodeURIComponent(sd.wa_message.replace('{name}', name))
    return `https://wa.me/${intl}?text=${msg}`
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-4">

      <Link href="/students"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors">
        <ChevronLeft className="w-4 h-4" /> {sd.back}
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: color }} />
        <div className="px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ backgroundColor: color }}>
              {getInitials(name)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{sd.age_label} {age} · {tier}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {subject && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ color: SUBJECT_META[subject]?.color, background: SUBJECT_META[subject]?.bg }}>
                    {SUBJECT_META[subject]?.label}
                  </span>
                )}
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: color }}>{branch}</span>
                {attendancePct !== null && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {attendancePct}{sd.attendance_badge}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadReport} disabled={downloadingReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
              <FileDown className="w-3.5 h-3.5" />
              {downloadingReport ? 'Generating…' : 'Report'}
            </button>
            <EditStudentDialog student={student as unknown as Student} />
          </div>
        </div>

        {/* Info row */}
        <div className="border-t border-gray-50 grid grid-cols-2 sm:grid-cols-3 divide-x divide-gray-50">
          <div className="px-5 py-3.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <Calendar className="w-3.5 h-3.5" /> {sd.enrolled}
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {student.enrolled_date ? formatDate(student.enrolled_date as string) : '—'}
            </p>
          </div>
          <div className="px-5 py-3.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <BookOpen className="w-3.5 h-3.5" /> {sd.module}
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {(student.module_current as number) + 1} / {modules.length || (student.module_total as number) || '—'}
            </p>
          </div>
          {!!(student.parent_contact) && (
            <div className="px-5 py-3.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <Phone className="w-3.5 h-3.5" /> {sd.parent_contact}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-800">{student.parent_contact as string}</p>
                <a href={toWhatsApp(student.parent_contact as string)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                  <MessageCircle className="w-3 h-3" /> {sd.whatsapp}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fee Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">{sd.fee_section}</h2>
        </div>
        <div className="px-6 py-4">
          <FeeStatusCard
            studentId={student.id as string}
            initialStatus={((student.fee_status as string) ?? 'unpaid') as 'paid' | 'unpaid' | 'partial'}
            initialNote={(student.fee_note as string) ?? null}
            studentName={name}
            tier={tier}
            branch={branch}
            subject={student.subject as string}
            teacherName={teacher?.name ?? 'Teacher'}
            readOnly={!isHR}
          />
        </div>
      </div>

      {/* Parent Portal Invite — HR only */}
      {isHR && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
            <Send className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">Parent Portal Access</h2>
          </div>
          <div className="px-6 py-4">
            <p className="text-xs text-gray-400 mb-3">
              Enter the parent&apos;s email to give them read-only access to their child&apos;s progress.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="parent@email.com"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300"
              />
              <button
                onClick={sendInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors shrink-0"
                style={{ background: '#1A5276' }}>
                {inviting ? '...' : 'Send Invite'}
              </button>
            </div>
            {!!(student.parent_email) && (
              <p className="text-xs text-green-600 mt-2">
                ✓ Portal access: {student.parent_email as string}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {!!(student.notes) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
            <StickyNote className="w-3.5 h-3.5" /> {sd.notes_section}
          </div>
          <p className="text-sm text-gray-700">{student.notes as string}</p>
        </div>
      )}

      {/* Curriculum Progress */}
      <ModuleProgressCard
        studentId={student.id as string}
        studentName={name}
        tier={tier}
        subject={subject}
        moduleCurrent={student.module_current as number}
        moduleTotal={student.module_total as number}
        modules={modules}
      />

      {/* Attendance History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-bold text-gray-900">{sd.attendance_section}</h2>
          {total > 0 && (
            <span className="ml-auto text-xs text-gray-400">{done}/{total} {sd.sessions_attended}</span>
          )}
        </div>
        <div className="px-6 py-4">
          {attendanceRecords.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{sd.no_attendance}</p>
          ) : (
            <div className="space-y-2">
              {attendanceRecords.map(record => (
                <div key={record.id}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {record.class?.tier}
                      {record.class?.branch && <span className="text-gray-400 font-normal"> · {record.class.branch}</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {record.session?.session_date}
                      {record.session?.session_time && <> · {record.session.session_time.slice(0, 5)}</>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block text-xs font-semibold capitalize px-2.5 py-0.5 rounded-full ${STATUS_STYLES[record.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {record.status}
                    </span>
                    {record.note && <p className="text-xs text-gray-400 mt-0.5">{record.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
