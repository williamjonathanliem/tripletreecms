function Bone({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded-lg animate-pulse ${className ?? ''}`} />
}

export default function StudentsLoading() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Bone className="h-8 w-28" />
          <Bone className="h-4 w-44" />
        </div>
        <Bone className="h-10 w-32 rounded-xl" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <Bone className="h-9 flex-1 rounded-xl" />
          <Bone className="h-9 w-36 rounded-xl" />
        </div>
        <div className="divide-y divide-gray-50">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <Bone className="w-9 h-9 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-4 w-36" />
                <Bone className="h-3 w-24" />
              </div>
              <Bone className="h-6 w-24 rounded-full" />
              <div className="w-24 space-y-1">
                <Bone className="h-1.5 w-full rounded-full" />
                <Bone className="h-3 w-10 ml-auto" />
              </div>
              <Bone className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
