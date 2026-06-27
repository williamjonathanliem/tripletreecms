'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Loader2, Trash2, Video } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { SUBJECTS, SUBJECT_META, type Subject, type ScheduleEvent } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

// ── Time grid config ──────────────────────────────────────────────
const HOUR_START = 7
const HOUR_END   = 21
const HOUR_PX    = 64

function timeToY(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return ((h - HOUR_START) + m / 60) * HOUR_PX
}

function yToTime(y: number): string {
  const totalMins = Math.round((y / HOUR_PX) * 60)
  const h = HOUR_START + Math.floor(totalMins / 60)
  const m = totalMins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatHour(h: number) {
  return h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' })
}

function isoDate(d: Date) {
  return d.toISOString().split('T')[0]
}

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

function startOfWeek(d: Date) {
  const r = new Date(d); r.setDate(r.getDate() - r.getDay() + 1); return r
}

// ── Event Modal ───────────────────────────────────────────────────
interface ModalProps {
  event?: ScheduleEvent | null
  prefillDate?: string
  prefillTime?: string
  teachers: { id: string; name: string; subjects: Subject[] }[]
  classes: { id: string; tier: string; branch: string; subject: Subject }[]
  onClose: () => void
  onSaved: (e: ScheduleEvent) => void
  onDeleted?: (id: string) => void
}

function EventModal({ event, prefillDate, prefillTime, teachers, classes, onClose, onSaved, onDeleted }: ModalProps) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang].schedule

  const EVENT_TYPES = [
    { value: 'class',   label: t.type_class },
    { value: 'trial',   label: t.type_trial },
    { value: 'makeup',  label: t.type_makeup },
    { value: 'exam',    label: t.type_exam },
    { value: 'holiday', label: t.type_holiday },
    { value: 'other',   label: t.type_other },
  ]

  const [title, setTitle] = useState(event?.title ?? '')
  const [subject, setSubject] = useState<Subject>(event?.subject ?? 'coding')
  const [teacherId, setTeacherId] = useState<string>(event?.teacher_id ?? '')
  const [classId, setClassId] = useState<string>(event?.class_id ?? '')
  const [date, setDate] = useState(event?.event_date ?? prefillDate ?? isoDate(new Date()))
  const [startTime, setStartTime] = useState(event?.start_time?.slice(0, 5) ?? prefillTime ?? '09:00')
  const [endTime, setEndTime] = useState(event?.end_time?.slice(0, 5) ?? '10:00')
  const [eventType, setEventType] = useState<ScheduleEvent['event_type']>(event?.event_type ?? 'class')
  const [description, setDescription] = useState(event?.description ?? '')
  const [meetingLink, setMeetingLink] = useState(event?.meeting_link ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  const filteredTeachers = teachers.filter(t => t.subjects?.includes(subject))
  const filteredClasses = classes.filter(c => c.subject === subject)

  async function handleSave() {
    if (!title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    const payload = {
      title: title.trim(), subject,
      teacher_id: teacherId || null,
      class_id: classId || null,
      event_date: date,
      start_time: startTime,
      end_time: endTime,
      event_type: eventType,
      description: description || null,
      meeting_link: meetingLink.trim() || null,
    }
    let result: ScheduleEvent | null = null
    if (event) {
      const { data, error } = await supabase.from('schedule_events').update(payload).eq('id', event.id).select().single()
      if (error) { toast.error('Failed to update'); setSaving(false); return }
      result = data as ScheduleEvent
    } else {
      const { data, error } = await supabase.from('schedule_events').insert(payload).select().single()
      if (error) { toast.error('Failed to create'); setSaving(false); return }
      result = data as ScheduleEvent
    }
    setSaving(false)
    toast.success(event ? 'Event updated' : 'Event created')
    onSaved(result!)
    onClose()
  }

  async function handleDelete() {
    if (!event) return
    setDeleting(true)
    const { error } = await supabase.from('schedule_events').delete().eq('id', event.id)
    setDeleting(false)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Event deleted')
    onDeleted?.(event.id)
    onClose()
  }

  const meta = SUBJECT_META[subject]

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? t.modal_edit_title : t.modal_new_title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>{t.title_label}</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t.title_placeholder}
            />
          </div>

          {/* Subject chips */}
          <div className="space-y-1.5">
            <Label>{t.subject_label}</Label>
            <div className="flex gap-1.5 flex-wrap">
              {SUBJECTS.map(s => {
                const m = SUBJECT_META[s]
                const sel = subject === s
                return (
                  <button
                    key={s} type="button"
                    onClick={() => { setSubject(s); setTeacherId(''); setClassId('') }}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={sel
                      ? { color: m.color, background: m.bg, borderColor: m.color }
                      : { color: '#9CA3AF', borderColor: '#E5E7EB', background: 'white' }}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t.date_label}</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.type_label}</Label>
              <Select value={eventType} onValueChange={v => setEventType(v as ScheduleEvent['event_type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start + End time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t.start_time}</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.end_time}</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          {/* Assign Teacher */}
          <div className="space-y-1.5">
            <Label>
              {t.assign_teacher}
              <span className="ml-1 font-normal text-gray-400 text-xs">
                ({filteredTeachers.length} {t.teaches_subject} {meta.label})
              </span>
            </Label>
            <Select
              value={teacherId || '__none__'}
              onValueChange={v => setTeacherId(v === '__none__' ? '' : (v ?? ''))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.unassigned} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t.unassigned}</SelectItem>
                {filteredTeachers.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-400">{t.no_teachers_subject}</div>
                )}
                {filteredTeachers.map(tc => (
                  <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Link to class */}
          <div className="space-y-1.5">
            <Label>
              {t.link_class}
              <span className="ml-1 font-normal text-gray-400 text-xs">{t.optional}</span>
            </Label>
            <Select
              value={classId || '__none__'}
              onValueChange={v => setClassId(v === '__none__' ? '' : (v ?? ''))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.none} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t.none}</SelectItem>
                {filteredClasses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.tier} · {c.branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>
              {t.notes_label}
              <span className="ml-1 font-normal text-gray-400 text-xs">{t.optional}</span>
            </Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder={t.notes_placeholder}
              className="resize-none"
            />
          </div>

          {/* Online class link */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-gray-400" />
              {t.meeting_link_label}
              <span className="ml-1 font-normal text-gray-400 text-xs">{t.optional}</span>
            </Label>
            <Input
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              placeholder={t.meeting_link_placeholder}
              type="url"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ background: '#1A5276' }}
              className="text-white hover:opacity-90"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              {event ? t.update_btn : t.create_btn}
            </Button>
            <Button variant="outline" onClick={onClose}>{t.cancel}</Button>
          </div>
          {event && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              {deleting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><Trash2 className="w-3.5 h-3.5 mr-1" />{t.delete_btn}</>
              }
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Event Block ────────────────────────────────────────────────────
function EventBlock({ event, onClick }: { event: ScheduleEvent; onClick: () => void }) {
  const meta = SUBJECT_META[event.subject]
  const top = timeToY(event.start_time)
  const height = Math.max(timeToY(event.end_time) - top, 22)
  return (
    <button
      onClick={onClick}
      className="absolute left-1 right-1 rounded-lg px-2 py-1 text-left overflow-hidden hover:brightness-95 transition-all shadow-sm border"
      style={{
        top,
        height,
        background: meta?.bg ?? '#F3F4F6',
        borderColor: `${meta?.color ?? '#6B7280'}40`,
        borderLeft: `3px solid ${meta?.color ?? '#6B7280'}`,
      }}
    >
      <div className="flex items-center gap-1">
        <p className="text-[11px] font-bold leading-snug truncate flex-1" style={{ color: meta?.color }}>{event.title}</p>
        {event.meeting_link && <Video className="w-2.5 h-2.5 shrink-0" style={{ color: meta?.color, opacity: 0.7 }} />}
      </div>
      {height > 32 && (
        <p className="text-[10px] leading-snug truncate" style={{ color: meta?.color, opacity: 0.65 }}>
          {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
        </p>
      )}
    </button>
  )
}

// ── Time Grid Column ───────────────────────────────────────────────
function DayColumn({ date, events, canEdit, onSlotClick, onEventClick }: {
  date: Date
  events: ScheduleEvent[]
  canEdit: boolean
  onSlotClick: (date: string, time: string) => void
  onEventClick: (e: ScheduleEvent) => void
}) {
  const totalH = (HOUR_END - HOUR_START) * HOUR_PX
  const dateStr = isoDate(date)
  const dayEvents = events.filter(e => e.event_date === dateStr)
  const isToday = dateStr === isoDate(new Date())

  return (
    <div className="flex-1 relative" style={{ height: totalH }}>
      {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
        <div key={i} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: i * HOUR_PX }} />
      ))}
      {canEdit && (
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={e => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            const y = e.clientY - rect.top
            onSlotClick(dateStr, yToTime(y))
          }}
        />
      )}
      {dayEvents.map(ev => (
        <EventBlock key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
      ))}
      {isToday && <div className="absolute inset-0 bg-blue-50/20 pointer-events-none" />}
    </div>
  )
}

// ── Main Calendar ──────────────────────────────────────────────────
interface CalendarProps {
  initialEvents: ScheduleEvent[]
  teachers: { id: string; name: string; subjects: Subject[] }[]
  classes: { id: string; tier: string; branch: string; subject: Subject }[]
  canEdit: boolean
  subjectFilter?: Subject[]
  showHeader?: boolean
}

export function ScheduleCalendar({ initialEvents, teachers, classes, canEdit, subjectFilter, showHeader }: CalendarProps) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang].schedule

  const [view, setView] = useState<'day' | 'week'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents)
  const [activeSubjects, setActiveSubjects] = useState<Subject[]>(subjectFilter ?? SUBJECTS)
  const [modal, setModal] = useState<{ open: boolean; event?: ScheduleEvent | null; date?: string; time?: string }>({ open: false })
  const [teacherFilter, setTeacherFilter] = useState<string>('')

  const weekStart = startOfWeek(currentDate)
  const days = view === 'week'
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    : [currentDate]

  function navigate(dir: number) {
    setCurrentDate(d => addDays(d, dir * (view === 'week' ? 7 : 1)))
  }

  function toggleSubject(s: Subject) {
    setActiveSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const filtered = useMemo(() => {
    return events
      .filter(e => activeSubjects.includes(e.subject))
      .filter(e => !teacherFilter || e.teacher_id === teacherFilter)
  }, [events, activeSubjects, teacherFilter])

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)
  const totalH = (HOUR_END - HOUR_START) * HOUR_PX

  return (
    <div className="space-y-4">
      {showHeader && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {canEdit ? t.subtitle_hr : t.subtitle_teacher}
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {t.today_btn}
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-gray-900 ml-1">
            {view === 'week'
              ? `${formatDate(weekStart)} – ${formatDate(addDays(weekStart, 6))}`
              : formatDate(currentDate)}
          </span>
        </div>

        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl ml-auto">
          {(['day', 'week'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {v === 'day' ? t.day_view : t.week_view}
            </button>
          ))}
        </div>

        {canEdit && (
          <Button
            size="sm"
            onClick={() => setModal({ open: true })}
            style={{ background: '#1A5276' }}
            className="text-white hover:opacity-90"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> {t.new_event_btn}
          </Button>
        )}
      </div>

      {/* Subject chips + teacher filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {SUBJECTS.map(s => {
          const m = SUBJECT_META[s]
          const on = activeSubjects.includes(s)
          return (
            <button
              key={s}
              onClick={() => toggleSubject(s)}
              className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
              style={on
                ? { color: m.color, background: m.bg, borderColor: m.color }
                : { color: '#9CA3AF', borderColor: '#E5E7EB', background: 'white' }}
            >
              {m.label}
            </button>
          )
        })}

        {teachers.length > 0 && (
          <div className="ml-auto">
            <Select value={teacherFilter || '__all__'} onValueChange={v => setTeacherFilter(v === '__all__' ? '' : (v ?? ''))}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue placeholder={t.all_teachers} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t.all_teachers}</SelectItem>
                {teachers.map(tc => (
                  <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="flex border-b border-gray-100">
          <div className="w-16 shrink-0" />
          {days.map(d => {
            const isToday = isoDate(d) === isoDate(new Date())
            return (
              <div
                key={isoDate(d)}
                className={`flex-1 text-center py-3 border-l border-gray-100 ${isToday ? 'bg-blue-50/30' : ''}`}
              >
                <p className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-[#1A5276]' : 'text-gray-400'}`}>
                  {d.toLocaleDateString('en', { weekday: 'short' })}
                </p>
                <p className={`text-lg font-bold leading-tight mt-0.5 ${isToday ? 'text-[#1A5276]' : 'text-gray-800'}`}>
                  {d.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div className="flex overflow-y-auto" style={{ maxHeight: '600px' }}>
          {/* Hour labels */}
          <div className="w-16 shrink-0 relative bg-gray-50/50" style={{ height: totalH }}>
            {hours.map(h => (
              <div
                key={h}
                className="absolute right-2 text-[10px] text-gray-400 -translate-y-2.5 select-none"
                style={{ top: (h - HOUR_START) * HOUR_PX }}
              >
                {formatHour(h)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map(d => (
            <div key={isoDate(d)} className="flex-1 relative border-l border-gray-100" style={{ height: totalH }}>
              <DayColumn
                date={d}
                events={filtered}
                canEdit={canEdit}
                onSlotClick={(date, time) => setModal({ open: true, date, time })}
                onEventClick={ev => setModal({ open: true, event: ev })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Event modal */}
      {modal.open && (
        <EventModal
          event={modal.event}
          prefillDate={modal.date}
          prefillTime={modal.time}
          teachers={teachers}
          classes={classes}
          onClose={() => setModal({ open: false })}
          onSaved={saved => setEvents(prev => {
            const idx = prev.findIndex(e => e.id === saved.id)
            return idx >= 0 ? prev.map(e => e.id === saved.id ? saved : e) : [...prev, saved]
          })}
          onDeleted={id => setEvents(prev => prev.filter(e => e.id !== id))}
        />
      )}
    </div>
  )
}
