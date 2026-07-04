import Link from 'next/link'
import { ShieldOff, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <ShieldOff className="w-7 h-7 text-gray-400" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Nothing here</h1>
      <p className="text-sm text-gray-500 max-w-xs mb-7">
        This page doesn&apos;t exist or you don&apos;t have permission to view it.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>
    </div>
  )
}
