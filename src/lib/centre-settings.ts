import { createAdminClient } from './supabase/admin'

export type CentreSettings = {
  centre_name: string
  phone: string | null
  contact_email: string | null
  address: string | null
  hours_weekday: string | null
  hours_weekend: string | null
}

export async function getCentreSettings(): Promise<CentreSettings> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('centre_settings').select('*').eq('id', 1).single()
    return {
      centre_name:   data?.centre_name   ?? process.env.CENTRE_NAME  ?? 'Triple Tree Enrichment Centre',
      phone:         data?.phone         ?? process.env.CENTRE_PHONE  ?? null,
      contact_email: data?.contact_email ?? process.env.CENTRE_EMAIL  ?? process.env.SMTP_FROM ?? null,
      address:       data?.address       ?? process.env.CENTRE_ADDRESS ?? null,
      hours_weekday: data?.hours_weekday ?? null,
      hours_weekend: data?.hours_weekend ?? null,
    }
  } catch {
    return {
      centre_name:   process.env.CENTRE_NAME    ?? 'Triple Tree Enrichment Centre',
      phone:         process.env.CENTRE_PHONE   ?? null,
      contact_email: process.env.CENTRE_EMAIL   ?? process.env.SMTP_FROM ?? null,
      address:       process.env.CENTRE_ADDRESS ?? null,
      hours_weekday: null,
      hours_weekend: null,
    }
  }
}
