function Bone({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded-lg animate-pulse ${className ?? ''}`} />
}

export default function TrialLoading() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Bone className="h-8 w-36" />
          <Bone className="h-4 w-52" />
        </div>
        <Bone className="h-10 w-28 rounded-xl" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Bone className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Bone className="h-4 w-28" />
                  <Bone className="h-3 w-16" />
                </div>
              </div>
              <Bone className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Bone className="h-3 w-32" />
              <Bone className="h-3 w-24" />
            </div>
            <div className="flex gap-2 pt-1 border-t border-gray-50">
              <Bone className="h-8 flex-1 rounded-lg" />
              <Bone className="h-8 flex-1 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
