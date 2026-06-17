function Bone({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded-lg animate-pulse ${className ?? ''}`} />
}

export default function ClassesLoading() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Bone className="h-8 w-24" />
          <Bone className="h-4 w-48" />
        </div>
        <Bone className="h-10 w-28 rounded-xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <Bone className="h-1.5 w-full rounded-none" />
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <Bone className="h-5 w-36" />
                  <Bone className="h-5 w-16 rounded-full" />
                </div>
                <Bone className="h-8 w-8 rounded-lg" />
              </div>
              <Bone className="h-3 w-24" />
              <div className="flex gap-3 pt-1 border-t border-gray-50">
                <Bone className="h-3 w-20" />
                <Bone className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
