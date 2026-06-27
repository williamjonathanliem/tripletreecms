export type Subject = 'coding' | 'chinese' | 'english' | 'maths' | 'science' | 'calligraphy' | 'arts'

export const SUBJECTS: Subject[] = ['coding', 'chinese', 'english', 'maths', 'science', 'calligraphy', 'arts']

export const SUBJECT_META: Record<Subject, { label: string; color: string; bg: string }> = {
  coding:      { label: 'Coding & Robotics', color: '#1A5276', bg: '#E6F1FB' },
  chinese:     { label: 'Chinese',           color: '#C0392B', bg: '#FDEDEC' },
  english:     { label: 'English',           color: '#7D6608', bg: '#FDFBEC' },
  maths:       { label: 'Maths',             color: '#1E8449', bg: '#EAF3DE' },
  science:     { label: 'Science',           color: '#6D4C41', bg: '#EFEBE9' },
  calligraphy: { label: 'Calligraphy',       color: '#4A235A', bg: '#F3E5F5' },
  arts:        { label: 'Arts',              color: '#E65100', bg: '#FFF3E0' },
}

export type Teacher = {
  id: string
  name: string
  email: string
  role: 'teacher' | 'hr'
  subjects: Subject[]
  active: boolean
  created_at: string
}

export type ScheduleEvent = {
  id: string
  class_id: string | null
  teacher_id: string | null
  subject: Subject
  title: string
  description: string | null
  event_date: string
  start_time: string
  end_time: string
  event_type: 'class' | 'trial' | 'makeup' | 'exam' | 'holiday' | 'other'
  colour: string | null
  meeting_link: string | null
  created_by: string | null
  created_at: string
}

export type Student = {
  id: string
  teacher_id: string
  name: string
  age: number
  tier: string
  branch: string
  subject: Subject
  module_current: number
  module_total: number
  enrolled_date: string
  parent_contact: string | null
  parent_email: string | null
  notes: string | null
  fee_status: 'paid' | 'unpaid' | 'partial'
  fee_note: string | null
  created_at: string
}

export type Announcement = {
  id: string
  title: string
  body: string
  created_by: string | null
  created_at: string
  expires_at: string | null
}

export type TeacherAvailability = {
  id: string
  teacher_id: string
  week_start: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
  note: string | null
  created_at: string
}

export type TrialStudent = {
  id: string
  teacher_id: string
  name: string
  age: number
  tier: string
  subject: Subject
  class_id: string | null
  trial_date: string
  parent_name: string | null
  parent_contact: string | null
  notes: string | null
  outcome: 'pending' | 'converting' | 'dropped'
  follow_up: boolean
  created_at: string
}

// Recurring class group
export type ClassGroup = {
  id: string
  teacher_id: string
  tier: string
  branch: string
  subject: Subject
  schedule_day: string | null
  schedule_time: string | null
  created_at: string
}

export type ClassStudent = {
  id: string
  class_id: string
  student_id: string
  added_at: string
}

export type ClassSession = {
  id: string
  class_id: string
  teacher_id: string
  session_date: string
  session_time: string
  notes: string | null
  created_at: string
}

export type AttendanceRecord = {
  id: string
  session_id: string
  class_id: string
  student_id: string
  status: 'present' | 'absent' | 'late' | 'excused'
  note: string | null
  created_at: string
}

export type AttendanceWithStudent = AttendanceRecord & {
  student: Pick<Student, 'id' | 'name'>
}

export type ClassFeedback = {
  id: string
  session_id: string
  teacher_id: string
  how_was_class: string
  topics_covered: string
  other_comments: string | null
  created_at: string
}

export const TIERS = [
  'Coding Explorers',
  'Junior Coders',
  'Robotics Junior',
  'Robotics Advanced',
  'Creative Junior',
  'Creative Advanced',
  'Specialist Junior',
  'Specialist Advanced',
] as const

export type Tier = (typeof TIERS)[number]

export const TIER_COLORS: Record<string, string> = {
  'Coding Explorers':   '#1E8449',
  'Junior Coders':      '#1E8449',
  'Robotics Junior':    '#1A5276',
  'Robotics Advanced':  '#1A5276',
  'Creative Junior':    '#6C3483',
  'Creative Advanced':  '#6C3483',
  'Specialist Junior':  '#117A65',
  'Specialist Advanced':'#117A65',
}

export const TIER_CATEGORY: Record<string, string> = {
  'Coding Explorers':   'Foundation',
  'Junior Coders':      'Foundation',
  'Robotics Junior':    'Robotics',
  'Robotics Advanced':  'Robotics',
  'Creative Junior':    'Creative',
  'Creative Advanced':  'Creative',
  'Specialist Junior':  'Specialist',
  'Specialist Advanced':'Specialist',
}

export const CLASS_OPTIONS = ['Class A', 'Class B', 'Class C', 'Class D', 'Class E', 'Hybrid', 'Online'] as const
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
