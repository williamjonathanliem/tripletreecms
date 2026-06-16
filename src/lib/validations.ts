import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 characters')
  .regex(/[A-Z]/, 'At least one uppercase letter')
  .regex(/[0-9]/, 'At least one number')

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const studentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.coerce.number().min(4, 'Minimum age 4').max(18, 'Maximum age 18'),
  tier: z.string().min(1, 'Tier is required'),
  branch: z.string().min(1, 'Branch is required'),
  module_current: z.coerce.number().min(0),
  module_total: z.coerce.number().min(1),
  enrolled_date: z.string().min(1, 'Enrolled date is required'),
  parent_contact: z.string().optional(),
  notes: z.string().optional(),
})

export const trialStudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.coerce.number().min(4, 'Minimum age 4').max(18, 'Maximum age 18'),
  tier: z.string().min(1, 'Please select a trial class'),
  class_id: z.string().optional(),
  trial_date: z.string().min(1, 'Trial date is required'),
  parent_name: z.string().optional(),
  parent_contact: z.string().optional(),
  notes: z.string().optional(),
})

// Class group (recurring)
export const classSchema = z.object({
  tier: z.string().min(1, 'Tier is required'),
  branch: z.string().min(1, 'Class is required'),
  schedule_day: z.string().optional(),
  schedule_time: z.string().optional(),
})

// Individual session
export const sessionSchema = z.object({
  session_date: z.string().min(1, 'Date is required'),
  session_time: z.string().min(1, 'Time is required'),
  notes: z.string().optional(),
})

// Feedback references a class group
export const feedbackSchema = z.object({
  class_id: z.string().min(1, 'Class is required'),
  how_was_class: z.string().min(1, 'Required'),
  topics_covered: z.string().min(1, 'Required'),
  other_comments: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type StudentInput = z.infer<typeof studentSchema>
export type TrialStudentInput = z.infer<typeof trialStudentSchema>
export type ClassInput = z.infer<typeof classSchema>
export type SessionInput = z.infer<typeof sessionSchema>
export type FeedbackInput = z.infer<typeof feedbackSchema>

