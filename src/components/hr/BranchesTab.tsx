'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2, MapPin, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Branch {
  id: string
  name: string
  active: boolean
  created_at: string
}

interface Props {
  branches: Branch[]
}

export function BranchesTab({ branches: initialBranches }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [branches, setBranches] = useState<Branch[]>(initialBranches)
  const [newName, setNewName]   = useState('')
  const [adding,  setAdding]    = useState(false)
  const [busy,    setBusy]      = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setAdding(true)

    const { data, error } = await supabase
      .from('branches')
      .insert({ name })
      .select()
      .single()

    if (error) {
      toast.error(error.message.includes('unique') ? 'Branch already exists' : 'Failed to add branch')
    } else {
      setBranches(prev => [...prev, data as Branch])
      setNewName('')
      toast.success(`Branch "${name}" added`)
      router.refresh()
    }
    setAdding(false)
  }

  async function handleToggle(b: Branch) {
    setBusy(b.id)
    const { error } = await supabase
      .from('branches')
      .update({ active: !b.active })
      .eq('id', b.id)

    if (error) {
      toast.error('Failed to update branch')
    } else {
      setBranches(prev => prev.map(x => x.id === b.id ? { ...x, active: !x.active } : x))
      toast.success(b.active ? `"${b.name}" deactivated` : `"${b.name}" activated`)
    }
    setBusy(null)
  }

  async function handleDelete(b: Branch) {
    if (!confirm(`Delete branch "${b.name}"? This cannot be undone.`)) return
    setBusy(b.id)
    const { error } = await supabase.from('branches').delete().eq('id', b.id)

    if (error) {
      toast.error('Failed to delete branch')
      setBusy(null)
    } else {
      setBranches(prev => prev.filter(x => x.id !== b.id))
      toast.success(`Branch "${b.name}" deleted`)
    }
  }

  const active   = branches.filter(b => b.active)
  const inactive = branches.filter(b => !b.active)

  return (
    <div className="max-w-xl space-y-6">

      {/* Add new branch */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Add Branch</h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Bangsar South"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold text-white bg-[#1A5276] hover:bg-[#154360] disabled:opacity-50 transition-colors"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </form>
      </div>

      {/* Active branches */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Active Branches</h2>
          <p className="text-xs text-gray-400 mt-0.5">{active.length} location{active.length !== 1 ? 's' : ''} — shown in student form</p>
        </div>
        {active.length === 0 ? (
          <p className="text-sm text-gray-400 px-5 py-6 text-center">No active branches</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {active.map(b => (
              <li key={b.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-900">{b.name}</span>
                <button
                  onClick={() => handleToggle(b)}
                  disabled={busy === b.id}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
                  title="Deactivate"
                >
                  {busy === b.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <ToggleRight className="w-5 h-5 text-green-500" />}
                </button>
                <button
                  onClick={() => handleDelete(b)}
                  disabled={busy === b.id}
                  className="text-gray-300 hover:text-red-400 disabled:opacity-40 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Inactive branches */}
      {inactive.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-500">Inactive Branches</h2>
            <p className="text-xs text-gray-400 mt-0.5">Hidden from student form</p>
          </div>
          <ul className="divide-y divide-gray-50">
            {inactive.map(b => (
              <li key={b.id} className="flex items-center gap-3 px-5 py-3.5 opacity-60">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-500">{b.name}</span>
                <button
                  onClick={() => handleToggle(b)}
                  disabled={busy === b.id}
                  className="text-gray-300 hover:text-green-500 disabled:opacity-40 transition-colors"
                  title="Activate"
                >
                  {busy === b.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleDelete(b)}
                  disabled={busy === b.id}
                  className="text-gray-300 hover:text-red-400 disabled:opacity-40 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
