'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Building2, Phone, Mail, MapPin, Clock, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Settings = {
  centre_name:   string
  phone:         string
  contact_email: string
  address:       string
  hours_weekday: string
  hours_weekend: string
}

const DEFAULTS: Settings = {
  centre_name:   'Triple Tree Enrichment Centre',
  phone:         '',
  contact_email: '',
  address:       '',
  hours_weekday: '',
  hours_weekend: '',
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      {children}
    </div>
  )
}

export function SettingsTab() {
  const [form,    setForm]    = useState<Settings>(DEFAULTS)
  const [saved,   setSaved]   = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  const isDirty = JSON.stringify(form) !== JSON.stringify(saved)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('centre_settings').select('*').eq('id', 1).single()
    if (data) {
      const s: Settings = {
        centre_name:   data.centre_name   ?? '',
        phone:         data.phone         ?? '',
        contact_email: data.contact_email ?? '',
        address:       data.address       ?? '',
        hours_weekday: data.hours_weekday ?? '',
        hours_weekend: data.hours_weekend ?? '',
      }
      setForm(s)
      setSaved(s)
    }
    setLoading(false)
  }

  function set(key: keyof Settings, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/update-centre-settings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Failed to save settings'); return }
      setSaved(form)
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Centre info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">Centre Information</p>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-400">
            This information appears in the footer of all outgoing emails — fee reminders, parent notices, and invitations.
          </p>

          <Field label="Centre name" icon={Building2}>
            <input
              type="text"
              value={form.centre_name}
              onChange={e => set('centre_name', e.target.value)}
              placeholder="Triple Tree Enrichment Centre"
              className={input}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone" icon={Phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+60 12-345 6789"
                className={input}
              />
            </Field>
            <Field label="Contact email" icon={Mail}>
              <input
                type="email"
                value={form.contact_email}
                onChange={e => set('contact_email', e.target.value)}
                placeholder="hello@tripletree.my"
                className={input}
              />
            </Field>
          </div>

          <Field label="Address" icon={MapPin}>
            <input
              type="text"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Mont Kiara, Kuala Lumpur"
              className={input}
            />
          </Field>
        </div>
      </div>

      {/* Operating hours */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">Operating Hours</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Mon – Fri" icon={Clock}>
              <input
                type="text"
                value={form.hours_weekday}
                onChange={e => set('hours_weekday', e.target.value)}
                placeholder="11:00 AM – 7:00 PM"
                className={input}
              />
            </Field>
            <Field label="Sat – Sun" icon={Clock}>
              <input
                type="text"
                value={form.hours_weekend}
                onChange={e => set('hours_weekend', e.target.value)}
                placeholder="10:00 AM – 6:00 PM"
                className={input}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: '#111827' }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
