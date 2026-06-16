export type Teacher = {
  id: string
  name: string
  email: string
  created_at: string
}

export type Student = {
  id: string
  teacher_id: string
  name: string
  age: number
  tier: string
  branch: string
  module_current: number
  module_total: number
  enrolled_date: string
  parent_contact: string | null
  notes: string | null
  created_at: string
}

export type TrialStudent = {
  id: string
  teacher_id: string
  name: string
  age: number
  tier: string
  class_id: string | null
  trial_date: string
  parent_name: string | null
  parent_contact: string | null
  notes: string | null
  outcome: 'pending' | 'converting' | 'dropped'
  created_at: string
}

// Recurring class group (e.g. Robotics Junior · Class A · every Saturday 10am)
export type ClassGroup = {
  id: string
  teacher_id: string
  tier: string
  branch: string
  schedule_day: string | null
  schedule_time: string | null
  created_at: string
}

// One student's slot in a class roster
export type ClassStudent = {
  id: string
  class_id: string
  student_id: string
  added_at: string
}

// A single class meeting
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
  'Coding Explorers':  '#1E8449',
  'Junior Coders':     '#1E8449',
  'Robotics Junior':   '#1A5276',
  'Robotics Advanced': '#1A5276',
  'Creative Junior':   '#6C3483',
  'Creative Advanced': '#6C3483',
  'Specialist Junior':  '#117A65',
  'Specialist Advanced':'#117A65',
}

export const TIER_CATEGORY: Record<string, string> = {
  'Coding Explorers':  'Foundation',
  'Junior Coders':     'Foundation',
  'Robotics Junior':   'Robotics',
  'Robotics Advanced': 'Robotics',
  'Creative Junior':   'Creative',
  'Creative Advanced': 'Creative',
  'Specialist Junior':  'Specialist',
  'Specialist Advanced':'Specialist',
}

export const CLASS_OPTIONS = ['Class A', 'Class B', 'Class C', 'Class D', 'Class E', 'Hybrid', 'Online'] as const
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
